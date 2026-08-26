import { RapFichaSeguimientoModel } from '../models/rap-ficha-seguimiento.model.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors.js';
import pool from '../config/db.js';

export const RapSeguimientoService = {
  async getByFicha(fichaId: number) {
    const [fichaRows] = await pool.query('SELECT id FROM fichas WHERE id = ?', [fichaId]);
    if ((fichaRows as any[]).length === 0) throw new NotFoundError('Ficha no encontrada');
    return RapFichaSeguimientoModel.findByFicha(fichaId);
  },

  async getByAsignacionCompetencia(asignacionCompetenciaId: number) {
    const [acRows] = await pool.query(
      'SELECT id FROM asignacion_competencia WHERE id = ?',
      [asignacionCompetenciaId],
    );
    if ((acRows as any[]).length === 0) {
      throw new NotFoundError('Asignacion-competencia no encontrada');
    }
    return RapFichaSeguimientoModel.findByAsignacionCompetencia(asignacionCompetenciaId);
  },

  async getById(id: number) {
    const seguimiento = await RapFichaSeguimientoModel.findById(id);
    if (!seguimiento) throw new NotFoundError('Seguimiento RAP no encontrado');
    return seguimiento;
  },

  async create(data: {
    asignacion_competencia_id: number;
    rap_id: number;
    fecha_inicio?: string | null;
    fecha_fin_programada?: string | null;
  }) {
    // Verificar que la asignacion_competencia existe y esta activa
    const [acRows] = await pool.query(
      'SELECT id FROM asignacion_competencia WHERE id = ? AND activo = TRUE',
      [data.asignacion_competencia_id],
    );
    if ((acRows as any[]).length === 0) {
      throw new NotFoundError('Asignacion-competencia no encontrada o inactiva');
    }

    // Verificar que el RAP existe y pertenece a la competencia de la asignacion
    const [rapRows] = await pool.query(
      `SELECT r.id FROM raps r
       JOIN asignacion_competencia ac ON r.competencia_id = ac.competencia_id
       WHERE r.id = ? AND ac.id = ?`,
      [data.rap_id, data.asignacion_competencia_id],
    );
    if ((rapRows as any[]).length === 0) {
      throw new ValidationError('El RAP no pertenece a la competencia de esta asignacion');
    }

    // Verificar duplicado
    const [existingRows] = await pool.query(
      'SELECT id FROM rap_ficha_seguimiento WHERE asignacion_competencia_id = ? AND rap_id = ?',
      [data.asignacion_competencia_id, data.rap_id],
    );
    if ((existingRows as any[]).length > 0) {
      throw new ConflictError('Ya existe un seguimiento para este RAP en esta asignacion');
    }

    const id = await RapFichaSeguimientoModel.create(data);
    return RapFichaSeguimientoModel.findById(id);
  },

  async update(id: number, data: {
    fecha_inicio?: string | null;
    fecha_fin_programada?: string | null;
    estado_evaluacion?: 'pendiente_por_evaluar' | 'evaluado';
    estado_aprobacion?: 'aprobado' | 'no_aprobado' | null;
  }) {
    const seguimiento = await RapFichaSeguimientoModel.findById(id);
    if (!seguimiento) throw new NotFoundError('Seguimiento RAP no encontrado');

    // Si se marca como evaluado, estado_aprobacion es obligatorio
    if (data.estado_evaluacion === 'evaluado' && !data.estado_aprobacion) {
      if (!seguimiento.estado_aprobacion) {
        throw new ValidationError('Al marcar como evaluado se debe indicar si fue aprobado o no_aprobado');
      }
    }

    await RapFichaSeguimientoModel.update(id, data);
    return RapFichaSeguimientoModel.findById(id);
  },

  async evaluar(id: number, estado_aprobacion: 'aprobado' | 'no_aprobado') {
    const seguimiento = await RapFichaSeguimientoModel.findById(id);
    if (!seguimiento) throw new NotFoundError('Seguimiento RAP no encontrado');

    await RapFichaSeguimientoModel.update(id, {
      estado_evaluacion: 'evaluado',
      estado_aprobacion,
    });
    return RapFichaSeguimientoModel.findById(id);
  },

  async toggleActivo(id: number) {
    const seguimiento = await RapFichaSeguimientoModel.findById(id);
    if (!seguimiento) throw new NotFoundError('Seguimiento RAP no encontrado');

    const nuevoEstado = await RapFichaSeguimientoModel.toggleActivo(id);
    return { activo: nuevoEstado };
  },

  async getDisponibles(fichaId: number) {
    const [fichaRows] = await pool.query('SELECT id FROM fichas WHERE id = ?', [fichaId]);
    if ((fichaRows as any[]).length === 0) throw new NotFoundError('Ficha no encontrada');

    // RAPs que NO tienen seguimiento aun en esta ficha
    const [rows] = await pool.query(
      `SELECT ac.id AS asignacion_competencia_id,
              c.nombre AS competencia,
              r.id AS rap_id,
              r.codigo AS rap_codigo,
              r.nombre AS rap_nombre
       FROM asignacion a
       JOIN asignacion_competencia ac ON ac.asignacion_id = a.id AND ac.activo = TRUE
       JOIN competencias c ON ac.competencia_id = c.id
       JOIN raps r ON r.competencia_id = c.id AND r.activo = TRUE
       LEFT JOIN rap_ficha_seguimiento rfs
         ON rfs.asignacion_competencia_id = ac.id AND rfs.rap_id = r.id
       WHERE a.ficha_id = ? AND a.activo = TRUE
         AND rfs.id IS NULL
       ORDER BY c.nombre, r.codigo`,
      [fichaId],
    );
    return rows;
  },
};
