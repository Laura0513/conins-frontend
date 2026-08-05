import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import pool from '../config/db.js';

export const getCargaHoraria = asyncHandler(async (_req: Request, res: Response) => {
  const [rows] = await pool.query(`
    SELECT
      i.id AS instructor_id,
      u.nombre AS instructor_nombre,
      COALESCE(SUM(TIMESTAMPDIFF(MINUTE, h.hora_inicio, h.hora_fin)) / 60, 0) AS total_horas,
      COUNT(DISTINCT h.ficha_id) AS fichas_count,
      COUNT(DISTINCT ac.competencia_id) AS competencias_count,
      CASE
        WHEN COALESCE(SUM(TIMESTAMPDIFF(MINUTE, h.hora_inicio, h.hora_fin)) / 60, 0) > 40 THEN 'Sobrecarga'
        WHEN COALESCE(SUM(TIMESTAMPDIFF(MINUTE, h.hora_inicio, h.hora_fin)) / 60, 0) < 20 THEN 'Bajo carga'
        ELSE 'Normal'
      END AS estado
    FROM instructores i
    JOIN usuarios u ON i.usuario_id = u.id
    LEFT JOIN horarios h ON h.instructor_id = i.id AND h.activo = TRUE
    LEFT JOIN asignacion a ON a.instructor_id = i.id AND a.activo = TRUE
    LEFT JOIN asignacion_competencia ac ON ac.asignacion_id = a.id AND ac.activo = TRUE
    WHERE i.activo = TRUE
    GROUP BY i.id, u.nombre
    ORDER BY total_horas DESC
  `);
  // total_horas viene como string (DECIMAL de mysql2) — se envia como number
  const data = (rows as any[]).map((r) => ({ ...r, total_horas: Number(r.total_horas) }));
  ApiResponse.success(res, data);
});

export const getHorariosFicha = asyncHandler(async (_req: Request, res: Response) => {
  const [rows] = await pool.query(`
    SELECT
      f.numero_ficha AS ficha_numero,
      p.nombre AS programa,
      MAX(CASE WHEN h.dia_semana = 1 THEN CONCAT(TIME_FORMAT(h.hora_inicio, '%H:%i'), ' - ', TIME_FORMAT(h.hora_fin, '%H:%i'), ' (', c.nombre, ')') ELSE NULL END) AS lunes,
      MAX(CASE WHEN h.dia_semana = 2 THEN CONCAT(TIME_FORMAT(h.hora_inicio, '%H:%i'), ' - ', TIME_FORMAT(h.hora_fin, '%H:%i'), ' (', c.nombre, ')') ELSE NULL END) AS martes,
      MAX(CASE WHEN h.dia_semana = 3 THEN CONCAT(TIME_FORMAT(h.hora_inicio, '%H:%i'), ' - ', TIME_FORMAT(h.hora_fin, '%H:%i'), ' (', c.nombre, ')') ELSE NULL END) AS miercoles,
      MAX(CASE WHEN h.dia_semana = 4 THEN CONCAT(TIME_FORMAT(h.hora_inicio, '%H:%i'), ' - ', TIME_FORMAT(h.hora_fin, '%H:%i'), ' (', c.nombre, ')') ELSE NULL END) AS jueves,
      MAX(CASE WHEN h.dia_semana = 5 THEN CONCAT(TIME_FORMAT(h.hora_inicio, '%H:%i'), ' - ', TIME_FORMAT(h.hora_fin, '%H:%i'), ' (', c.nombre, ')') ELSE NULL END) AS viernes,
      MAX(CASE WHEN h.dia_semana = 6 THEN CONCAT(TIME_FORMAT(h.hora_inicio, '%H:%i'), ' - ', TIME_FORMAT(h.hora_fin, '%H:%i'), ' (', c.nombre, ')') ELSE NULL END) AS sabado
    FROM fichas f
    JOIN programas p ON f.programa_id = p.id
    LEFT JOIN horarios h ON h.ficha_id = f.id AND h.activo = TRUE
    LEFT JOIN competencias c ON h.competencia_id = c.id
    WHERE f.activo = TRUE AND f.estado = 'Activa'
    GROUP BY f.id, f.numero_ficha, p.nombre
    ORDER BY f.numero_ficha
  `);
  ApiResponse.success(res, rows);
});

export const getOcupacionAmbientes = asyncHandler(async (_req: Request, res: Response) => {
  const [rows] = await pool.query(`
    SELECT
      ab.nombre AS ambiente_nombre,
      ab.tipo,
      ab.capacidad,
      COALESCE(SUM(TIMESTAMPDIFF(MINUTE, h.hora_inicio, h.hora_fin)) / 60, 0) AS horas_ocupadas,
      40 AS horas_totales,
      ROUND(
        COALESCE(SUM(TIMESTAMPDIFF(MINUTE, h.hora_inicio, h.hora_fin)) / 60, 0) / 40 * 100,
        1
      ) AS porcentaje
    FROM ambientes ab
    LEFT JOIN horarios h ON h.ambiente_id = ab.id AND h.activo = TRUE
    WHERE ab.activo = TRUE
    GROUP BY ab.id, ab.nombre, ab.tipo, ab.capacidad
    ORDER BY porcentaje DESC
  `);
  ApiResponse.success(res, rows);
});
