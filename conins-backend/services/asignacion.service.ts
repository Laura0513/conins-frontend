import { AsignacionModel } from '../models/asignacion.model.js';
import { AlertaService, TIPOS_ALERTA } from './alerta.service.js';
import { AsignacionCompetenciaModel } from '../models/asignacion-competencia.model.js';
import { InstructorModel } from '../models/instructor.model.js';
import { FichaModel } from '../models/ficha.model.js';
import { NotFoundError, ValidationError, ForbiddenError, ConflictError } from '../utils/errors.js';
import { ROLES, RoleKey } from '../constants/roles.js';
import pool from '../config/db.js';

export const AsignacionService = {
  async getAll(userId?: number, roles?: RoleKey[]) {
    // P22: instructor solo ve sus propias asignaciones
    if (userId && roles && roles.length === 1 && roles[0] === ROLES.INSTRUCTOR) {
      const instructor = await InstructorModel.findByUsuarioId(userId);
      if (!instructor) return [];
      return AsignacionModel.findAllByInstructorId(instructor.id);
    }
    return AsignacionModel.findAll();
  },

  async getById(id: number) {
    const asignacion = await AsignacionModel.findById(id);
    if (!asignacion) throw new NotFoundError('Asignacion no encontrada');
    return asignacion;
  },

  async create(data: {
    instructor_id: number;
    ficha_id: number;
    jornada_id?: number | null;
    es_lider_ficha?: boolean;
    es_provisional?: boolean;
    autorizado_por_id?: number | null;
    motivo_provisional?: string | null;
    competencia_ids: number[];
    usuarioId?: number;
  }, origin: 'import' | 'ui' = 'ui') {
    const instructor = await InstructorModel.findById(data.instructor_id);
    if (!instructor) throw new NotFoundError('Instructor no encontrado');

    const ficha = await FichaModel.findById(data.ficha_id);
    if (!ficha) throw new NotFoundError('Ficha no encontrada');
    if (ficha.estado === 'Finalizada') throw new ForbiddenError('No se pueden crear asignaciones en fichas finalizadas');

    const tieneNovedad = await AsignacionModel.tieneNovedadActiva(data.instructor_id);
    if (tieneNovedad) throw new ValidationError('El instructor tiene una novedad activa vigente (RN-08)');

    for (const competenciaId of data.competencia_ids) {
      // RN-06: en accion interactiva (boton) se BLOQUEA; en carga masiva por
      // Excel se deja pasar (permisivo) y el conflicto real se alerta a nivel de
      // horario/RAP para su correccion.
      const hasRap = await AsignacionModel.hasRapEnFicha(data.ficha_id, competenciaId);
      if (hasRap && origin === 'ui') {
        throw new ConflictError('Un RAP de esta competencia ya esta asignado a otro instructor en la misma ficha (RN-06)');
      }

      const [rows] = await pool.query(
        `SELECT 1 FROM instructor_competencias_habilitadas
         WHERE instructor_id = ? AND competencia_id = ?
         LIMIT 1`,
        [data.instructor_id, competenciaId],
      );
      if ((rows as any[]).length === 0) {
        throw new ValidationError(`El instructor no tiene habilitada esta competencia segun su contrato (RN-13)`);
      }
    }

    // El UNIQUE(instructor_id, ficha_id) no distingue activo/inactivo. Si existe
    // una asignacion inactiva (historica), se reactiva en vez de fallar (Laura 29/07).
    const existente = await AsignacionModel.findRawByInstructorFicha(data.instructor_id, data.ficha_id);
    if (existente) {
      if ((existente as any).activo) {
        throw new ConflictError('Ya existe una asignacion activa para este instructor en esta ficha');
      }
      await AsignacionModel.reactivar((existente as any).id, {
        jornada_id: data.jornada_id,
        es_lider_ficha: data.es_lider_ficha,
        es_provisional: data.es_provisional,
        competencia_ids: data.competencia_ids,
      });
      return AsignacionModel.findById((existente as any).id);
    }

    const id = await AsignacionModel.create(data);

    // Alerta SOFT: asignacion provisional (instructor fuera de su area). Visible
    // hasta que el admin la atienda.
    if (data.es_provisional) {
      const inst = await InstructorModel.findById(data.instructor_id);
      const fic = await FichaModel.findById(data.ficha_id);
      const nombre = (inst as any)?.nombre ?? `instructor #${data.instructor_id}`;
      const grupo = (fic as any)?.numero_ficha ?? data.ficha_id;
      const detalle = data.motivo_provisional ? ` Motivo: ${data.motivo_provisional}.` : '';
      await AlertaService.crear({
        instructor_id: data.instructor_id,
        tipo: TIPOS_ALERTA.ASIGNACION_PROVISIONAL,
        ficha_id: data.ficha_id,
        mensaje: `El instructor ${nombre} fue asignado de forma provisional al grupo ${grupo} (fuera de su area tecnica).${detalle}`,
      });
    }

    return AsignacionModel.findById(id);
  },

  async update(id: number, data: {
    competencia_id?: number;
    ambiente_excepcion_id?: number | null;
    es_lider_ficha?: boolean;
    nuevo_instructor_id?: number;
  }) {
    const asignacion = await AsignacionModel.findById(id);
    if (!asignacion) throw new NotFoundError('Asignacion no encontrada');

    if (data.competencia_id || data.ambiente_excepcion_id) {
      const competenciasActuales = await AsignacionCompetenciaModel.findByAsignacion(id);
      for (const comp of competenciasActuales) {
        if (data.competencia_id && data.competencia_id !== comp.competencia_id) {
          await AsignacionCompetenciaModel.updateCompetencia(
            id,
            comp.competencia_id,
            data.competencia_id,
            asignacion.instructor_id,
          );
        }
        if (data.ambiente_excepcion_id !== undefined) {
          await AsignacionCompetenciaModel.updateAmbiente(id, data.ambiente_excepcion_id);
        }
      }
    }

    if (data.es_lider_ficha !== undefined) {
      await AsignacionModel.update(id, { es_lider_ficha: data.es_lider_ficha });
    }

    return AsignacionModel.findById(id);
  },

  async desactivar(id: number) {
    const asignacion = await AsignacionModel.findById(id);
    if (!asignacion) throw new NotFoundError('Asignacion no encontrada');

    await AsignacionModel.desactivar(id);
    return { activo: false };
  },

  async registrarProvisional(data: {
    instructor_id: number;
    ficha_id: number;
    autorizado_por_id: number;
    motivo_provisional: string;
    competencia_ids: number[];
    usuarioId: number;
  }) {
    return AsignacionService.create({
      ...data,
      es_provisional: true,
    });
  },

  async getHistoricas() {
    return AsignacionModel.findHistoricas();
  },
};
