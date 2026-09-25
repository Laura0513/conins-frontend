import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

export const RolModel = {
  async findByUsuarioId(usuarioId: number): Promise<string[]> {
    const [rows] = await pool.query<(RowDataPacket & { nombre: string })[]>(
      `SELECT r.nombre FROM roles r
       JOIN usuario_roles ur ON r.id = ur.rol_id
       WHERE ur.usuario_id = ?
       ORDER BY r.nivel ASC`,
      [usuarioId],
    );
    return rows.map((r) => r.nombre);
  },

  async assignRoles(usuarioId: number, rolIds: number[]): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('DELETE FROM usuario_roles WHERE usuario_id = ?', [usuarioId]);
      for (const rolId of rolIds) {
        await conn.query(
          'INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (?, ?)',
          [usuarioId, rolId],
        );
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async validateRolesExist(rolIds: number[]): Promise<boolean> {
    if (rolIds.length === 0) return true;
    const placeholders = rolIds.map(() => '?').join(',');
    const [rows] = await pool.query(
      `SELECT id FROM roles WHERE id IN (${placeholders})`,
      rolIds,
    );
    return (rows as any[]).length === rolIds.length;
  },
};
