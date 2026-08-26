import * as XLSX from 'xlsx';
import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';
import { ValidationError } from '../utils/errors.js';
import { FichaService } from './ficha.service.js';
import { AsignacionService } from './asignacion.service.js';
import { HorarioService } from './horario.service.js';
import { InstructorService } from './instructor.service.js';

// ============================================================
// P39 — Importador de datos via Excel (24/07 feedback lider, 31/07 Laura)
// Un archivo .xlsx con una hoja por entidad. Columnas legibles (email,
// numero de grupo, codigo), resueltas a IDs. Reusa los services existentes
// para que apliquen las mismas validaciones de negocio (RN).
// Se procesan en orden de dependencia: Grupos -> Asignaciones -> Horarios.
// ============================================================

// --- helpers de normalizacion ---
function norm(v: unknown): string {
  return String(v ?? '').trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, ''); // quita tildes
}

const DIAS: Record<string, number> = {
  '1': 1, 'lunes': 1, '2': 2, 'martes': 2, '3': 3, 'miercoles': 3,
  '4': 4, 'jueves': 4, '5': 5, 'viernes': 5, '6': 6, 'sabado': 6, '7': 7, 'domingo': 7,
};

function toDiaSemana(v: unknown): number {
  const d = DIAS[norm(v)];
  if (!d) throw new ValidationError(`dia_semana invalido: "${v}" (usa 1-7 o Lunes..Domingo)`);
  return d;
}

function toHora(v: unknown): string {
  const s = String(v ?? '').trim();
  if (!/^\d{1,2}:\d{2}$/.test(s)) throw new ValidationError(`hora invalida: "${v}" (formato HH:MM)`);
  return s.length === 4 ? '0' + s : s;
}

function toFecha(v: unknown): string {
  const s = String(v ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new ValidationError(`fecha invalida: "${v}" (formato YYYY-MM-DD)`);
  return s;
}

// --- resolvers nombre/codigo -> id ---
async function unico(sql: string, params: any[], entidad: string, valor: unknown): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(sql, params);
  if (rows.length === 0) throw new ValidationError(`${entidad} no encontrado: "${valor}"`);
  return (rows[0] as any).id;
}

const resolver = {
  programa: (codigo: unknown) =>
    unico('SELECT id FROM programas WHERE codigo = ? AND activo = TRUE LIMIT 1', [String(codigo ?? '').trim()], 'Programa', codigo),
  jornada: (nombre: unknown) =>
    unico('SELECT id FROM jornadas WHERE LOWER(nombre) = ? LIMIT 1', [norm(nombre).replace('mañana', 'manana')], 'Jornada', nombre),
  ficha: (numero: unknown) =>
    unico('SELECT id FROM fichas WHERE numero_ficha = ? LIMIT 1', [String(numero ?? '').trim()], 'Grupo', numero),
  competencia: (codigo: unknown) =>
    unico('SELECT id FROM competencias WHERE codigo = ? AND activo = TRUE LIMIT 1', [String(codigo ?? '').trim()], 'Competencia', codigo),
  async instructor(email: unknown): Promise<number> {
    return unico(
      `SELECT i.id FROM instructores i JOIN usuarios u ON i.usuario_id = u.id
       WHERE LOWER(u.email) = LOWER(?) AND i.activo = TRUE LIMIT 1`,
      [String(email ?? '').trim()], 'Instructor', email);
  },
  async ambiente(nombre: unknown): Promise<number | null> {
    if (!nombre) return null;
    return unico('SELECT id FROM ambientes WHERE nombre = ? AND activo = TRUE LIMIT 1', [String(nombre).trim()], 'Ambiente', nombre);
  },
  async rap(codigo: unknown): Promise<number | null> {
    if (!codigo) return null;
    return unico('SELECT id FROM raps WHERE codigo = ? AND activo = TRUE LIMIT 1', [String(codigo).trim()], 'RAP', codigo);
  },
  async usuarioEmail(email: unknown): Promise<number | null> {
    if (!email) return null;
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM usuarios WHERE LOWER(email) = LOWER(?) LIMIT 1', [String(email).trim()]);
    return rows.length ? (rows[0] as any).id : null;
  },
  async tipoActividad(nombre: unknown): Promise<number | null> {
    if (!nombre) return null;
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM tipos_actividad WHERE nombre = ? LIMIT 1', [String(nombre).trim()]);
    return rows.length ? (rows[0] as any).id : null;
  },
};

// --- procesadores por hoja ---
async function procesarInstructor(row: any): Promise<void> {
  const nombre = String(row['nombre'] ?? '').trim();
  const email = String(row['email'] ?? '').trim();
  const tipoArea = norm(row['tipo_area']);
  if (!nombre || !email) throw new ValidationError('nombre y email son obligatorios');
  if (tipoArea !== 'tecnica' && tipoArea !== 'transversal') {
    throw new ValidationError(`tipo_area invalido: "${row['tipo_area']}" (usa tecnica o transversal)`);
  }

  // Idempotente: si el instructor ya existe (seed o import previo) se reusa,
  // y de todos modos se aplican las habilitadas. Antes lanzaba ConflictError
  // y omitia las habilitadas, dejando al instructor sin competencias y
  // bloqueando sus asignaciones por RN-13.
  const inst = await InstructorService.findOrCreateByEmail(nombre, email, tipoArea);

  // Competencias habilitadas (opcional) — evita bloqueos RN-13 al asignar.
  // addCompetencia es INSERT IGNORE, asi que reimportar no duplica.
  const cods = String(row['codigos_competencia'] ?? '').split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  for (const cod of cods) {
    const compId = await resolver.competencia(cod);
    await InstructorService.addCompetencia(inst.id, compId);
  }
}

