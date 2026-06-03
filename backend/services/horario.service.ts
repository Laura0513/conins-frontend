import { HorarioModel } from '../models/horario.model.js';
import { InstructorModel } from '../models/instructor.model.js';
import { FichaModel } from '../models/ficha.model.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors.js';

function getLunesSemanaActual(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const lunes = new Date(now);
  lunes.setDate(now.getDate() + diff);
  return lunes.toISOString().split('T')[0];
}

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
};
