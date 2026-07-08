import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';
import { ConflictError } from '../utils/errors.js';

export interface AsignacionRecord extends RowDataPacket {
  id: number;
  instructor_id: number;
  ficha_id: number;
  es_lider_ficha: boolean;
  es_provisional: boolean;
  autorizado_por_id: number | null;
  fecha_autorizacion: Date | null;
  motivo_provisional: string | null;
  fecha_asignacion: Date | null;
  activo: boolean;
}

export interface AsignacionDetail extends RowDataPacket {
  id: number;
  instructor_nombre: string;
  ficha_numero: string;
  competencia: string;
  ambiente: string;
  jornada: string;
  es_lider: boolean;
  es_provisional: boolean;
  activo: boolean;
}

export const AsignacionModel = {
  async findAll(): Promise<AsignacionDetail[]> {
    const [rows] = await pool.query<AsignacionDetail[]>(`
      SELECT a.id, a.instructor_id, a.ficha_id, ac.competencia_id,
             u.nombre AS instructor_nombre, f.numero_ficha AS ficha_numero,
             c.nombre AS competencia,
             COALESCE(ab.nombre, 'Sin asignar') AS ambiente,
             ab.id AS ambiente_id,
             j.nombre AS jornada,
             a.es_lider_ficha AS es_lider,
             a.es_provisional,
             a.activo
      FROM asignacion a
      JOIN instructores i ON a.instructor_id = i.id
      JOIN usuarios u ON i.usuario_id = u.id
      JOIN fichas f ON a.ficha_id = f.id
      JOIN asignacion_competencia ac ON ac.asignacion_id = a.id
      JOIN competencias c ON ac.competencia_id = c.id
      JOIN jornadas j ON f.jornada_id = j.id
      LEFT JOIN ambientes ab ON COALESCE(ac.ambiente_excepcion_id, f.ambiente_id) = ab.id
      ORDER BY a.id
    `);
    return rows;
  },

  async findAllByInstructorId(instructorId: number): Promise<AsignacionDetail[]> {
    const [rows] = await pool.query<AsignacionDetail[]>(`
      SELECT a.id, a.instructor_id, a.ficha_id, ac.competencia_id,
             u.nombre AS instructor_nombre, f.numero_ficha AS ficha_numero,
             c.nombre AS competencia,
             COALESCE(ab.nombre, 'Sin asignar') AS ambiente,
             ab.id AS ambiente_id,
             j.nombre AS jornada,
             a.es_lider_ficha AS es_lider,
             a.es_provisional,
             a.activo
      FROM asignacion a
      JOIN instructores i ON a.instructor_id = i.id
      JOIN usuarios u ON i.usuario_id = u.id
      JOIN fichas f ON a.ficha_id = f.id
      JOIN asignacion_competencia ac ON ac.asignacion_id = a.id
      JOIN competencias c ON ac.competencia_id = c.id
      JOIN jornadas j ON f.jornada_id = j.id
      LEFT JOIN ambientes ab ON COALESCE(ac.ambiente_excepcion_id, f.ambiente_id) = ab.id
      WHERE a.instructor_id = ?
      ORDER BY a.id
    `, [instructorId]);
    return rows;
  },

  async findById(id: number): Promise<AsignacionDetail | null> {
    const [rows] = await pool.query<AsignacionDetail[]>(`
      SELECT a.id, u.nombre AS instructor_nombre, f.numero_ficha AS ficha_numero,
             c.nombre AS competencia,
             COALESCE(ab.nombre, 'Sin asignar') AS ambiente,
             j.nombre AS jornada,
             a.es_lider_ficha AS es_lider,
             a.es_provisional,
             a.activo
      FROM asignacion a
      JOIN instructores i ON a.instructor_id = i.id
      JOIN usuarios u ON i.usuario_id = u.id
      JOIN fichas f ON a.ficha_id = f.id
      JOIN asignacion_competencia ac ON ac.asignacion_id = a.id AND ac.activo = TRUE
      JOIN competencias c ON ac.competencia_id = c.id
      JOIN jornadas j ON f.jornada_id = j.id
      LEFT JOIN ambientes ab ON COALESCE(ac.ambiente_excepcion_id, f.ambiente_id) = ab.id
      WHERE a.id = ?
      ORDER BY ac.competencia_id
    `, [id]);
    return rows[0] ?? null;
  },

  async create(data: {
    instructor_id: number;
    ficha_id: number;
    es_lider_ficha?: boolean;
    es_provisional?: boolean;
    autorizado_por_id?: number | null;
    motivo_provisional?: string | null;
    competencia_ids: number[];
  }): Promise<number> {
    try {
      const [result] = await pool.query(
        `INSERT INTO asignacion (instructor_id, ficha_id, es_lider_ficha, es_provisional,
          autorizado_por_id, motivo_provisional, fecha_asignacion)
         VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
        [
          data.instructor_id,
          data.ficha_id,
          data.es_lider_ficha ?? false,
          data.es_provisional ?? false,
          data.autorizado_por_id ?? null,
          data.motivo_provisional ?? null,
        ],
      );
      const asignacionId = (result as any).insertId;

      for (const competenciaId of data.competencia_ids) {
        await pool.query(
          'INSERT INTO asignacion_competencia (asignacion_id, competencia_id) VALUES (?, ?)',
          [asignacionId, competenciaId],
        );
      }

      return asignacionId;
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new ConflictError('Ya existe una asignacion para este instructor en esta ficha');
      }
      throw err;
    }
  },

  async update(id: number, data: {
    competencia_id?: number;
    ambiente_excepcion_id?: number | null;
    es_lider_ficha?: boolean;
  }): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.es_lider_ficha !== undefined) { updates.push('es_lider_ficha = ?'); values.push(data.es_lider_ficha); }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(`UPDATE asignacion SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    if (data.competencia_id !== undefined || data.ambiente_excepcion_id !== undefined) {
      const compUpdates: string[] = [];
      const compValues: any[] = [];

      if (data.competencia_id !== undefined) { compUpdates.push('competencia_id = ?'); compValues.push(data.competencia_id); }
      if (data.ambiente_excepcion_id !== undefined) { compUpdates.push('ambiente_excepcion_id = ?'); compValues.push(data.ambiente_excepcion_id); }

      if (compUpdates.length > 0) {
        compValues.push(id);
        await pool.query(
          `UPDATE asignacion_competencia SET ${compUpdates.join(', ')} WHERE asignacion_id = ?`,
          compValues,
        );
      }
    }
  },

  async desactivar(id: number): Promise<void> {
    await pool.query('UPDATE asignacion SET activo = FALSE WHERE id = ?', [id]);
    await pool.query('UPDATE asignacion_competencia SET activo = FALSE WHERE asignacion_id = ?', [id]);
  },

  async tieneNovedadActiva(instructorId: number): Promise<boolean> {
    const [rows] = await pool.query(
      `SELECT 1 FROM instructor_novedades
       WHERE instructor_id = ? AND activo = TRUE
         AND fecha_inicio <= CURDATE() AND fecha_regreso >= CURDATE()
       LIMIT 1`,
      [instructorId],
    );
    return (rows as any[]).length > 0;
  },

  async hasRapEnFicha(fichaId: number, competenciaId: number): Promise<boolean> {
    const [rows] = await pool.query(
      `SELECT 1 FROM asignacion_competencia ac
       JOIN asignacion a ON ac.asignacion_id = a.id
       JOIN raps r ON r.competencia_id = ac.competencia_id
       WHERE a.ficha_id = ? AND ac.competencia_id != ? AND ac.activo = TRUE AND a.activo = TRUE
         AND r.competencia_id IN (
           SELECT r2.competencia_id FROM raps r2 WHERE r2.id IN (
             SELECT r3.id FROM raps r3 WHERE r3.competencia_id = ?
           )
         )
       LIMIT 1`,
      [fichaId, competenciaId, competenciaId],
    );
    return (rows as any[]).length > 0;
  },

  async findHistoricas(): Promise<AsignacionDetail[]> {
    const [rows] = await pool.query<AsignacionDetail[]>(`
      SELECT a.id, a.instructor_id, a.ficha_id, ac.competencia_id,
             u.nombre AS instructor_nombre, f.numero_ficha AS ficha_numero,
             c.nombre AS competencia,
             COALESCE(ab.nombre, 'Sin asignar') AS ambiente,
             ab.id AS ambiente_id,
             j.nombre AS jornada,
             a.es_lider_ficha AS es_lider,
             a.es_provisional,
             a.activo
      FROM asignacion a
      JOIN instructores i ON a.instructor_id = i.id
      JOIN usuarios u ON i.usuario_id = u.id
      JOIN fichas f ON a.ficha_id = f.id
      JOIN asignacion_competencia ac ON ac.asignacion_id = a.id
      JOIN competencias c ON ac.competencia_id = c.id
      JOIN jornadas j ON f.jornada_id = j.id
      LEFT JOIN ambientes ab ON COALESCE(ac.ambiente_excepcion_id, f.ambiente_id) = ab.id
      WHERE a.activo = FALSE
      ORDER BY a.fecha_asignacion DESC
    `);
    return rows;
  },
};
