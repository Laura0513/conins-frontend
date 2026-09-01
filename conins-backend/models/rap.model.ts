import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

export interface Rap extends RowDataPacket {
  id: number;
  nombre: string;
  codigo: string;
  competencia_id: number;
  fecha_limite: Date | null;
  activo: boolean;
}

export const RapModel = {
  async findByCompetencia(competenciaId: number): Promise<Rap[]> {
    const [rows] = await pool.query<Rap[]>(
      'SELECT id, nombre, codigo, competencia_id, fecha_limite, activo FROM raps WHERE competencia_id = ? AND activo = TRUE ORDER BY nombre',
      [competenciaId],
    );
    return rows;
  },
};
