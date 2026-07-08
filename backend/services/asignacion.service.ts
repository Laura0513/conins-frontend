import { AsignacionModel } from '../models/asignacion.model.js';
import { AsignacionCompetenciaModel } from '../models/asignacion-competencia.model.js';
import { InstructorModel } from '../models/instructor.model.js';
import { FichaModel } from '../models/ficha.model.js';
import { PermisoService } from '../services/permiso.service.js';
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
    es_lider_ficha?: boolean;
    es_provisional?: boolean;
    autorizado_por_id?: number | null;
    motivo_provisional?: string | null;
    competencia_ids: number[];
    usuarioId?: number;
  }) {
    const instructor = await InstructorModel.findById(data.instructor_id);
    if (!instructor) throw new NotFoundError('Instructor no encontrado');

    const ficha = await FichaModel.findById(data.ficha_id);
    if (!ficha) throw new NotFoundError('Ficha no encontrada');
    if (ficha.estado === 'Finalizada') throw new ForbiddenError('No se pueden crear asignaciones en fichas finalizadas');

    const tieneNovedad = await AsignacionModel.tieneNovedadActiva(data.instructor_id);
    if (tieneNovedad) throw new ValidationError('El instructor tiene una novedad activa vigente (RN-08)');

    for (const competenciaId of data.competencia_ids) {
      const hasRap = await AsignacionModel.hasRapEnFicha(data.ficha_id, competenciaId);
      if (hasRap) {
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

    if (data.usuarioId) {
      await PermisoService.validarAlcanceCoordinador(data.usuarioId, data.ficha_id);
    }

    const id = await AsignacionModel.create(data);
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
    await PermisoService.validarNoLiderParaProvisional(data.usuarioId);

    return AsignacionService.create({
      ...data,
      es_provisional: true,
    });
  },

  async getHistoricas() {
    return AsignacionModel.findHistoricas();
  },
};
