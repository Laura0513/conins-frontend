import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

export interface Competencia extends RowDataPacket {
  id: number;
  nombre: string;
  codigo: string;
  programa_id: number;
  activo: boolean;
}

export const CompetenciaModel = {
  async findByPrograma(programaId: number): Promise<Competencia[]> {
    const [rows] = await pool.query<Competencia[]>(
      'SELECT id, nombre, codigo, programa_id, activo FROM competencias WHERE programa_id = ? AND activo = TRUE ORDER BY nombre',
      [programaId],
    );
    return rows;
  },

  async findById(id: number): Promise<Competencia | null> {
    const [rows] = await pool.query<Competencia[]>(
      'SELECT id, nombre, codigo, programa_id, activo FROM competencias WHERE id = ?',
      [id],
    );
    return rows[0] ?? null;
  },
};
