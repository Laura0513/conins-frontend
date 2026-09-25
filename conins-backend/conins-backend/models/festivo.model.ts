import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

export interface Festivo {
  fecha: string;
  descripcion: string;
  dia_semana: number; // 1=Lunes ... 7=Domingo (coincide con horarios.dia_semana)
}

export const FestivoModel = {
  // Festivos que caen dentro de una semana (lunes..domingo), con su dia_semana.
  // Se usa para descontar de la carga los bloques que caen en dia festivo.
  async deSemana(lunes: string): Promise<Festivo[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha, descripcion, WEEKDAY(fecha) + 1 AS dia_semana
       FROM festivos
       WHERE activo = TRUE AND fecha BETWEEN ? AND DATE_ADD(?, INTERVAL 6 DAY)
       ORDER BY fecha`,
      [lunes, lunes],
    );
    return rows as Festivo[];
  },

  async listar(): Promise<Festivo[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha, descripcion, WEEKDAY(fecha) + 1 AS dia_semana
       FROM festivos WHERE activo = TRUE ORDER BY fecha`,
    );
    return rows as Festivo[];
  },
};
