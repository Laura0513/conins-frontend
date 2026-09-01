import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

export interface NotificacionRecord extends RowDataPacket {
  id: number;
  usuario_id: number;
  tipo: string;
  mensaje: string;
  leida: boolean;
  correo_enviado: boolean;
  generada_en: Date;
}

export const NotificacionModel = {
  async crear(data: {
    usuario_id: number;
    tipo: string;
    mensaje: string;
    correo_enviado?: boolean;
  }): Promise<number> {
    const [result] = await pool.query(
      `INSERT INTO notificaciones (usuario_id, tipo, mensaje, correo_enviado)
       VALUES (?, ?, ?, ?)`,
      [data.usuario_id, data.tipo, data.mensaje, data.correo_enviado ?? false],
    );
    return (result as any).insertId;
  },

  async findByUsuario(usuarioId: number, soloNoLeidas = false): Promise<NotificacionRecord[]> {
    const where = soloNoLeidas ? 'WHERE leida = FALSE' : '';
    const [rows] = await pool.query<NotificacionRecord[]>(
      `SELECT * FROM notificaciones WHERE usuario_id = ? ${soloNoLeidas ? 'AND leida = FALSE' : ''}
       ORDER BY generada_en DESC`,
      [usuarioId],
    );
    return rows;
  },

  async marcarLeida(id: number): Promise<void> {
    await pool.query('UPDATE notificaciones SET leida = TRUE WHERE id = ?', [id]);
  },

  async marcarTodasLeidas(usuarioId: number): Promise<void> {
    await pool.query('UPDATE notificaciones SET leida = TRUE WHERE usuario_id = ?', [usuarioId]);
  },

  async getNoLeidasCount(usuarioId: number): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM notificaciones WHERE usuario_id = ? AND leida = FALSE',
      [usuarioId],
    );
    return (rows[0] as any)?.count ?? 0;
  },
};
