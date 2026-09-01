import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

export interface AmbienteBloqueo extends RowDataPacket {
  id: number;
  ambiente_id: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  motivo: string;
  activo: boolean;
}

export const AmbienteModel = {
  async hasBloqueoVigente(ambienteId: number, semana: string): Promise<boolean> {
    const [rows] = await pool.query(
      `SELECT 1 FROM ambiente_bloqueos
       WHERE ambiente_id = ?
         AND activo = TRUE
         AND fecha_inicio <= ?
         AND fecha_fin >= ?
       LIMIT 1`,
      [ambienteId, semana, semana],
    );
    return (rows as any[]).length > 0;
  },

  async getBloqueosVigentes(): Promise<AmbienteBloqueo[]> {
    const [rows] = await pool.query<AmbienteBloqueo[]>(
      `SELECT * FROM ambiente_bloqueos
       WHERE activo = TRUE
         AND fecha_fin >= CURDATE()
       ORDER BY fecha_inicio`,
    );
    return rows;
  },
};
