import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

export interface HorarioRecord extends RowDataPacket {
  id: number;
  ficha_id: number;
  instructor_id: number;
  competencia_id: number;
  ambiente_id: number | null;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  tipo_actividad_id: number | null;
  jornada_id: number;
  semana: string;
  estado: string;
  motivo_rechazo: string | null;
  motivo_suspension: string | null;
  activo: boolean;
}

export interface HorarioDetail extends RowDataPacket {
  id: number;
  ficha_numero: string;
  instructor_nombre: string;
  competencia: string;
  ambiente: string;
  jornada: string;
  tipo_actividad: string | null;
  dias: string;
  horas: string;
  estado: string;
  motivo_rechazo: string | null;
  activo: boolean;
}

const DIAS_MAP: Record<number, string> = {
  1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom',
};

export const HorarioModel = {
  async findAll(): Promise<HorarioDetail[]> {
    const [rows] = await pool.query<HorarioDetail[]>(`
      SELECT MIN(h.id) AS id, f.numero_ficha AS ficha_numero, u.nombre AS instructor_nombre,
             c.nombre AS competencia,
             COALESCE(ab.nombre, 'Sin asignar') AS ambiente,
             j.nombre AS jornada,
             ta.nombre AS tipo_actividad,
             GROUP_CONCAT(DISTINCT h.dia_semana ORDER BY h.dia_semana SEPARATOR ',') AS dias,
             CONCAT(TIME_FORMAT(MIN(h.hora_inicio), '%H:%i'), ' - ', TIME_FORMAT(MAX(h.hora_fin), '%H:%i')) AS horas,
             CASE h.estado
               WHEN 'pendiente' THEN 'Pendiente'
               WHEN 'aprobado' THEN 'Aprobado'
               WHEN 'rechazado' THEN 'Rechazado'
               ELSE 'Pendiente'
             END AS estado,
             h.motivo_rechazo,
             h.activo
      FROM horarios h
      JOIN fichas f ON h.ficha_id = f.id
      JOIN instructores i ON h.instructor_id = i.id
      JOIN usuarios u ON i.usuario_id = u.id
      JOIN competencias c ON h.competencia_id = c.id
      LEFT JOIN ambientes ab ON h.ambiente_id = ab.id
      JOIN jornadas j ON h.jornada_id = j.id
      LEFT JOIN tipos_actividad ta ON h.tipo_actividad_id = ta.id
      GROUP BY h.ficha_id, h.instructor_id, h.competencia_id, h.ambiente_id, h.jornada_id,
               h.tipo_actividad_id, h.hora_inicio, h.hora_fin, h.estado, h.motivo_rechazo, h.activo
      ORDER BY MIN(h.id)
    `);

    return rows.map((row) => ({
      ...row,
      dias: row.dias
        ? row.dias.split(',').map((d: string) => DIAS_MAP[Number(d)] ?? d)
        : [],
    })) as unknown as HorarioDetail[];
  },

  async findAllByInstructorId(instructorId: number): Promise<HorarioDetail[]> {
    const [rows] = await pool.query<HorarioDetail[]>(`
      SELECT MIN(h.id) AS id, f.numero_ficha AS ficha_numero, u.nombre AS instructor_nombre,
             c.nombre AS competencia,
             COALESCE(ab.nombre, 'Sin asignar') AS ambiente,
             j.nombre AS jornada,
             ta.nombre AS tipo_actividad,
             GROUP_CONCAT(DISTINCT h.dia_semana ORDER BY h.dia_semana SEPARATOR ',') AS dias,
             CONCAT(TIME_FORMAT(MIN(h.hora_inicio), '%H:%i'), ' - ', TIME_FORMAT(MAX(h.hora_fin), '%H:%i')) AS horas,
             CASE h.estado
               WHEN 'pendiente' THEN 'Pendiente'
               WHEN 'aprobado' THEN 'Aprobado'
               WHEN 'rechazado' THEN 'Rechazado'
               ELSE 'Pendiente'
             END AS estado,
             h.motivo_rechazo,
             h.activo
      FROM horarios h
      JOIN fichas f ON h.ficha_id = f.id
      JOIN instructores i ON h.instructor_id = i.id
      JOIN usuarios u ON i.usuario_id = u.id
      JOIN competencias c ON h.competencia_id = c.id
      LEFT JOIN ambientes ab ON h.ambiente_id = ab.id
      JOIN jornadas j ON h.jornada_id = j.id
      LEFT JOIN tipos_actividad ta ON h.tipo_actividad_id = ta.id
      WHERE h.instructor_id = ?
      GROUP BY h.ficha_id, h.instructor_id, h.competencia_id, h.ambiente_id, h.jornada_id,
               h.tipo_actividad_id, h.hora_inicio, h.hora_fin, h.estado, h.motivo_rechazo, h.activo
      ORDER BY MIN(h.id)
    `, [instructorId]);

    return rows.map((row) => ({
      ...row,
      dias: row.dias
        ? row.dias.split(',').map((d: string) => DIAS_MAP[Number(d)] ?? d)
        : [],
    })) as unknown as HorarioDetail[];
  },

  async findById(id: number): Promise<HorarioDetail | null> {
    const [rows] = await pool.query<HorarioDetail[]>(`
      SELECT h.id, f.numero_ficha AS ficha_numero, u.nombre AS instructor_nombre,
             c.nombre AS competencia,
             COALESCE(ab.nombre, 'Sin asignar') AS ambiente,
             j.nombre AS jornada,
             ta.nombre AS tipo_actividad,
             GROUP_CONCAT(DISTINCT h2.dia_semana ORDER BY h2.dia_semana SEPARATOR ',') AS dias,
             CONCAT(TIME_FORMAT(MIN(h.hora_inicio), '%H:%i'), ' - ', TIME_FORMAT(MAX(h.hora_fin), '%H:%i')) AS horas,
             CASE h.estado
               WHEN 'pendiente' THEN 'Pendiente'
               WHEN 'aprobado' THEN 'Aprobado'
               WHEN 'rechazado' THEN 'Rechazado'
               ELSE 'Pendiente'
             END AS estado,
             h.motivo_rechazo,
             h.activo
      FROM horarios h
      JOIN fichas f ON h.ficha_id = f.id
      JOIN instructores i ON h.instructor_id = i.id
      JOIN usuarios u ON i.usuario_id = u.id
      JOIN competencias c ON h.competencia_id = c.id
      LEFT JOIN ambientes ab ON h.ambiente_id = ab.id
      JOIN jornadas j ON h.jornada_id = j.id
      LEFT JOIN tipos_actividad ta ON h.tipo_actividad_id = ta.id
      JOIN horarios h2 ON h2.id = h.id AND h2.activo = TRUE
      WHERE h.id = ?
      GROUP BY h.id, h.estado, h.motivo_rechazo, h.activo
    `, [id]);
    return rows[0] ?? null;
  },

  async create(data: {
    ficha_id: number;
    instructor_id: number;
    competencia_id: number;
    ambiente_id?: number | null;
    dia_semana: number;
    hora_inicio: string;
    hora_fin: string;
    tipo_actividad_id?: number | null;
    jornada_id: number;
    semana: string;
  }): Promise<number> {
    const [result] = await pool.query(
      `INSERT INTO horarios (ficha_id, instructor_id, competencia_id, ambiente_id,
        dia_semana, hora_inicio, hora_fin, tipo_actividad_id, jornada_id, semana)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.ficha_id,
        data.instructor_id,
        data.competencia_id,
        data.ambiente_id ?? null,
        data.dia_semana,
        data.hora_inicio,
        data.hora_fin,
        data.tipo_actividad_id ?? null,
        data.jornada_id,
        data.semana,
      ],
    );
    return (result as any).insertId;
  },

  async update(id: number, data: {
    dia_semana?: number;
    hora_inicio?: string;
    hora_fin?: string;
    competencia_id?: number;
    ambiente_id?: number | null;
    tipo_actividad_id?: number | null;
  }): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.dia_semana !== undefined) { updates.push('dia_semana = ?'); values.push(data.dia_semana); }
    if (data.hora_inicio !== undefined) { updates.push('hora_inicio = ?'); values.push(data.hora_inicio); }
    if (data.hora_fin !== undefined) { updates.push('hora_fin = ?'); values.push(data.hora_fin); }
    if (data.competencia_id !== undefined) { updates.push('competencia_id = ?'); values.push(data.competencia_id); }
    if (data.ambiente_id !== undefined) { updates.push('ambiente_id = ?'); values.push(data.ambiente_id); }
    if (data.tipo_actividad_id !== undefined) { updates.push('tipo_actividad_id = ?'); values.push(data.tipo_actividad_id); }

    if (updates.length === 0) return;

    values.push(id);
    await pool.query(`UPDATE horarios SET ${updates.join(', ')} WHERE id = ?`, values);
  },

  async toggleActivo(id: number, motivo?: string): Promise<boolean> {
    const [rows] = await pool.query('SELECT activo FROM horarios WHERE id = ?', [id]);
    const current = (rows as any[])[0]?.activo ?? true;
    const nuevo = !current;
    await pool.query(
      'UPDATE horarios SET activo = ?, motivo_suspension = ? WHERE id = ?',
      [nuevo, motivo ?? null, id],
    );
    return nuevo;
  },

  async aprobar(id: number): Promise<void> {
    await pool.query(
      'UPDATE horarios SET estado = ?, activo = TRUE WHERE id = ?',
      ['aprobado', id],
    );
  },

  async rechazar(id: number, motivo: string): Promise<void> {
    await pool.query(
      'UPDATE horarios SET estado = ?, activo = FALSE, motivo_rechazo = ? WHERE id = ?',
      ['rechazado', motivo, id],
    );
  },

  async suspender(id: number, motivo: string): Promise<void> {
    await pool.query(
      'UPDATE horarios SET activo = FALSE, motivo_suspension = ? WHERE id = ?',
      [motivo, id],
    );
  },

  async getHorasPorInstructor(instructorId: number, semana: string): Promise<number> {
    // LEFT JOIN para que los bloques sin tipo asignado (tipo_actividad_id IS NULL)
    // sigan sumando — condición OR IS NULL evita romper horarios pre-01/07/2026.
    // Solo se excluyen bloques con suma_carga_horaria = FALSE (ej. 'Disponible').
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, h.hora_inicio, h.hora_fin)), 0) / 60 AS total_horas
       FROM horarios h
       LEFT JOIN tipos_actividad ta ON h.tipo_actividad_id = ta.id
       WHERE h.instructor_id = ? AND h.semana = ? AND h.activo = TRUE
         AND (ta.suma_carga_horaria = TRUE OR h.tipo_actividad_id IS NULL)`,
      [instructorId, semana],
    );
    return Number((rows[0] as any)?.total_horas ?? 0);
  },

  async hasOverlap(
    instructorId: number,
    diaSemana: number,
    horaInicio: string,
    horaFin: string,
    semana: string,
    excludeId?: number,
  ): Promise<boolean> {
    const query = `
      SELECT 1 FROM horarios
      WHERE instructor_id = ? AND dia_semana = ? AND semana = ? AND activo = TRUE
        AND hora_inicio < ? AND hora_fin > ?
      ${excludeId ? 'AND id != ?' : ''}
      LIMIT 1
    `;
    const params = excludeId
      ? [instructorId, diaSemana, semana, horaFin, horaInicio, excludeId]
      : [instructorId, diaSemana, semana, horaFin, horaInicio];
    const [rows] = await pool.query(query, params);
    return (rows as any[]).length > 0;
  },

  async hasAmbienteOcupado(
    ambienteId: number,
    diaSemana: number,
    jornadaId: number,
    semana: string,
    excludeId?: number,
  ): Promise<boolean> {
    const query = `
      SELECT 1 FROM horarios
      WHERE ambiente_id = ? AND dia_semana = ? AND jornada_id = ? AND semana = ? AND activo = TRUE
      ${excludeId ? 'AND id != ?' : ''}
      LIMIT 1
    `;
    const params = excludeId
      ? [ambienteId, diaSemana, jornadaId, semana, excludeId]
      : [ambienteId, diaSemana, jornadaId, semana];
    const [rows] = await pool.query(query, params);
    return (rows as any[]).length > 0;
  },

  async isInstructorDePlanta(instructorId: number): Promise<boolean> {
    const [rows] = await pool.query(
      `SELECT 1 FROM instructores WHERE id = ? AND tipo_contrato = 'de_planta' LIMIT 1`,
      [instructorId],
    );
    return (rows as any[]).length > 0;
  },

  async isJornadaNocturnaOFinDeSemana(jornadaId: number, diaSemana: number): Promise<boolean> {
    const [rows] = await pool.query(
      `SELECT nombre FROM jornadas WHERE id = ?`,
      [jornadaId],
    );
    const jornada = (rows as any[])[0]?.nombre;
    const esNoche = jornada === 'noche';
    const esFinDeSemana = diaSemana === 6 || diaSemana === 7;
    return esNoche || esFinDeSemana;
  },
};
