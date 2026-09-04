import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import { ValidationError } from '../utils/errors.js';
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
  ApiResponse.success(res, await dataCargaHoraria(semana));
});

// Datos crudos de carga horaria (reusados por el panel JSON y por el Excel).
async function dataCargaHoraria(semana: string | null) {
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
  return (rows as any[]).map((r) => ({ ...r, total_horas: Number(r.total_horas) }));
}

export const getHorariosFicha = asyncHandler(async (_req: Request, res: Response) => {
  ApiResponse.success(res, await dataHorariosFicha());
});

// Datos crudos de horario por grupo (reusados por el panel JSON y por el Excel).
async function dataHorariosFicha() {
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
  return rows as any[];
}

// Correcciones pendientes del importador: errores ubicables detectados en la
// ultima previsualizacion (RAP/competencia sin coincidencia, horas invalidas,
// etc.). Persistidas para que coordinacion/subdireccion/admin las tengan a la
// mano en Reportes aunque se cierre la pestana del importador.
export const getCorrecciones = asyncHandler(async (_req: Request, res: Response) => {
  const [rows] = await pool.query(
    `SELECT id, hoja, fila, entidad, valor, motivo, resuelta, created_at
     FROM import_correcciones
     ORDER BY hoja, fila`,
  );
  ApiResponse.success(res, rows);
});

// Calendario semanal PARAMETRIZABLE: la misma vista para un grupo, un instructor
// o un ambiente. Cambia solo el filtro (columna) segun `tipo`. Devuelve la malla
// lista para pintar (dias 1-6 x jornadas) y sirve igual para vista de dia o de
// semana. GET /api/consultas/calendario?tipo=grupo|instructor|ambiente&id=:id&semana=YYYY-MM-DD
export const getCalendario = asyncHandler(async (req: Request, res: Response) => {
  const tipo = String(req.query.tipo ?? '').toLowerCase();
  const id = Number(req.query.id);

  // Whitelist: define la columna de filtro y como resolver el nombre de la entidad.
  // Nunca se interpola input del usuario en el SQL (solo se elige de este mapa fijo).
  const MAPA: Record<string, { col: string; nombreSql: string }> = {
    grupo: { col: 'h.ficha_id', nombreSql: 'SELECT numero_ficha AS nombre FROM fichas WHERE id = ?' },
    instructor: { col: 'h.instructor_id', nombreSql: 'SELECT u.nombre FROM instructores i JOIN usuarios u ON i.usuario_id = u.id WHERE i.id = ?' },
    ambiente: { col: 'h.ambiente_id', nombreSql: 'SELECT nombre FROM ambientes WHERE id = ?' },
  };
  const cfg = MAPA[tipo];
  if (!cfg) throw new ValidationError("El parametro 'tipo' debe ser grupo, instructor o ambiente");
  if (!id || Number.isNaN(id)) throw new ValidationError("Falta el parametro 'id' de la entidad");

  const semana = await resolverSemana(req.query.semana as string | undefined);

  const [nombreRows] = await pool.query(cfg.nombreSql, [id]);
  const nombre = (nombreRows as any[])[0]?.nombre ?? null;

  const [jornadas] = await pool.query(
    `SELECT id, nombre, TIME_FORMAT(hora_inicio,'%H:%i') AS hora_inicio, TIME_FORMAT(hora_fin,'%H:%i') AS hora_fin
     FROM jornadas ORDER BY id`,
  );

  const [celdasRaw] = await pool.query(
    `SELECT h.id AS horario_id, h.dia_semana, h.jornada_id,
            f.numero_ficha AS grupo, u.nombre AS instructor,
            c.nombre AS competencia, a.nombre AS ambiente,
            TIME_FORMAT(h.hora_inicio,'%H:%i') AS hora_inicio,
            TIME_FORMAT(h.hora_fin,'%H:%i')    AS hora_fin,
            h.estado
     FROM horarios h
     JOIN fichas f       ON h.ficha_id = f.id
     JOIN instructores i ON h.instructor_id = i.id
     JOIN usuarios u     ON i.usuario_id = u.id
     LEFT JOIN competencias c ON h.competencia_id = c.id
     LEFT JOIN ambientes a    ON h.ambiente_id = a.id
     WHERE ${cfg.col} = ? AND h.semana = ? AND h.activo = TRUE
     ORDER BY h.dia_semana, h.jornada_id, h.hora_inicio`,
    [id, semana],
  );

  // Marca solapado=true cuando hay 2+ horarios en el mismo dia+jornada de esta
  // vista (co-docencia en grupo, cruce del instructor, o ambiente compartido):
  // util para resaltar la casilla; el detalle de la alerta ya vive en /alertas.
  const celdas = celdasRaw as any[];
  const cuenta = new Map<string, number>();
  for (const c of celdas) cuenta.set(`${c.dia_semana}-${c.jornada_id}`, (cuenta.get(`${c.dia_semana}-${c.jornada_id}`) ?? 0) + 1);
  for (const c of celdas) c.solapado = (cuenta.get(`${c.dia_semana}-${c.jornada_id}`) ?? 0) > 1;

  ApiResponse.success(res, {
    tipo,
    entidad: { id, nombre },
    semana,
    jornadas,
    celdas,
  });
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
  ApiResponse.success(res, await dataOcupacion(semana));
});

