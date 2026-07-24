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
  referente_id: number | null;
  referente_nombre: string | null;
}

// RF-24: el referente de programa se resuelve sobre la tabla lider_programa
// (relacion existente instructor<->programa). Se fuerza 1:1 en la escritura
// (setReferente borra los previos e inserta uno). referente_id = instructores.id.
const REFERENTE_ID_SUBQUERY =
  '(SELECT lp.instructor_id FROM lider_programa lp WHERE lp.programa_id = p.id LIMIT 1)';
const REFERENTE_NOMBRE_SUBQUERY =
  '(SELECT u.nombre FROM lider_programa lp ' +
  'JOIN instructores i ON lp.instructor_id = i.id ' +
  'JOIN usuarios u ON i.usuario_id = u.id ' +
  'WHERE lp.programa_id = p.id LIMIT 1)';

export const ProgramaModel = {
  async findAll(): Promise<ProgramaDetail[]> {
    const [rows] = await pool.query<ProgramaDetail[]>(`
      SELECT p.id, p.codigo, p.nombre, p.nivel, a.nombre AS area,
             p.tipo_linea, p.tipo_area, p.tipo_formacion, p.modalidad, p.activo,
             ${REFERENTE_ID_SUBQUERY} AS referente_id,
             ${REFERENTE_NOMBRE_SUBQUERY} AS referente_nombre
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
             p.tipo_linea, p.tipo_area, p.tipo_formacion, p.modalidad, p.activo,
             ${REFERENTE_ID_SUBQUERY} AS referente_id,
             ${REFERENTE_NOMBRE_SUBQUERY} AS referente_nombre
      FROM programas p
      JOIN areas a ON p.area_id = a.id
      WHERE p.id = ?
    `, [id]);
    return rows[0] ?? null;
  },

  // RF-24: asigna (o limpia) el referente del programa. Enforce 1:1.
  async setReferente(programaId: number, referenteId: number | null): Promise<void> {
    await pool.query('DELETE FROM lider_programa WHERE programa_id = ?', [programaId]);
    if (referenteId !== null && referenteId !== undefined) {
      await pool.query(
        'INSERT INTO lider_programa (instructor_id, programa_id) VALUES (?, ?)',
        [referenteId, programaId],
      );
    }
  },
};
