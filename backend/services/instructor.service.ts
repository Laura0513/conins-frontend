import { InstructorModel } from '../models/instructor.model.js';
import { CompetenciaModel } from '../models/competencia.model.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';

export const InstructorService = {
  async getAll() {
    return InstructorModel.findAll();
  },

  async getById(id: number) {
    const instructor = await InstructorModel.findById(id);
    if (!instructor) throw new NotFoundError('Instructor no encontrado');
    return instructor;
  },

  async getOwnProfile(usuarioId: number) {
    const instructor = await InstructorModel.findByUsuarioId(usuarioId);
    if (!instructor) throw new NotFoundError('Perfil de instructor no encontrado');
    const detalle = await InstructorModel.findById(instructor.id);
    if (!detalle) throw new NotFoundError('Instructor no encontrado');
    return detalle;
  },

  async update(id: number, tipo_contrato?: string, tipo_area?: string) {
    const instructor = await InstructorModel.findById(id);
    if (!instructor) throw new NotFoundError('Instructor no encontrado');

    if (tipo_area && tipo_area !== instructor.tipo_area) {
      const hasActiveCompetencias = await InstructorModel.hasActiveCompetencias(instructor.usuario_id);
      if (hasActiveCompetencias) {
        throw new ValidationError('No se puede cambiar el tipo de area: el instructor tiene asignaciones activas');
      }
    }

    await InstructorModel.update(id, tipo_contrato, tipo_area);
    return InstructorModel.findById(id);
  },

  async toggleEstado(id: number) {
    const instructor = await InstructorModel.findById(id);
    if (!instructor) throw new NotFoundError('Instructor no encontrado');

    if (!instructor.activo) {
      const hasActiveCompetencias = await InstructorModel.hasActiveCompetencias(instructor.usuario_id);
      if (hasActiveCompetencias) {
        throw new ForbiddenError('No se puede activar: el instructor tiene asignaciones activas');
      }
    }

    const nuevoEstado = await InstructorModel.toggleActivo(id);
    return { activo: nuevoEstado };
  },

  async getCompetenciasHabilitadas(instructorId: number) {
    const instructor = await InstructorModel.findById(instructorId);
    if (!instructor) throw new NotFoundError('Instructor no encontrado');
    return InstructorModel.getCompetenciasHabilitadas(instructorId);
  },

  async addCompetencia(instructorId: number, competenciaId: number) {
    const instructor = await InstructorModel.findById(instructorId);
    if (!instructor) throw new NotFoundError('Instructor no encontrado');

    const competencia = await CompetenciaModel.findById(competenciaId);
    if (!competencia) throw new NotFoundError('Competencia no encontrada');

    await InstructorModel.addCompetencia(instructorId, competenciaId);
    return InstructorModel.getCompetenciasHabilitadas(instructorId);
  },

  async removeCompetencia(instructorId: number, competenciaId: number) {
    const instructor = await InstructorModel.findById(instructorId);
    if (!instructor) throw new NotFoundError('Instructor no encontrado');

    const competencia = await CompetenciaModel.findById(competenciaId);
    if (!competencia) throw new NotFoundError('Competencia no encontrada');

    await InstructorModel.removeCompetencia(instructorId, competenciaId);
    return InstructorModel.getCompetenciasHabilitadas(instructorId);
  },
};
