import { FichaModel } from '../models/ficha.model.js';
import { InstructorModel } from '../models/instructor.model.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { ROLES, RoleKey } from '../constants/roles.js';

export const FichaService = {
  async getAll(userId?: number, roles?: RoleKey[]) {
    // P22: instructor solo ve fichas donde tiene asignacion activa
    if (userId && roles && roles.length === 1 && roles[0] === ROLES.INSTRUCTOR) {
      const instructor = await InstructorModel.findByUsuarioId(userId);
      if (!instructor) return [];
      return FichaModel.findAllByInstructorId(instructor.id);
    }
    return FichaModel.findAll();
  },

  async getById(id: number) {
    const ficha = await FichaModel.findById(id);
    if (!ficha) throw new NotFoundError('Ficha no encontrada');
    return ficha;
  },

  async create(data: {
    numero_ficha: string;
    programa_id: number;
    jornada_id: number;
    ambiente_id?: number | null;
    lider_id?: number | null;
    etapa?: string;
    fecha_inicio_lectiva?: string;
    fecha_fin_lectiva?: string;
    fecha_inicio_productiva?: string;
    fecha_fin_productiva?: string;
    fecha_fin_ficha?: string;
  }) {
    const existing = await FichaModel.findByNumero(data.numero_ficha);
    if (existing) throw new ConflictError('Ya existe una ficha con ese numero');

    const id = await FichaModel.create(data);
    return FichaModel.findById(id);
  },

  async update(id: number, data: {
    numero_ficha?: string;
    programa_id?: number;
    jornada_id?: number;
    ambiente_id?: number | null;
    lider_id?: number | null;
    etapa?: string;
    fecha_inicio_lectiva?: string;
    fecha_fin_lectiva?: string;
    fecha_inicio_productiva?: string;
    fecha_fin_productiva?: string;
    fecha_fin_ficha?: string;
  }) {
    const ficha = await FichaModel.findById(id);
    if (!ficha) throw new NotFoundError('Ficha no encontrada');

    if (data.numero_ficha && data.numero_ficha !== ficha.numero_ficha) {
      const existing = await FichaModel.findByNumero(data.numero_ficha);
      if (existing) throw new ConflictError('Ya existe una ficha con ese numero');
    }

    await FichaModel.update(id, data);
    return FichaModel.findById(id);
  },

  async finalizar(id: number) {
    const ficha = await FichaModel.findById(id);
    if (!ficha) throw new NotFoundError('Ficha no encontrada');
    if (ficha.estado === 'Finalizada') throw new ConflictError('La ficha ya esta finalizada');

    await FichaModel.finalizar(id);
    return FichaModel.findById(id);
  },

  async toggleEstado(id: number) {
    const ficha = await FichaModel.findById(id);
    if (!ficha) throw new NotFoundError('Ficha no encontrada');

    const nuevoEstado = await FichaModel.toggleActivo(id);
    return { activo: nuevoEstado };
  },
};