async function procesarGrupo(row: any): Promise<void> {
  await FichaService.create({
    numero_ficha: String(row['numero_grupo'] ?? row['numero_ficha'] ?? '').trim(),
    programa_id: await resolver.programa(row['codigo_programa']),
    jornada_id: await resolver.jornada(row['jornada']),
    ambiente_id: await resolver.ambiente(row['ambiente']),
    lider_id: await resolver.usuarioEmail(row['lider_email']),
    etapa: row['etapa'] ? norm(row['etapa']) : undefined,
    fecha_inicio_lectiva: row['fecha_inicio_lectiva'] ? toFecha(row['fecha_inicio_lectiva']) : undefined,
    fecha_fin_lectiva: row['fecha_fin_lectiva'] ? toFecha(row['fecha_fin_lectiva']) : undefined,
    fecha_inicio_productiva: row['fecha_inicio_productiva'] ? toFecha(row['fecha_inicio_productiva']) : undefined,
    fecha_fin_productiva: row['fecha_fin_productiva'] ? toFecha(row['fecha_fin_productiva']) : undefined,
  });
}

async function procesarAsignacion(row: any): Promise<void> {
  const competencia_ids: number[] = [];
  for (const cod of String(row['codigos_competencia'] ?? row['codigo_competencia'] ?? '').split(/[,;]/)) {
    if (cod.trim()) competencia_ids.push(await resolver.competencia(cod.trim()));
  }
  if (competencia_ids.length === 0) throw new ValidationError('Se requiere al menos un codigo_competencia');

  const instructor_id = await resolver.instructor(row['instructor_email']);

  // La asignacion importada es fuente autoritativa (viene del reporte oficial de
  // coordinacion). Garantizamos que el instructor quede habilitado para esas
  // competencias antes de crear la asignacion, para que RN-13 no bloquee la
  // carga masiva cuando la hoja Instructores no listo la competencia. Solo
  // aplica en el importador; el flujo de UI sigue exigiendo habilitacion previa.
  // addCompetencia es INSERT IGNORE: no duplica en reimports.
  for (const compId of competencia_ids) {
    await InstructorService.addCompetencia(instructor_id, compId);
  }

  await AsignacionService.create({
    instructor_id,
    ficha_id: await resolver.ficha(row['numero_grupo'] ?? row['numero_ficha']),
    jornada_id: row['jornada'] ? await resolver.jornada(row['jornada']) : null,
    es_lider_ficha: norm(row['es_lider']) === 'si' || norm(row['es_lider']) === 'true',
    competencia_ids,
  });
}

async function procesarHorario(row: any): Promise<void> {
  await HorarioService.create({
    instructor_id: await resolver.instructor(row['instructor_email']),
    ficha_id: await resolver.ficha(row['numero_grupo'] ?? row['numero_ficha']),
    competencia_id: await resolver.competencia(row['codigo_competencia']),
    rap_id: await resolver.rap(row['codigo_rap']),
    ambiente_id: await resolver.ambiente(row['ambiente']),
    dia_semana: toDiaSemana(row['dia_semana'] ?? row['dia']),
    hora_inicio: toHora(row['hora_inicio']),
    hora_fin: toHora(row['hora_fin']),
    tipo_actividad_id: await resolver.tipoActividad(row['tipo_actividad']),
    jornada_id: await resolver.jornada(row['jornada']),
    semana: row['semana'] ? toFecha(row['semana']) : undefined,
  });
}

const HOJAS: { nombre: string; fn: (row: any) => Promise<void> }[] = [
  { nombre: 'Instructores', fn: procesarInstructor },
  { nombre: 'Grupos', fn: procesarGrupo },
  { nombre: 'Asignaciones', fn: procesarAsignacion },
  { nombre: 'Horarios', fn: procesarHorario },
];

export interface ResumenHoja {
  hoja: string;
  filas: number;
  creados: number;
  errores: { fila: number; mensaje: string }[];
}

export const ImportarService = {
  async importar(archivoBase64: string): Promise<{ resumen: ResumenHoja[] }> {
    if (!archivoBase64) throw new ValidationError('archivo_base64 es obligatorio');

    let wb: XLSX.WorkBook;
    try {
      const limpio = archivoBase64.replace(/^data:.*;base64,/, '');
      wb = XLSX.read(Buffer.from(limpio, 'base64'), { type: 'buffer' });
    } catch {
      throw new ValidationError('No se pudo leer el archivo (¿es un .xlsx valido en base64?)');
    }

    const resumen: ResumenHoja[] = [];

    for (const { nombre, fn } of HOJAS) {
      const ws = wb.Sheets[nombre];
      if (!ws) continue; // hoja opcional: si no viene, se omite

      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: null });
      const r: ResumenHoja = { hoja: nombre, filas: rows.length, creados: 0, errores: [] };

      for (let i = 0; i < rows.length; i++) {
        const fila = i + 2; // fila 1 = encabezados
        // Saltar filas totalmente vacias
        if (Object.values(rows[i]).every((v) => v === null || String(v).trim() === '')) continue;
        try {
          await fn(rows[i]);
          r.creados++;
        } catch (err: any) {
          r.errores.push({ fila, mensaje: err?.message ?? 'Error desconocido' });
        }
      }
      resumen.push(r);
    }

    if (resumen.length === 0) {
      throw new ValidationError('El archivo no contiene ninguna hoja valida (Instructores, Grupos, Asignaciones u Horarios)');
    }

    return { resumen };
  },
};