// Datos crudos de ocupacion de ambientes (reusados por el panel JSON y el Excel).
async function dataOcupacion(semana: string | null) {
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
  return (rows as any[]).map((r) => ({
    ...r,
    horas_ocupadas: Number(r.horas_ocupadas),
    porcentaje: Number(r.porcentaje),
  }));
}

// Descarga de reportes en Excel (.xlsx). Reusa exactamente los datos de los
// paneles JSON. GET /api/consultas/excel?reporte=carga|horarios|ocupacion|correcciones&semana=
export const getExcel = asyncHandler(async (req: Request, res: Response) => {
  const reporte = String(req.query.reporte ?? '').toLowerCase();
  const semana = await resolverSemana(req.query.semana as string | undefined);

  let filas: any[] = [];
  let hoja = '';
  let archivo = '';

  if (reporte === 'carga') {
    const d = await dataCargaHoraria(semana);
    filas = d.map((x: any) => ({
      Instructor: x.instructor_nombre, 'Horas semana': Number(x.total_horas),
      Grupos: x.fichas_count, Competencias: x.competencias_count, Estado: x.estado,
    }));
    hoja = 'Carga horaria'; archivo = 'carga-horaria';
  } else if (reporte === 'horarios') {
    const d = await dataHorariosFicha();
    filas = d.map((x: any) => ({
      Grupo: x.ficha_numero, Programa: x.programa,
      Lunes: x.lunes || '', Martes: x.martes || '', Miercoles: x.miercoles || '',
      Jueves: x.jueves || '', Viernes: x.viernes || '', Sabado: x.sabado || '',
    }));
    hoja = 'Horario por grupo'; archivo = 'horario-por-grupo';
  } else if (reporte === 'ocupacion') {
    const d = await dataOcupacion(semana);
    filas = d.map((x: any) => ({
      Ambiente: x.ambiente_nombre, Tipo: x.tipo, Capacidad: x.capacidad,
      'Horas ocupadas': Number(x.horas_ocupadas), 'Horas totales': x.horas_totales,
      'Ocupacion %': Number(x.porcentaje),
    }));
    hoja = 'Ocupacion ambientes'; archivo = 'ocupacion-ambientes';
  } else if (reporte === 'correcciones') {
    const [rows] = await pool.query('SELECT hoja, fila, entidad, valor, motivo FROM import_correcciones ORDER BY hoja, fila');
    filas = (rows as any[]).map((x) => ({ Hoja: x.hoja, Fila: x.fila, Dato: x.entidad, Valor: x.valor, Motivo: x.motivo }));
    hoja = 'Correcciones'; archivo = 'correcciones-pendientes';
  } else {
    throw new ValidationError("El parametro 'reporte' debe ser: carga | horarios | ocupacion | correcciones");
  }

  const ws = XLSX.utils.json_to_sheet(filas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, hoja);
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const fecha = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${archivo}-${fecha}.xlsx"`);
  res.send(buffer);
});

