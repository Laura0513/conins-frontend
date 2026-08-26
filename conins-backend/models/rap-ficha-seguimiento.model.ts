import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

export interface RapFichaSeguimientoRecord extends RowDataPacket {
  id: number;
  asignacion_competencia_id: number;
  rap_id: number;
  fecha_inicio: Date | null;
  fecha_fin_programada: Date | null;
  estado_evaluacion: 'pendiente_por_evaluar' | 'evaluado';
  estado_aprobacion: 'aprobado' | 'no_aprobado' | null;
  activo: boolean;
}

export interface RapFichaSeguimientoDetail extends RowDataPacket {
  id: number;
  asignacion_competencia_id: number;
  rap_id: number;
  rap_nombre: string;
  rap_codigo: string;
  competencia: string;
  fecha_inicio: Date | null;
  fecha_fin_programada: Date | null;
  estado_evaluacion: 'pendiente_por_evaluar' | 'evaluado';
  estado_aprobacion: 'aprobado' | 'no_aprobado' | null;
  activo: boolean;
}

export const RapFichaSeguimientoModel = {
  async findByFicha(fichaId: number): Promise<RapFichaSeguimientoDetail[]> {
    const [rows] = await pool.query<RapFichaSeguimientoDetail[]>(
      `SELECT rfs.id, rfs.asignacion_competencia_id, rfs.rap_id,
              r.nombre AS rap_nombre, r.codigo AS rap_codigo,
              c.nombre AS competencia,
              rfs.fecha_inicio, rfs.fecha_fin_programada,
              rfs.estado_evaluacion, rfs.estado_aprobacion, rfs.activo
       FROM rap_ficha_seguimiento rfs
       JOIN asignacion_competencia ac ON rfs.asignacion_competencia_id = ac.id
       JOIN asignacion a ON ac.asignacion_id = a.id
       JOIN raps r ON rfs.rap_id = r.id
       JOIN competencias c ON r.competencia_id = c.id
       WHERE a.ficha_id = ?
       ORDER BY c.nombre, r.codigo`,
      [fichaId],
    );
    return rows;
  },

  async findByAsignacionCompetencia(
    asignacionCompetenciaId: number,
  ): Promise<RapFichaSeguimientoDetail[]> {
    const [rows] = await pool.query<RapFichaSeguimientoDetail[]>(
      `SELECT rfs.id, rfs.asignacion_competencia_id, rfs.rap_id,
              r.nombre AS rap_nombre, r.codigo AS rap_codigo,
              c.nombre AS competencia,
              rfs.fecha_inicio, rfs.fecha_fin_programada,
              rfs.estado_evaluacion, rfs.estado_aprobacion, rfs.activo
       FROM rap_ficha_seguimiento rfs
       JOIN raps r ON rfs.rap_id = r.id
       JOIN competencias c ON r.competencia_id = c.id
       WHERE rfs.asignacion_competencia_id = ?
       ORDER BY r.codigo`,
      [asignacionCompetenciaId],
    );
    return rows;
  },

  async findById(id: number): Promise<RapFichaSeguimientoDetail | null> {
    const [rows] = await pool.query<RapFichaSeguimientoDetail[]>(
      `SELECT rfs.id, rfs.asignacion_competencia_id, rfs.rap_id,
              r.nombre AS rap_nombre, r.codigo AS rap_codigo,
              c.nombre AS competencia,
              rfs.fecha_inicio, rfs.fecha_fin_programada,
              rfs.estado_evaluacion, rfs.estado_aprobacion, rfs.activo
       FROM rap_ficha_seguimiento rfs
       JOIN raps r ON rfs.rap_id = r.id
       JOIN competencias c ON r.competencia_id = c.id
       WHERE rfs.id = ?`,
      [id],
    );
    return rows[0] ?? null;
  },

  async create(data: {
    asignacion_competencia_id: number;
    rap_id: number;
    fecha_inicio?: string | null;
    fecha_fin_programada?: string | null;
  }): Promise<number> {
    const [result] = await pool.query(
      `INSERT INTO rap_ficha_seguimiento
         (asignacion_competencia_id, rap_id, fecha_inicio, fecha_fin_programada)
       VALUES (?, ?, ?, ?)`,
      [
        data.asignacion_competencia_id,
        data.rap_id,
        data.fecha_inicio ?? null,
        data.fecha_fin_programada ?? null,
      ],
    );
    return (result as any).insertId;
  },

  async update(
    id: number,
    data: {
      fecha_inicio?: string | null;
      fecha_fin_programada?: string | null;
      estado_evaluacion?: 'pendiente_por_evaluar' | 'evaluado';
      estado_aprobacion?: 'aprobado' | 'no_aprobado' | null;
    },
  ): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.fecha_inicio !== undefined) {
      updates.push('fecha_inicio = ?');
      values.push(data.fecha_inicio);
    }
    if (data.fecha_fin_programada !== undefined) {
      updates.push('fecha_fin_programada = ?');
      values.push(data.fecha_fin_programada);
    }
    if (data.estado_evaluacion !== undefined) {
      updates.push('estado_evaluacion = ?');
      values.push(data.estado_evaluacion);
    }
    if (data.estado_aprobacion !== undefined) {
      updates.push('estado_aprobacion = ?');
      values.push(data.estado_aprobacion);
    }

    if (updates.length === 0) return;

    values.push(id);
    await pool.query(
      `UPDATE rap_ficha_seguimiento SET ${updates.join(', ')} WHERE id = ?`,
      values,
    );
  },

  async toggleActivo(id: number): Promise<boolean> {
    const [rows] = await pool.query(
      'SELECT activo FROM rap_ficha_seguimiento WHERE id = ?',
      [id],
    );
    const current = (rows as any[])[0]?.activo ?? true;
    const nuevo = !current;
    await pool.query(
      'UPDATE rap_ficha_seguimiento SET activo = ? WHERE id = ?',
      [nuevo, id],
    );
    return nuevo;
  },
};
