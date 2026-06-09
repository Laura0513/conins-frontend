import { HorarioModel } from '../models/horario.model.js';
import { InstructorModel } from '../models/instructor.model.js';
import { FichaModel } from '../models/ficha.model.js';
import { AmbienteModel } from '../models/ambiente.model.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors.js';
import { getLunesSemanaActual } from '../utils/date.js';
import pool from '../config/db.js';

export const HorarioService = {
  async getAll() {
    return HorarioModel.findAll();
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
    ambiente_id?: number | null;
    dia_semana: number;
    hora_inicio: string;
    hora_fin: string;
    jornada_id: number;
    semana?: string;
  }) {
    const instructor = await InstructorModel.findById(data.instructor_id);
    if (!instructor) throw new NotFoundError('Instructor no encontrado');

    const ficha = await FichaModel.findById(data.ficha_id);
    if (!ficha) throw new NotFoundError('Ficha no encontrada');

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

    let ambienteOcupado = false;
    if (data.ambiente_id) {
      ambienteOcupado = await HorarioModel.hasAmbienteOcupado(
        data.ambiente_id,
        data.dia_semana,
        data.jornada_id,
        semana,
      );

      const tieneBloqueo = await AmbienteModel.hasBloqueoVigente(data.ambiente_id, semana);
      if (tieneBloqueo) {
        throw new ValidationError('El ambiente tiene un bloqueo temporal vigente en esa semana (RN-09)');
      }
    }

    let alertaJornadaRestringida = false;
    const esDePlanta = await HorarioModel.isInstructorDePlanta(data.instructor_id);
    const esNocheOFinde = await HorarioModel.isJornadaNocturnaOFinDeSemana(data.jornada_id, data.dia_semana);
    if (esDePlanta && esNocheOFinde) {
      alertaJornadaRestringida = true;
    }

    const horasActuales = await HorarioModel.getHorasPorInstructor(data.instructor_id, semana);
    const nuevasHoras = ((new Date(`2000-01-01T${data.hora_fin}`).getTime() - new Date(`2000-01-01T${data.hora_inicio}`).getTime()) / (1000 * 60 * 60));
    const totalHoras = horasActuales + nuevasHoras;

    if (totalHoras > 40) {
      throw new ValidationError(`El instructor excede el limite de 40 horas semanales (actual: ${horasActuales}h, nuevas: ${nuevasHoras}h)`);
    }

    const id = await HorarioModel.create({ ...data, semana });
    const horario = await HorarioModel.findById(id);

    return {
      ...horario,
      alerta_ambiente_ocupado: ambienteOcupado,
      alerta_jornada_restringida: alertaJornadaRestringida,
    };
  },

  async update(id: number, data: {
    dia_semana?: number;
    hora_inicio?: string;
    hora_fin?: string;
    competencia_id?: number;
    ambiente_id?: number | null;
  }) {
    const horario = await HorarioModel.findById(id);
    if (!horario) throw new NotFoundError('Horario no encontrado');

    if (data.hora_inicio && data.hora_fin) {
      if (new Date(`2000-01-01T${data.hora_fin}`).getTime() <= new Date(`2000-01-01T${data.hora_inicio}`).getTime()) {
        throw new ValidationError('La hora de fin debe ser posterior a la hora de inicio');
      }
    }

    const existing = await HorarioModel.findById(id);
    if (data.dia_semana || data.hora_inicio || data.hora_fin) {
      const semana = getLunesSemanaActual();

      const ambienteId = data.ambiente_id ?? (existing as any).ambiente_id;
      if (ambienteId) {
        const tieneBloqueo = await AmbienteModel.hasBloqueoVigente(ambienteId, semana);
        if (tieneBloqueo) {
          throw new ValidationError('El ambiente tiene un bloqueo temporal vigente en esa semana (RN-09)');
        }
      }

      const hasOverlap = await HorarioModel.hasOverlap(
        (existing as any).instructor_id,
        data.dia_semana ?? (existing as any).dia_semana,
        data.hora_inicio ?? (existing as any).hora_inicio,
        data.hora_fin ?? (existing as any).hora_fin,
        semana,
        id,
      );
      if (hasOverlap) {
        throw new ConflictError('El instructor tiene un horario superpuesto en ese dia y hora (RN-04)');
      }
    }

    await HorarioModel.update(id, data);
    return HorarioModel.findById(id);
  },

  async toggleActivo(id: number, motivo?: string) {
    const horario = await HorarioModel.findById(id);
    if (!horario) throw new NotFoundError('Horario no encontrado');

    const nuevoEstado = await HorarioModel.toggleActivo(id, motivo);
    return { activo: nuevoEstado };
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
      }

      await pool.query(
        'INSERT INTO horarios (ficha_id, instructor_id, competencia_id, ambiente_id, dia_semana, hora_inicio, hora_fin, jornada_id, semana) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
};