// Avance de RAPs por GRUPO (control de coordinacion): cuantos RAPs tiene el grupo
// en seguimiento y cuantos van evaluados / aprobados / no aprobados / faltantes.
// GET /api/consultas/rap-avance
export const getRapAvance = asyncHandler(async (_req: Request, res: Response) => {
  const [rows] = await pool.query(`
    SELECT
      f.id AS ficha_id, f.numero_ficha, p.nombre AS programa,
      COUNT(rfs.id) AS total,
      SUM(rfs.estado_evaluacion = 'evaluado') AS evaluados,
      SUM(rfs.estado_aprobacion = 'aprobado') AS aprobados,
      SUM(rfs.estado_aprobacion = 'no_aprobado') AS no_aprobados,
      SUM(rfs.estado_evaluacion = 'pendiente_por_evaluar') AS pendientes
    FROM fichas f
    JOIN programas p ON f.programa_id = p.id
    JOIN asignacion a ON a.ficha_id = f.id AND a.activo = TRUE
    JOIN asignacion_competencia ac ON ac.asignacion_id = a.id AND ac.activo = TRUE
    JOIN rap_ficha_seguimiento rfs ON rfs.asignacion_competencia_id = ac.id AND rfs.activo = TRUE
    WHERE f.activo = TRUE
    GROUP BY f.id, f.numero_ficha, p.nombre
    ORDER BY f.numero_ficha
  `);
  const data = (rows as any[]).map((r) => {
    const total = Number(r.total), evaluados = Number(r.evaluados);
    return {
      ficha_id: r.ficha_id, numero_ficha: r.numero_ficha, programa: r.programa,
      total, evaluados, aprobados: Number(r.aprobados), no_aprobados: Number(r.no_aprobados),
      pendientes: Number(r.pendientes),
      porcentaje_evaluado: total > 0 ? Math.round((evaluados / total) * 100) : 0,
    };
  });
  ApiResponse.success(res, data);
});

// Detalle del avance de RAPs de UN grupo, desglosado por competencia (incluye el
// asignacion_competencia_id para el boton "Aprobar todos"). GET /api/consultas/rap-avance/:fichaId
export const getRapAvanceFicha = asyncHandler(async (req: Request, res: Response) => {
  const fichaId = Number(req.params.fichaId);
  if (!fichaId || Number.isNaN(fichaId)) throw new ValidationError('fichaId invalido');
  const [rows] = await pool.query(`
    SELECT
      c.id AS competencia_id, c.nombre AS competencia, ac.id AS asignacion_competencia_id,
      COUNT(rfs.id) AS total,
      SUM(rfs.estado_evaluacion = 'evaluado') AS evaluados,
      SUM(rfs.estado_aprobacion = 'aprobado') AS aprobados,
      SUM(rfs.estado_aprobacion = 'no_aprobado') AS no_aprobados,
      SUM(rfs.estado_evaluacion = 'pendiente_por_evaluar') AS pendientes
    FROM rap_ficha_seguimiento rfs
    JOIN asignacion_competencia ac ON rfs.asignacion_competencia_id = ac.id AND ac.activo = TRUE
    JOIN asignacion a ON ac.asignacion_id = a.id AND a.activo = TRUE
    JOIN raps r ON rfs.rap_id = r.id
    JOIN competencias c ON r.competencia_id = c.id
    WHERE a.ficha_id = ? AND rfs.activo = TRUE
    GROUP BY c.id, c.nombre, ac.id
    ORDER BY c.nombre
  `, [fichaId]);
  const porCompetencia = (rows as any[]).map((r) => {
    const total = Number(r.total), evaluados = Number(r.evaluados);
    return {
      competencia_id: r.competencia_id, competencia: r.competencia,
      asignacion_competencia_id: r.asignacion_competencia_id,
      total, evaluados, aprobados: Number(r.aprobados), no_aprobados: Number(r.no_aprobados),
      pendientes: Number(r.pendientes),
      porcentaje_evaluado: total > 0 ? Math.round((evaluados / total) * 100) : 0,
    };
  });
  const resumen = porCompetencia.reduce((acc, c) => ({
    total: acc.total + c.total, evaluados: acc.evaluados + c.evaluados,
    aprobados: acc.aprobados + c.aprobados, no_aprobados: acc.no_aprobados + c.no_aprobados,
    pendientes: acc.pendientes + c.pendientes,
  }), { total: 0, evaluados: 0, aprobados: 0, no_aprobados: 0, pendientes: 0 });
  ApiResponse.success(res, { ficha_id: fichaId, resumen, por_competencia: porCompetencia });
});
