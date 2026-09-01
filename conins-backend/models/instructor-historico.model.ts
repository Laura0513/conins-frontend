import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

// ============================================================
// INSTRUCTOR_HISTORICO (24/07/2026)
// Archivo persistente de instructores que salieron del CDMC.
// ============================================================

export const InstructorHistoricoModel = {
  // Toma un snapshot del instructor vivo (nombre/documento/tipo_area).
  async getSnapshot(instructorId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.id AS instructor_id, u.nombre, u.documento, i.tipo_area
       FROM instructores i
       JOIN usuarios u ON i.usuario_id = u.id
       WHERE i.id = ?`,
      [instructorId],
    );
    return rows[0] ?? null;
  },

  // Registra la baja: inserta el snapshot en el historico y soft-delete del
  // instructor (se conserva el registro para no romper asignaciones/horarios).
  async registrarBaja(
    instructorId: number,
    snapshot: { nombre: string; documento: string | null; tipo_area: string | null },
    data: { fecha_salida: string; motivo?: string | null; fecha_ingreso?: string | null },
    registradoPorId: number | null,
  ): Promise<number> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO instructor_historico
           (instructor_id, nombre, documento, tipo_area, fecha_ingreso, fecha_salida, motivo, registrado_por_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          instructorId,
          snapshot.nombre,
          snapshot.documento ?? null,
          snapshot.tipo_area ?? null,
          data.fecha_ingreso ?? null,
          data.fecha_salida,
          data.motivo ?? null,
          registradoPorId,
        ],
      );

      // Soft-delete del instructor (no se borra: conserva su historial)
      await conn.query('UPDATE instructores SET activo = FALSE WHERE id = ?', [instructorId]);

      await conn.commit();
      return (result as any).insertId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async findAll(): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT h.id, h.instructor_id, h.nombre, h.documento, h.tipo_area,
              h.fecha_ingreso, h.fecha_salida, h.motivo,
              h.registrado_por_id, ru.nombre AS registrado_por_nombre, h.created_at
       FROM instructor_historico h
       LEFT JOIN usuarios ru ON h.registrado_por_id = ru.id
       ORDER BY h.fecha_salida DESC, h.id DESC`,
    );
    return rows;
  },
};
