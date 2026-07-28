import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

export interface FichaRecord extends RowDataPacket {
  id: number;
  numero_ficha: string;
  programa_id: number;
  jornada_id: number;
  ambiente_id: number | null;
  etapa: string;
  fecha_inicio_lectiva: Date | null;
  fecha_fin_lectiva: Date | null;
  fecha_inicio_productiva: Date | null;
  fecha_fin_productiva: Date | null;
  fecha_fin_ficha: Date | null;
  estado: string;
  activo: boolean;
}

export interface FichaDetail extends RowDataPacket {
  id: number;
  numero_ficha: string;
  programa_id: number;
  programa: string;
  jornada: string;
  etapa: string;
  modalidad: string;
  instructores_count: number;
  ambiente: string | null;
  sede_id: number | null;
  sede_nombre: string | null;
  lider_id: number | null;
  referente_id: number | null;
  lider_nombre: string | null;
  referente_nombre: string | null;
  fecha_inicio_lectiva: string | null;
  fecha_fin_lectiva: string | null;
  fecha_inicio_productiva: string | null;
  fecha_fin_productiva: string | null;
  fecha_fin_ficha: string | null;
  estado: string;
  activo: boolean;
}

export interface FichaNovedad extends RowDataPacket {
  id: number;
  ficha_id: number;
  tipo_novedad_id: number;
  tipo_novedad: string;
  fecha_inicio: string;
  fecha_regreso: string;
  observacion: string | null;
  activo: boolean;
  created_at: string;
}

