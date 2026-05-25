import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

export interface Programa extends RowDataPacket {
  id: number;
  codigo: string;
  nombre: string;
  nivel: string;
  area_id: number;
  tipo_linea: string;
  tipo_area: string;
  tipo_formacion: string;
  modalidad: string;
  activo: boolean;
}

export const ProgramaModel = {
  async findAll(): Promise<Programa[]> {
    const [rows] = await pool.query<Programa[]>(
      'SELECT id, codigo, nombre, nivel, area_id, tipo_linea, tipo_area, tipo_formacion, modalidad, activo FROM programas WHERE activo = TRUE ORDER BY nombre',
    );
    return rows;
  },

  async findById(id: number): Promise<Programa | null> {
    const [rows] = await pool.query<Programa[]>(
      'SELECT id, codigo, nombre, nivel, area_id, tipo_linea, tipo_area, tipo_formacion, modalidad, activo FROM programas WHERE id = ?',
      [id],
    );
    return rows[0] ?? null;
  },
};
