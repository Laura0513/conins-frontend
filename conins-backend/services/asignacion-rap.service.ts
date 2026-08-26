import { AsignacionRapModel } from '../models/asignacion-rap.model.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors.js';

// ============================================================
// RF-42 — Asignacion explicita de RAP al instructor.
// Validaciones: RAP pertenece a la competencia; RN-06 (max 1 instructor
// por RAP en el grupo).
// ============================================================

export const AsignacionRapService = {
  // RAPs asignados de (asignacion, competencia).
  async getRaps(asignacionId: number, competenciaId: number) {
    const acId = await AsignacionRapModel.findAcId(asignacionId, competenciaId);
    if (!acId) {
      throw new NotFoundError('No existe una asignacion activa de esa competencia para este instructor');
    }
    return AsignacionRapModel.getRapsByAc(acId);
  },

  // Todos los RAPs asignados de un asignacion (agrupados por competencia).
  async getRapsByAsignacion(asignacionId: number) {
    return AsignacionRapModel.getRapsByAsignacion(asignacionId);
  },

  // Define el conjunto de RAPs (rapIds) que el instructor dictara en esa
  // competencia. Reemplaza el conjunto anterior.
  async setRaps(asignacionId: number, competenciaId: number, rapIds: number[]) {
    if (!Array.isArray(rapIds)) {
      throw new ValidationError('rap_ids debe ser un arreglo de identificadores');
    }

    const acId = await AsignacionRapModel.findAcId(asignacionId, competenciaId);
    if (!acId) {
      throw new NotFoundError('No existe una asignacion activa de esa competencia para este instructor');
    }

    const fichaId = await AsignacionRapModel.getFichaIdByAc(acId);
    if (fichaId === null) {
      throw new NotFoundError('No se pudo resolver el grupo de la asignacion');
    }

    // Sin duplicados en la peticion
    const unicos = [...new Set(rapIds)];

    for (const rapId of unicos) {
      // El RAP debe pertenecer a la competencia
      const pertenece = await AsignacionRapModel.rapBelongsToCompetencia(rapId, competenciaId);
      if (!pertenece) {
        throw new ValidationError(`El RAP ${rapId} no pertenece a la competencia indicada o esta inactivo`);
      }

      // RN-06: el RAP no puede estar a cargo de otro instructor en el mismo grupo
      const tomado = await AsignacionRapModel.rapTakenByOtherInFicha(fichaId, rapId, acId);
      if (tomado) {
        throw new ConflictError(`El RAP ${rapId} ya esta asignado a otro instructor en este grupo (RN-06)`);
      }
    }

    await AsignacionRapModel.syncRaps(acId, unicos);
    return AsignacionRapModel.getRapsByAc(acId);
  },
};
