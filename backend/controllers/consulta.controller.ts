import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import pool from '../config/db.js';

// Semana (lunes) a mostrar en los paneles: la pedida por query, o por defecto
// la semana con mas horarios registrados (para que el panel salga poblado sin
// depender del reloj del servidor). Devuelve null si no hay horarios.
async function resolverSemana(pedida?: string): Promise<string | null> {
  if (pedida) return pedida;
  const [rows] = await pool.query(
    `SELECT semana FROM horarios WHERE activo = TRUE
     GROUP BY semana ORDER BY COUNT(*) DESC, semana DESC LIMIT 1`,
  );
  const r = (rows as any[])[0]?.semana;
  return r ? (r instanceof Date ? r.toISOString().split('T')[0] : String(r)) : null;
}

export const getCargaHoraria = asyncHandler(async (req: Request, res: Response) => {
  // La carga es SEMANAL (limite 20-40h). Se calcula para una sola semana:
  // ?semana=YYYY-MM-DD (lunes) o, por defecto, la semana actual.
  // Nota: el total_horas se toma SOLO de horarios; no se une a
  // asignacion_competencia porque ese JOIN multiplicaba cada bloque por el
  // numero de competencias (fan-out) e inflaba las horas.
  const semana = await resolverSemana(req.query.semana as string | undefined);
  const [rows] = await pool.query(`
    SELECT
      i.id AS instructor_id,
      u.nombre AS instructor_nombre,
      COALESCE(SUM(TIMESTAMPDIFF(MINUTE, h.hora_inicio, h.hora_fin)) / 60, 0) AS total_horas,
      COUNT(DISTINCT h.ficha_id) AS fichas_count,
      COUNT(DISTINCT h.competencia_id) AS competencias_count,
      CASE
        WHEN COALESCE(SUM(TIMESTAMPDIFF(MINUTE, h.hora_inicio, h.hora_fin)) / 60, 0) > 40 THEN 'Sobrecarga'
        WHEN COALESCE(SUM(TIMESTAMPDIFF(MINUTE, h.hora_inicio, h.hora_fin)) / 60, 0) < 20 THEN 'Bajo carga'
        ELSE 'Normal'
      END AS estado
    FROM instructores i
    JOIN usuarios u ON i.usuario_id = u.id
    LEFT JOIN horarios h ON h.instructor_id = i.id AND h.activo = TRUE
      AND h.semana = ?
    WHERE i.activo = TRUE
    GROUP BY i.id, u.nombre
    ORDER BY total_horas DESC
  `, [semana]);
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

export const getOcupacionAmbientes = asyncHandler(async (req: Request, res: Response) => {
  // Ocupacion SEMANAL: horas-reloj que el aula esta fisicamente ocupada, sobre
  // la disponibilidad real del ambiente: 16h/dia (manana 6h + tarde 6h + noche 4h)
  // x 6 dias (Lun-Sab) = 96h/semana. Asi, usar solo 2 de las 3 jornadas NO da 100%.
  // (Si el centro opera Lun-Vie, cambiar 96 por 80 = 16 x 5.)
  // La ficha/grupo es el eje: si dos instructores dictan el MISMO slot (dia+hora)
  // en el mismo ambiente (trabajo conjunto sobre la misma ficha), es UNA sola
  // ocupacion fisica, no el doble. Por eso se cuentan slots DISTINTOS
  // (dia_semana, hora_inicio, hora_fin), no bloques por instructor.
  // ?semana=YYYY-MM-DD (lunes) o, por defecto, la semana con mas horarios.
  const semana = await resolverSemana(req.query.semana as string | undefined);
  const [rows] = await pool.query(`
    SELECT
      ab.nombre AS ambiente_nombre,
      ab.tipo,
      ab.capacidad,
      COALESCE(oc.horas, 0) AS horas_ocupadas,
      96 AS horas_totales,
      ROUND(COALESCE(oc.horas, 0) / 96 * 100, 1) AS porcentaje
    FROM ambientes ab
    LEFT JOIN (
      SELECT ambiente_id,
             SUM(TIMESTAMPDIFF(MINUTE, hora_inicio, hora_fin)) / 60 AS horas
      FROM (
        SELECT DISTINCT ambiente_id, dia_semana, hora_inicio, hora_fin
        FROM horarios
        WHERE activo = TRUE AND semana = ? AND ambiente_id IS NOT NULL
      ) slots
      GROUP BY ambiente_id
    ) oc ON oc.ambiente_id = ab.id
    WHERE ab.activo = TRUE
    ORDER BY porcentaje DESC
  `, [semana]);
  // Convertir DECIMAL (string de mysql2) a number: evita "60.0000h" y el NaN
  // en el promedio de ocupacion del PDF/frontend.
  const data = (rows as any[]).map((r) => ({
    ...r,
    horas_ocupadas: Number(r.horas_ocupadas),
    porcentaje: Number(r.porcentaje),
  }));
  ApiResponse.success(res, data);
});
