import pool from '../config/db.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface AlertaInput {
  instructor_id: number;
  tipo: string;
  mensaje: string;
  semana?: string | null;       // lunes de la semana (alertas de carga)
  total_horas?: number | null;  // solo alertas de carga
  ficha_id?: number | null;     // alertas estructurales (RAP_COMPARTIDO)
  rap_id?: number | null;       // alertas estructurales (RAP_COMPARTIDO)
}

export const AlertaModel = {
  // ¿Ya hay una alerta ABIERTA (no atendida) con la misma clave? Dedup null-safe
  // (<=> compara NULL con NULL como igual) para no duplicar mientras el admin no
  // la haya aceptado/omitido.
  async existsAbierta(a: AlertaInput): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 1 FROM alertas
       WHERE instructor_id = ? AND tipo = ? AND atendida = FALSE
         AND (semana <=> ?) AND (ficha_id <=> ?) AND (rap_id <=> ?)
       LIMIT 1`,
      [a.instructor_id, a.tipo, a.semana ?? null, a.ficha_id ?? null, a.rap_id ?? null],
    );
    return rows.length > 0;
  },

  async crear(a: AlertaInput): Promise<number> {
    const [r] = await pool.query<ResultSetHeader>(
      `INSERT INTO alertas (instructor_id, tipo, mensaje, semana, total_horas, ficha_id, rap_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [a.instructor_id, a.tipo, a.mensaje, a.semana ?? null, a.total_horas ?? null, a.ficha_id ?? null, a.rap_id ?? null],
    );
    return r.insertId;
  },

  // RAPs con alerta de compartido ABIERTA en un grupo (para recomputar al editar).
  async rapCompartidoAbiertasByFicha(ficha_id: number): Promise<{ rap_id: number }[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT rap_id FROM alertas
       WHERE tipo = 'RAP_COMPARTIDO' AND ficha_id = ? AND rap_id IS NOT NULL AND atendida = FALSE`,
      [ficha_id],
    );
    return rows as { rap_id: number }[];
  },

  // Auto-cierre: al corregirse una condicion estructural (p.ej. se reasigno el
  // RAP), se marcan como atendidas las alertas abiertas de esa clave.
  async cerrarEstructural(tipo: string, ficha_id: number, rap_id: number): Promise<void> {
    await pool.query(
      `UPDATE alertas SET atendida = TRUE
       WHERE tipo = ? AND ficha_id = ? AND rap_id = ? AND atendida = FALSE`,
      [tipo, ficha_id, rap_id],
    );
  },
};
