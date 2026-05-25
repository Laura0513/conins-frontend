import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

export interface Area extends RowDataPacket {
  id: number;
  nombre: string;
  subtipo: string | null;
  activa: boolean;
}

export const AreaModel = {
  async findAll(): Promise<Area[]> {
    const [rows] = await pool.query<Area[]>(
      'SELECT id, nombre, subtipo, activa FROM areas WHERE activa = TRUE ORDER BY nombre',
    );
    return rows;
  },
};
