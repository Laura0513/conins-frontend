import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

// Historico de cargas: una fila por importacion confirmada (RF importador).
export const ImportHistoricoModel = {
  async crear(data: {
    usuario_id: number | null;
    usuario_nombre: string | null;
    creados: number;
    omitidos: number;
    errores: number;
  }): Promise<void> {
    await pool.query(
      `INSERT INTO import_historico (usuario_id, usuario_nombre, creados, omitidos, errores)
       VALUES (?, ?, ?, ?, ?)`,
      [data.usuario_id, data.usuario_nombre, data.creados, data.omitidos, data.errores],
    );
  },

  async listar(limit = 50): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, usuario_id, usuario_nombre, creados, omitidos, errores, created_at
       FROM import_historico
       ORDER BY created_at DESC
       LIMIT ?`,
      [limit],
    );
    return rows;
  },
};