export const FichaModel = {
  async findAll(): Promise<FichaDetail[]> {
    const [rows] = await pool.query<FichaDetail[]>(`
      SELECT f.id, f.numero_ficha, f.programa_id, p.nombre AS programa, j.nombre AS jornada,
             f.etapa, p.modalidad,
             (SELECT COUNT(*) FROM asignacion a WHERE a.ficha_id = f.id AND a.activo = TRUE) AS instructores_count,
             ab.nombre AS ambiente,
             lu.nombre AS lider_nombre,
             f.fecha_inicio_lectiva, f.fecha_fin_lectiva,
             f.fecha_inicio_productiva, f.fecha_fin_productiva, f.fecha_fin_ficha,
             f.estado, f.activo
      FROM fichas f
      JOIN programas p ON f.programa_id = p.id
      JOIN jornadas j ON f.jornada_id = j.id
      LEFT JOIN ambientes ab ON f.ambiente_id = ab.id
      LEFT JOIN usuarios lu ON f.lider_id = lu.id
      ORDER BY f.numero_ficha
    `);
    return rows;
  },

  async findAllByInstructorId(instructorId: number): Promise<FichaDetail[]> {
    const [rows] = await pool.query<FichaDetail[]>(`
      SELECT f.id, f.numero_ficha, f.programa_id, p.nombre AS programa, j.nombre AS jornada,
             f.etapa, p.modalidad,
             (SELECT COUNT(*) FROM asignacion a_all WHERE a_all.ficha_id = f.id AND a_all.activo = TRUE) AS instructores_count,
             ab.nombre AS ambiente,
             lu.nombre AS lider_nombre,
             f.fecha_inicio_lectiva, f.fecha_fin_lectiva,
             f.fecha_inicio_productiva, f.fecha_fin_productiva, f.fecha_fin_ficha,
             f.estado, f.activo
      FROM fichas f
      JOIN programas p ON f.programa_id = p.id
      JOIN jornadas j ON f.jornada_id = j.id
      LEFT JOIN ambientes ab ON f.ambiente_id = ab.id
      LEFT JOIN usuarios lu ON f.lider_id = lu.id
      JOIN asignacion a ON a.ficha_id = f.id AND a.activo = TRUE AND a.instructor_id = ?
      GROUP BY f.id
      ORDER BY f.numero_ficha
    `, [instructorId]);
    return rows;
  },

  async findById(id: number): Promise<FichaDetail | null> {
    const [rows] = await pool.query<FichaDetail[]>(`
      SELECT f.id, f.numero_ficha, f.programa_id, p.nombre AS programa, j.nombre AS jornada,
             f.etapa, p.modalidad,
             (SELECT COUNT(*) FROM asignacion a WHERE a.ficha_id = f.id AND a.activo = TRUE) AS instructores_count,
             ab.nombre AS ambiente,
             f.sede_id, s.nombre AS sede_nombre,
             f.lider_id, f.lider_id AS referente_id,
             lu.nombre AS lider_nombre, lu.nombre AS referente_nombre,
             f.fecha_inicio_lectiva, f.fecha_fin_lectiva,
             f.fecha_inicio_productiva, f.fecha_fin_productiva, f.fecha_fin_ficha,
             f.estado, f.activo
      FROM fichas f
      JOIN programas p ON f.programa_id = p.id
      JOIN jornadas j ON f.jornada_id = j.id
      LEFT JOIN ambientes ab ON f.ambiente_id = ab.id
      LEFT JOIN sedes s ON f.sede_id = s.id
      LEFT JOIN usuarios lu ON f.lider_id = lu.id
      WHERE f.id = ?
    `, [id]);
    return rows[0] ?? null;
  },

  // Instructores asignados (activos) de una ficha, con sus competencias.
  async findInstructoresByFicha(fichaId: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.id AS asignacion_id, a.instructor_id, u.nombre AS instructor_nombre,
              a.es_lider_ficha AS es_lider, a.es_provisional,
              GROUP_CONCAT(DISTINCT c.nombre ORDER BY c.nombre SEPARATOR ', ') AS competencias
       FROM asignacion a
       JOIN instructores i ON a.instructor_id = i.id
       JOIN usuarios u ON i.usuario_id = u.id
       LEFT JOIN asignacion_competencia ac ON ac.asignacion_id = a.id AND ac.activo = TRUE
       LEFT JOIN competencias c ON ac.competencia_id = c.id
       WHERE a.ficha_id = ? AND a.activo = TRUE
       GROUP BY a.id
       ORDER BY u.nombre`,
      [fichaId],
    );
    return rows;
  },

  async findByNumero(numeroFicha: string): Promise<FichaRecord | null> {
    const [rows] = await pool.query<FichaRecord[]>(
      'SELECT * FROM fichas WHERE numero_ficha = ?',
      [numeroFicha],
    );
    return rows[0] ?? null;
  },

  async create(data: {
    numero_ficha: string;
    programa_id: number;
    jornada_id: number;
    ambiente_id?: number | null;
    sede_id?: number | null;
    lider_id?: number | null;
    etapa?: string;
    fecha_inicio_lectiva?: string;
    fecha_fin_lectiva?: string;
    fecha_inicio_productiva?: string;
    fecha_fin_productiva?: string;
    fecha_fin_ficha?: string;
  }): Promise<number> {
    const [result] = await pool.query(
      `INSERT INTO fichas (numero_ficha, programa_id, jornada_id, ambiente_id, sede_id, lider_id, etapa,
        fecha_inicio_lectiva, fecha_fin_lectiva, fecha_inicio_productiva, fecha_fin_productiva, fecha_fin_ficha)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.numero_ficha,
        data.programa_id,
        data.jornada_id,
        data.ambiente_id ?? null,
        data.sede_id ?? null,
        data.lider_id ?? null,
        data.etapa ?? 'lectiva',
        data.fecha_inicio_lectiva ?? null,
        data.fecha_fin_lectiva ?? null,
        data.fecha_inicio_productiva ?? null,
        data.fecha_fin_productiva ?? null,
        data.fecha_fin_ficha ?? null,
      ],
    );
    return (result as any).insertId;
  },

  async update(id: number, data: {
    numero_ficha?: string;
    programa_id?: number;
    jornada_id?: number;
    ambiente_id?: number | null;
    sede_id?: number | null;
    lider_id?: number | null;
    etapa?: string;
    fecha_inicio_lectiva?: string;
    fecha_fin_lectiva?: string;
    fecha_inicio_productiva?: string;
    fecha_fin_productiva?: string;
    fecha_fin_ficha?: string;
  }): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.numero_ficha !== undefined) { updates.push('numero_ficha = ?'); values.push(data.numero_ficha); }
    if (data.programa_id !== undefined) { updates.push('programa_id = ?'); values.push(data.programa_id); }
    if (data.jornada_id !== undefined) { updates.push('jornada_id = ?'); values.push(data.jornada_id); }
    if (data.ambiente_id !== undefined) { updates.push('ambiente_id = ?'); values.push(data.ambiente_id); }
    if (data.sede_id !== undefined) { updates.push('sede_id = ?'); values.push(data.sede_id); }
    if (data.lider_id !== undefined) { updates.push('lider_id = ?'); values.push(data.lider_id); }
    if (data.etapa !== undefined) { updates.push('etapa = ?'); values.push(data.etapa); }
    if (data.fecha_inicio_lectiva !== undefined) { updates.push('fecha_inicio_lectiva = ?'); values.push(data.fecha_inicio_lectiva); }
    if (data.fecha_fin_lectiva !== undefined) { updates.push('fecha_fin_lectiva = ?'); values.push(data.fecha_fin_lectiva); }
    if (data.fecha_inicio_productiva !== undefined) { updates.push('fecha_inicio_productiva = ?'); values.push(data.fecha_inicio_productiva); }
    if (data.fecha_fin_productiva !== undefined) { updates.push('fecha_fin_productiva = ?'); values.push(data.fecha_fin_productiva); }
    if (data.fecha_fin_ficha !== undefined) { updates.push('fecha_fin_ficha = ?'); values.push(data.fecha_fin_ficha); }

    if (updates.length === 0) return;

    values.push(id);
    await pool.query(`UPDATE fichas SET ${updates.join(', ')} WHERE id = ?`, values);
  },

  async finalizar(id: number): Promise<void> {
    await pool.query(
      'UPDATE fichas SET estado = "Finalizada", fecha_fin_ficha = CURDATE() WHERE id = ?',
      [id],
    );
  },

  async toggleActivo(id: number): Promise<boolean> {
    const [rows] = await pool.query('SELECT activo FROM fichas WHERE id = ?', [id]);
    const current = (rows as any[])[0]?.activo ?? true;
    const nuevo = !current;
    await pool.query('UPDATE fichas SET activo = ? WHERE id = ?', [nuevo, id]);
    return nuevo;
  },

  // RF-47: Novedades de ficha
  async findNovedadesByFichaId(fichaId: number): Promise<FichaNovedad[]> {
    const [rows] = await pool.query<FichaNovedad[]>(
      `SELECT fn.id, fn.ficha_id, fn.tipo_novedad_id, tn.nombre AS tipo_novedad,
              fn.fecha_inicio, fn.fecha_regreso, fn.observacion, fn.activo, fn.created_at
       FROM ficha_novedades fn
       JOIN tipos_novedad_ficha tn ON fn.tipo_novedad_id = tn.id
       WHERE fn.ficha_id = ?
       ORDER BY fn.created_at DESC`,
      [fichaId],
    );
    return rows;
  },

  async createNovedad(data: {
    ficha_id: number;
    tipo_novedad_id: number;
    fecha_inicio: string;
    fecha_regreso: string;
    observacion?: string | null;
  }): Promise<number> {
    const [result] = await pool.query(
      `INSERT INTO ficha_novedades (ficha_id, tipo_novedad_id, fecha_inicio, fecha_regreso, observacion)
       VALUES (?, ?, ?, ?, ?)`,
      [data.ficha_id, data.tipo_novedad_id, data.fecha_inicio, data.fecha_regreso, data.observacion ?? null],
    );
    return (result as any).insertId;
  },

  async toggleNovedad(id: number): Promise<boolean> {
    const [rows] = await pool.query('SELECT activo FROM ficha_novedades WHERE id = ?', [id]);
    const current = (rows as any[])[0]?.activo ?? true;
    const nuevo = !current;
    await pool.query('UPDATE ficha_novedades SET activo = ? WHERE id = ?', [nuevo, id]);
    return nuevo;
  },
};
