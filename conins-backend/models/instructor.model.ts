import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

export interface InstructorRecord extends RowDataPacket {
  id: number;
  usuario_id: number;
  tipo_area: string;
  activo: boolean;
}

export interface InstructorDetail extends RowDataPacket {
  id: number;
  usuario_id: number;
  nombre: string;
  email: string;
  tipo_area: string;
  foto_url: string | null;
  activo: boolean;
  roles: string | null;
  rol_ids: string | null;
}

export const InstructorModel = {
  async findAll(): Promise<InstructorDetail[]> {
    const [rows] = await pool.query<InstructorDetail[]>(`
      SELECT i.id, i.usuario_id, u.nombre, u.email, i.tipo_area, i.foto_url, i.activo,
             GROUP_CONCAT(r.nombre ORDER BY r.nivel ASC SEPARATOR ', ') AS roles,
             GROUP_CONCAT(r.id ORDER BY r.nivel ASC SEPARATOR ',') AS rol_ids
      FROM instructores i
      JOIN usuarios u ON i.usuario_id = u.id
      LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
      LEFT JOIN roles r ON ur.rol_id = r.id
      WHERE i.activo = TRUE
      GROUP BY i.id
      ORDER BY u.nombre
    `);
    return rows;
  },

  async findById(id: number): Promise<InstructorDetail | null> {
    const [rows] = await pool.query<InstructorDetail[]>(`
      SELECT i.id, i.usuario_id, u.nombre, u.email, i.tipo_area, i.foto_url, i.activo,
             GROUP_CONCAT(r.nombre ORDER BY r.nivel ASC SEPARATOR ', ') AS roles,
             GROUP_CONCAT(r.id ORDER BY r.nivel ASC SEPARATOR ',') AS rol_ids
      FROM instructores i
      JOIN usuarios u ON i.usuario_id = u.id
      LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
      LEFT JOIN roles r ON ur.rol_id = r.id
      WHERE i.id = ?
      GROUP BY i.id
    `, [id]);
    return rows[0] ?? null;
  },

  async findByUsuarioId(usuarioId: number): Promise<{ id: number; tipo_area: string } | null> {
    const [rows] = await pool.query(
      'SELECT id, tipo_area FROM instructores WHERE usuario_id = ? AND activo = TRUE',
      [usuarioId],
    );
    return (rows as any[])[0] ?? null;
  },

  async create(usuarioId: number, tipo_area: string): Promise<void> {
    await pool.query(
      'INSERT INTO instructores (usuario_id, tipo_area) VALUES (?, ?)',
      [usuarioId, tipo_area],
    );
  },

  async update(id: number, tipo_area?: string, foto_url?: string | null): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (tipo_area) {
      updates.push('tipo_area = ?');
      values.push(tipo_area);
    }
    // foto_url: se permite setear una URL o limpiarla (null / cadena vacia -> NULL)
    if (foto_url !== undefined) {
      updates.push('foto_url = ?');
      values.push(foto_url ? String(foto_url).trim() : null);
    }

    if (updates.length === 0) return;

    values.push(id);
    await pool.query(
      `UPDATE instructores SET ${updates.join(', ')} WHERE id = ?`,
      values,
    );
  },

  async toggleActivo(id: number): Promise<boolean> {
    const [rows] = await pool.query('SELECT activo FROM instructores WHERE id = ?', [id]);
    const current = (rows as any[])[0]?.activo ?? true;
    const nuevo = !current;
    await pool.query('UPDATE instructores SET activo = ? WHERE id = ?', [nuevo, id]);
    return nuevo;
  },

  async getCompetenciasHabilitadas(instructorId: number): Promise<any[]> {
    const [rows] = await pool.query(`
      SELECT c.id, c.nombre, c.codigo, c.programa_id, p.nombre AS programa_nombre
      FROM instructor_competencias_habilitadas ich
      JOIN competencias c ON ich.competencia_id = c.id
      LEFT JOIN programas p ON c.programa_id = p.id
      WHERE ich.instructor_id = ?
      ORDER BY c.nombre
    `, [instructorId]);
    return rows as any[];
  },

  async addCompetencia(instructorId: number, competenciaId: number): Promise<void> {
    await pool.query(
      'INSERT IGNORE INTO instructor_competencias_habilitadas (instructor_id, competencia_id) VALUES (?, ?)',
      [instructorId, competenciaId],
    );
  },

  async removeCompetencia(instructorId: number, competenciaId: number): Promise<void> {
    await pool.query(
      'DELETE FROM instructor_competencias_habilitadas WHERE instructor_id = ? AND competencia_id = ?',
      [instructorId, competenciaId],
    );
  },

  async hasActiveCompetencias(usuarioId: number): Promise<boolean> {
    const [rows] = await pool.query(
      `SELECT 1 FROM asignacion_competencia ac
       JOIN asignacion a ON ac.asignacion_id = a.id
       JOIN instructores i ON a.instructor_id = i.id
       WHERE i.usuario_id = ? AND ac.activo = TRUE
       LIMIT 1`,
      [usuarioId],
    );
    return (rows as any[]).length > 0;
  },

  async deleteByUsuarioId(usuarioId: number): Promise<void> {
    await pool.query('DELETE FROM instructores WHERE usuario_id = ?', [usuarioId]);
  },

  async crearNovedad(
    instructorId: number,
    tipoNovedadId: number,
    fechaInicio: string,
    fechaRegreso: string,
    observacion?: string,
  ): Promise<number> {
    const [result] = await pool.query(
      `INSERT INTO instructor_novedades (instructor_id, tipo_novedad_id, fecha_inicio, fecha_regreso, observacion)
       VALUES (?, ?, ?, ?, ?)`,
      [instructorId, tipoNovedadId, fechaInicio, fechaRegreso, observacion ?? null],
    );
    return (result as any).insertId;
  },

  async getHorasSemanales(instructorId: number, semana: string): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, hora_inicio, hora_fin)), 0) / 60 AS total_horas
       FROM horarios
       WHERE instructor_id = ? AND semana = ? AND activo = TRUE`,
      [instructorId, semana],
    );
    return Number((rows[0] as any)?.total_horas ?? 0);
  },

  async getHorasSemanalesTodos(semana: string): Promise<Map<number, number>> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT instructor_id, COALESCE(SUM(TIMESTAMPDIFF(MINUTE, hora_inicio, hora_fin)), 0) / 60 AS total_horas
       FROM horarios
       WHERE semana = ? AND activo = TRUE
       GROUP BY instructor_id`,
      [semana],
    );
    const map = new Map<number, number>();
    for (const row of rows) {
      map.set((row as any).instructor_id, Number((row as any).total_horas ?? 0));
    }
    return map;
  },

  async tieneNovedadActiva(usuarioId: number): Promise<boolean> {
    const [rows] = await pool.query(
      `SELECT 1 FROM instructor_novedades ino
       JOIN instructores i ON ino.instructor_id = i.id
       WHERE i.usuario_id = ? AND ino.activo = TRUE
         AND ino.fecha_inicio <= CURDATE() AND ino.fecha_regreso >= CURDATE()
       LIMIT 1`,
      [usuarioId],
    );
    return (rows as any[]).length > 0;
  },

  async getDetalle(instructorId: number) {
    const [instructorRows] = await pool.query(`
      SELECT i.id, i.usuario_id, u.nombre, u.email, i.tipo_area, i.foto_url, i.activo,
             GROUP_CONCAT(r.nombre ORDER BY r.nivel ASC SEPARATOR ', ') AS roles
      FROM instructores i
      JOIN usuarios u ON i.usuario_id = u.id
      LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
      LEFT JOIN roles r ON ur.rol_id = r.id
      WHERE i.id = ?
      GROUP BY i.id
    `, [instructorId]);
    const instructor = (instructorRows as any[])[0];
    if (!instructor) return null;

    const [asignacionesRows] = await pool.query(`
      SELECT a.id, f.numero_ficha, p.nombre AS programa, c.nombre AS competencia,
             ab.nombre AS ambiente, j.nombre AS jornada,
             a.es_lider_ficha, a.es_provisional, a.activo
      FROM asignacion a
      JOIN fichas f ON a.ficha_id = f.id
      JOIN programas p ON f.programa_id = p.id
      JOIN asignacion_competencia ac ON ac.asignacion_id = a.id AND ac.activo = TRUE
      JOIN competencias c ON ac.competencia_id = c.id
      JOIN jornadas j ON f.jornada_id = j.id
      LEFT JOIN ambientes ab ON COALESCE(ac.ambiente_excepcion_id, f.ambiente_id) = ab.id
      WHERE a.instructor_id = ?
      ORDER BY a.activo DESC, f.numero_ficha
    `, [instructorId]);

    const [horariosRows] = await pool.query(`
      SELECT h.id, f.numero_ficha, c.nombre AS competencia,
             ab.nombre AS ambiente, j.nombre AS jornada,
             h.dia_semana, h.hora_inicio, h.hora_fin, h.semana, h.activo
      FROM horarios h
      JOIN fichas f ON h.ficha_id = f.id
      JOIN competencias c ON h.competencia_id = c.id
      JOIN jornadas j ON h.jornada_id = j.id
      LEFT JOIN ambientes ab ON h.ambiente_id = ab.id
      WHERE h.instructor_id = ?
      ORDER BY h.semana DESC, h.dia_semana
    `, [instructorId]);

    const [competenciasRows] = await pool.query(`
      SELECT c.id, c.nombre, c.codigo, p.nombre AS programa_nombre
      FROM instructor_competencias_habilitadas ich
      JOIN competencias c ON ich.competencia_id = c.id
      LEFT JOIN programas p ON c.programa_id = p.id
      WHERE ich.instructor_id = ?
      ORDER BY c.nombre
    `, [instructorId]);

    const [novedadesRows] = await pool.query(`
      SELECT n.id, t.nombre AS tipo_novedad, n.fecha_inicio, n.fecha_regreso, n.observacion, n.activo
      FROM instructor_novedades n
      JOIN tipos_novedad_instructor t ON n.tipo_novedad_id = t.id
      WHERE n.instructor_id = ?
      ORDER BY fecha_inicio DESC
    `, [instructorId]);

    return {
      ...instructor,
      asignaciones: asignacionesRows,
      horarios: horariosRows,
      competencias: competenciasRows,
      novedades: novedadesRows,
    };
  },
};
