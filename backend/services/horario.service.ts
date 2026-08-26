import { HorarioModel } from '../models/horario.model.js';
import { InstructorModel } from '../models/instructor.model.js';
import { FichaModel } from '../models/ficha.model.js';
import { AmbienteModel } from '../models/ambiente.model.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors.js';
import { getLunesSemanaActual } from '../utils/date.js';
import { ROLES, RoleKey } from '../constants/roles.js';
import { AlertaService, TIPOS_ALERTA } from './alerta.service.js';
import pool from '../config/db.js';

export const HorarioService = {
  async getAll(userId?: number, roles?: RoleKey[], semana?: string) {
    // P22: instructor solo ve sus propios horarios
    if (userId && roles && roles.length === 1 && roles[0] === ROLES.INSTRUCTOR) {
      const instructor = await InstructorModel.findByUsuarioId(userId);
      if (!instructor) return [];
      return HorarioModel.findAllByInstructorId(instructor.id, semana);
    }
    return HorarioModel.findAll(semana);
  },

  async getById(id: number) {
    const horario = await HorarioModel.findById(id);
    if (!horario) throw new NotFoundError('Horario no encontrado');
    return horario;
  },

  async create(data: {
    ficha_id: number;
    instructor_id: number;
    competencia_id: number;
    rap_id?: number | null;
    ambiente_id?: number | null;
    dia_semana: number;
    hora_inicio: string;
    hora_fin: string;
    tipo_actividad_id?: number | null;
    jornada_id: number;
    semana?: string;
  }, origin: 'import' | 'ui' = 'ui') {
    const instructor = await InstructorModel.findById(data.instructor_id);
    if (!instructor) throw new NotFoundError('Instructor no encontrado');

    const ficha = await FichaModel.findById(data.ficha_id);
    if (!ficha) throw new NotFoundError('Ficha no encontrada');

    // RN-27: el RAP debe pertenecer al programa del grupo
    if (data.rap_id) {
      const rapOk = await HorarioModel.rapPerteneceAlProgramaDeFicha(data.rap_id, data.ficha_id);
      if (!rapOk) {
        throw new ValidationError('El RAP no pertenece al programa del grupo (RN-27)');
      }
    }

    if (new Date(`2000-01-01T${data.hora_fin}`).getTime() <= new Date(`2000-01-01T${data.hora_inicio}`).getTime()) {
      throw new ValidationError('La hora de fin debe ser posterior a la hora de inicio');
    }

    if (ficha.modalidad !== 'virtual' && !data.ambiente_id) {
      throw new ValidationError('Las fichas presenciales requieren un ambiente asignado');
    }

    const semana = data.semana ?? getLunesSemanaActual();

    const hasOverlap = await HorarioModel.hasOverlap(
      data.instructor_id,
      data.dia_semana,
      data.hora_inicio,
      data.hora_fin,
      semana,
    );
    if (hasOverlap) {
      throw new ConflictError('El instructor tiene un horario superpuesto en ese dia y hora (RN-04)');
    }

    // Conflictos que en ACCION INTERACTIVA (boton del sistema) se BLOQUEAN, pero
    // en carga masiva por Excel solo generan ALERTA (permisivo para no rechazar
    // el archivo real): RN-05 (ambiente ocupado), RN-06 (RAP compartido), carga >40h.
    const conflictos: { tipo: string; mensaje: string }[] = [];

    let ambienteOcupado = false;
    if (data.ambiente_id) {
      const tieneBloqueo = await AmbienteModel.hasBloqueoVigente(data.ambiente_id, semana);
      if (tieneBloqueo) {
        throw new ValidationError('El ambiente tiene un bloqueo temporal vigente en esa semana (RN-09)');
      }
      ambienteOcupado = await HorarioModel.hasAmbienteOcupado(
        data.ambiente_id,
        data.dia_semana,
        data.jornada_id,
        semana,
      );
      if (ambienteOcupado) {
        conflictos.push({ tipo: TIPOS_ALERTA.AMBIENTE_OCUPADO, mensaje: 'Ambiente ocupado en la misma jornada (RN-05).' });
      }
    }

    let rapCompartido = false;
    if (data.rap_id) {
      rapCompartido = await HorarioModel.rapAsignadoAOtroEnFicha(data.ficha_id, data.rap_id, data.instructor_id);
      if (rapCompartido) {
        conflictos.push({ tipo: TIPOS_ALERTA.RAP_COMPARTIDO, mensaje: `RN-06: el RAP ${data.rap_id} ya esta a cargo de otro instructor en este grupo. Reasignelo a uno solo.` });
      }
    }

    const horasActuales = await HorarioModel.getHorasPorInstructor(data.instructor_id, semana);
    const nuevasHoras = ((new Date(`2000-01-01T${data.hora_fin}`).getTime() - new Date(`2000-01-01T${data.hora_inicio}`).getTime()) / (1000 * 60 * 60));
    const totalHoras = horasActuales + nuevasHoras;
    if (totalHoras > 40) {
      conflictos.push({ tipo: TIPOS_ALERTA.HORAS_EXCEDIDAS, mensaje: `El instructor excede el limite de 40 horas semanales (total ${totalHoras}h).` });
    }

    let alertaJornadaRestringida = false;
    const esDePlanta = await HorarioModel.isInstructorDePlanta(data.instructor_id);
    const esNocheOFinde = await HorarioModel.isJornadaNocturnaOFinDeSemana(data.jornada_id, data.dia_semana);
    if (esDePlanta && esNocheOFinde) {
      alertaJornadaRestringida = true;
    }

    // Boton del sistema: se bloquea hasta corregir. La carga por Excel no.
    if (origin === 'ui' && conflictos.length > 0) {
      throw new ConflictError(conflictos.map((c) => c.mensaje).join(' '));
    }

    const id = await HorarioModel.create({ ...data, semana });
    const horario = await HorarioModel.findById(id);

    // Persistir alertas (llega aca en carga masiva, o en UI sin conflictos).
    for (const c of conflictos) {
      if (c.tipo === TIPOS_ALERTA.RAP_COMPARTIDO && data.rap_id) {
        await AlertaService.rapCompartido(data.instructor_id, data.ficha_id, data.rap_id, c.mensaje);
      } else {
        await AlertaService.crear({ instructor_id: data.instructor_id, tipo: c.tipo, mensaje: c.mensaje, semana, total_horas: totalHoras });
      }
    }
    if (alertaJornadaRestringida) {
      await AlertaService.crear({ instructor_id: data.instructor_id, tipo: TIPOS_ALERTA.JORNADA_RESTRINGIDA, semana, total_horas: totalHoras,
        mensaje: `Instructor de planta en jornada nocturna o fin de semana (semana ${semana}).` });
    }
    if (totalHoras < 20) {
      await AlertaService.crear({ instructor_id: data.instructor_id, tipo: TIPOS_ALERTA.HORAS_INSUFICIENTES, semana, total_horas: totalHoras,
        mensaje: `Carga por debajo del minimo de 20h: ${totalHoras}h en la semana ${semana}.` });
    }

    return {
      ...horario,
      alerta_ambiente_ocupado: ambienteOcupado,
      alerta_jornada_restringida: alertaJornadaRestringida,
      total_horas: totalHoras,
      instructor_id: data.instructor_id,
    };
  },

  async update(id: number, data: {
    dia_semana?: number;
    hora_inicio?: string;
    hora_fin?: string;
    competencia_id?: number;
    rap_id?: number | null;
    ambiente_id?: number | null;
    tipo_actividad_id?: number | null;
  }) {
    // P23: leer registro raw para obtener IDs numericos (findById devuelve HorarioDetail sin ellos)
    const [rawRows] = await pool.query(
      'SELECT * FROM horarios WHERE id = ? AND activo = TRUE',
      [id],
    );
    const existing = (rawRows as any[])[0];
    if (!existing) throw new NotFoundError('Horario no encontrado');

    // RN-27: si se cambia el RAP, debe pertenecer al programa del grupo
    if (data.rap_id !== undefined && data.rap_id !== null) {
      const rapOk = await HorarioModel.rapPerteneceAlProgramaDeFicha(data.rap_id, existing.ficha_id);
      if (!rapOk) {
        throw new ValidationError('El RAP no pertenece al programa del grupo (RN-27)');
      }
    }

    // Valores finales (merge datos nuevos + existentes)
    const finalDia = data.dia_semana ?? existing.dia_semana;
    const finalHoraInicio = data.hora_inicio ?? existing.hora_inicio;
    const finalHoraFin = data.hora_fin ?? existing.hora_fin;
    const finalAmbienteId = data.ambiente_id !== undefined ? data.ambiente_id : existing.ambiente_id;
    const semana: string = existing.semana instanceof Date
      ? existing.semana.toISOString().split('T')[0]
      : String(existing.semana);

    // Validar hora_fin > hora_inicio
    const tInicio = new Date(`2000-01-01T${finalHoraInicio}`).getTime();
    const tFin = new Date(`2000-01-01T${finalHoraFin}`).getTime();
    if (tFin <= tInicio) {
      throw new ValidationError('La hora de fin debe ser posterior a la hora de inicio');
    }

    // RN-04: solapamiento del instructor (hard block)
    if (data.dia_semana !== undefined || data.hora_inicio !== undefined || data.hora_fin !== undefined) {
      const hasOverlap = await HorarioModel.hasOverlap(
        existing.instructor_id,
        finalDia,
        finalHoraInicio,
        finalHoraFin,
        semana,
        id,
      );
      if (hasOverlap) {
        throw new ConflictError('El instructor tiene un horario superpuesto en ese dia y hora (RN-04)');
      }
    }

    // RN-09: bloqueo de ambiente (hard block)
    if (finalAmbienteId) {
      const tieneBloqueo = await AmbienteModel.hasBloqueoVigente(finalAmbienteId, semana);
      if (tieneBloqueo) {
        throw new ValidationError('El ambiente tiene un bloqueo temporal vigente en esa semana (RN-09)');
      }
    }

    // RN-05 (edicion interactiva = boton): BLOQUEA si el ambiente (aula/lab) queda
    // ocupado en esa jornada. Los talleres no cuentan (ver hasAmbienteOcupado).
    if (finalAmbienteId && (data.ambiente_id !== undefined || data.dia_semana !== undefined)) {
      const ocupado = await HorarioModel.hasAmbienteOcupado(
        finalAmbienteId,
        finalDia,
        existing.jornada_id,
        semana,
        id,
      );
      if (ocupado) {
        throw new ConflictError('El ambiente ya esta ocupado en esa jornada (RN-05). Elija otro ambiente u horario.');
      }
    }

    // RN-06 (edicion interactiva): BLOQUEA si el RAP quedaria a cargo de otro
    // instructor en el mismo grupo. La correccion (reasignar) si se permite.
    const finalRapId = data.rap_id !== undefined ? data.rap_id : existing.rap_id;
    if (finalRapId) {
      const compartido = await HorarioModel.rapAsignadoAOtroEnFicha(existing.ficha_id, finalRapId, existing.instructor_id);
      if (compartido) {
        throw new ConflictError(`RN-06: el RAP ${finalRapId} ya esta a cargo de otro instructor en este grupo. Reasignelo a uno solo.`);
      }
    }

    // RN-03: jornada restringida (soft alert) — revalida si cambia dia
    let alertaJornadaRestringida = false;
    if (data.dia_semana !== undefined) {
      const esDePlanta = await HorarioModel.isInstructorDePlanta(existing.instructor_id);
      const esNocheOFinde = await HorarioModel.isJornadaNocturnaOFinDeSemana(existing.jornada_id, finalDia);
      if (esDePlanta && esNocheOFinde) {
        alertaJornadaRestringida = true;
      }
    }

    await HorarioModel.update(id, data);
    const updated = await HorarioModel.findById(id);

    return {
      ...updated,
      alerta_ambiente_ocupado: false, // si estuviera ocupado, se habria bloqueado arriba
      alerta_jornada_restringida: alertaJornadaRestringida,
    };
  },

  async toggleActivo(id: number, motivo?: string) {
    // existsById (no findById): findById filtra activos por su JOIN, y aqui
    // necesitamos poder REACTIVAR un horario inactivo (Laura 05/08).
    const existe = await HorarioModel.existsById(id);
    if (!existe) throw new NotFoundError('Horario no encontrado');

    const nuevoEstado = await HorarioModel.toggleActivo(id, motivo);
    return { activo: nuevoEstado };
  },

  async aprobar(id: number) {
    const horario = await HorarioModel.findById(id);
    if (!horario) throw new NotFoundError('Horario no encontrado');

    await HorarioModel.aprobar(id);
    return HorarioModel.findById(id);
  },

  async rechazar(id: number, motivo: string) {
    const horario = await HorarioModel.findById(id);
    if (!horario) throw new NotFoundError('Horario no encontrado');

    if (!motivo || motivo.trim().length === 0) {
      throw new ValidationError('El motivo de rechazo es obligatorio');
    }

    await HorarioModel.rechazar(id, motivo);
    return HorarioModel.findById(id);
  },

  async updateMultiDia(id: number, data: {
    dia_ids: number[];
    hora_inicio: string;
    hora_fin: string;
    jornada_id: number;
    ambiente_id?: number | null;
  }) {
    const existing = await HorarioModel.findById(id);
    if (!existing) throw new NotFoundError('Horario no encontrado');

    const existingRecord = await pool.query(
      'SELECT ficha_id, instructor_id, competencia_id, dia_semana, hora_inicio, hora_fin, jornada_id, ambiente_id, semana FROM horarios WHERE id = ?',
      [id],
    );
    const base = (existingRecord as any[])[0];
    if (!base) throw new NotFoundError('Horario no encontrado');

    const currentDias = await pool.query(
      'SELECT id, dia_semana FROM horarios WHERE ficha_id = ? AND instructor_id = ? AND competencia_id = ? AND hora_inicio = ? AND hora_fin = ? AND jornada_id = ? AND semana = ? AND activo = TRUE',
      [base.ficha_id, base.instructor_id, base.competencia_id, base.hora_inicio, base.hora_fin, base.jornada_id, base.semana],
    );
    const currentDiasRows = (currentDias as any[])[0] as any[];
    const currentDiaIds = new Set(currentDiasRows.map((r: any) => r.dia_semana));
    const currentDiaRecords = currentDiasRows;
    const newDias = new Set(data.dia_ids);

    const diasToRemove = currentDiasRows.filter((r: any) => !newDias.has(r.dia_semana));
    const diasToAdd = data.dia_ids.filter((d: number) => !currentDiaIds.has(d));
    const diasToUpdate = data.dia_ids.filter((d: number) => currentDiaIds.has(d));

    for (const record of diasToRemove as any[]) {
      await pool.query('UPDATE horarios SET activo = FALSE WHERE id = ?', [record.id]);
    }

    for (const dia of diasToAdd) {
      const hasOverlap = await HorarioModel.hasOverlap(
        base.instructor_id,
        dia,
        data.hora_inicio,
        data.hora_fin,
        base.semana,
      );
      if (hasOverlap) {
        throw new ConflictError(`El instructor tiene un horario superpuesto el dia ${dia} (RN-04)`);
      }

      const ambienteId = data.ambiente_id ?? base.ambiente_id;
      if (ambienteId) {
        const tieneBloqueo = await AmbienteModel.hasBloqueoVigente(ambienteId, base.semana);
        if (tieneBloqueo) {
          throw new ValidationError('El ambiente tiene un bloqueo temporal vigente en esa semana (RN-09)');
        }
        // RN-05 (edicion interactiva): bloquea si el aula/lab ya esta ocupado ese dia.
        const ocupado = await HorarioModel.hasAmbienteOcupado(ambienteId, dia, data.jornada_id, base.semana);
        if (ocupado) {
          throw new ConflictError(`El ambiente ya esta ocupado en esa jornada el dia ${dia} (RN-05). Elija otro ambiente u horario.`);
        }
      }

      await pool.query(
        "INSERT INTO horarios (ficha_id, instructor_id, competencia_id, ambiente_id, dia_semana, hora_inicio, hora_fin, jornada_id, semana, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'aprobado')",
        [base.ficha_id, base.instructor_id, base.competencia_id, data.ambiente_id ?? base.ambiente_id, dia, data.hora_inicio, data.hora_fin, data.jornada_id, base.semana],
      );
    }

    for (const dia of diasToUpdate) {
      const record = currentDiaRecords.find((r: any) => r.dia_semana === dia);
      if (record) {
        await pool.query(
          'UPDATE horarios SET hora_inicio = ?, hora_fin = ?, jornada_id = ?, ambiente_id = ? WHERE id = ?',
          [data.hora_inicio, data.hora_fin, data.jornada_id, data.ambiente_id ?? base.ambiente_id, record.id],
        );
      }
    }

    return HorarioModel.findAll();
  },

  async suspender(id: number, motivo: string) {
    const horario = await HorarioModel.findById(id);
    if (!horario) throw new NotFoundError('Horario no encontrado');

    await HorarioModel.suspender(id, motivo);
    return HorarioModel.findById(id);
  },
};
