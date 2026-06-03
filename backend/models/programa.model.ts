import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

export interface ProgramaSimple extends RowDataPacket {
  id: number;
  nombre: string;
}

export interface ProgramaDetail extends RowDataPacket {
  id: number;
  codigo: string;
  nombre: string;
  nivel: string;
  area: string;
  tipo_linea: string;
  tipo_area: string;
  tipo_formacion: string;
  modalidad: string;
  activo: boolean;
}

export const ProgramaModel = {
  async findAll(): Promise<ProgramaDetail[]> {
    const [rows] = await pool.query<ProgramaDetail[]>(`
      SELECT p.id, p.codigo, p.nombre, p.nivel, a.nombre AS area,
             p.tipo_linea, p.tipo_area, p.tipo_formacion, p.modalidad, p.activo
      FROM programas p
      JOIN areas a ON p.area_id = a.id
      ORDER BY p.nombre
    `);
    return rows;
  },

  async findAllSimple(): Promise<ProgramaSimple[]> {
    const [rows] = await pool.query<ProgramaSimple[]>(
      'SELECT id, nombre FROM programas WHERE activo = TRUE ORDER BY nombre',
    );
    return rows;
  },

  async findById(id: number): Promise<ProgramaDetail | null> {
    const [rows] = await pool.query<ProgramaDetail[]>(`
      SELECT p.id, p.codigo, p.nombre, p.nivel, a.nombre AS area,
             p.tipo_linea, p.tipo_area, p.tipo_formacion, p.modalidad, p.activo
      FROM programas p
      JOIN areas a ON p.area_id = a.id
      WHERE p.id = ?
    `, [id]);
    return rows[0] ?? null;
  },
};
