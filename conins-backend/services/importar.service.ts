import * as XLSX from 'xlsx';
import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';
import { ValidationError, DuplicadoError } from '../utils/errors.js';
import { FichaService } from './ficha.service.js';
import { AsignacionService } from './asignacion.service.js';
import { HorarioService } from './horario.service.js';
import { InstructorService } from './instructor.service.js';
import { FichaModel } from '../models/ficha.model.js';
import { AsignacionModel } from '../models/asignacion.model.js';
import { HorarioModel } from '../models/horario.model.js';
import {
  detectarFormato, normalizarCrudo, filasATemplateBase64, detectarPosibleBaja, PreviewResultado,
} from './normalizador.service.js';

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

// Canoniza el nombre de un ambiente numerado: "202", "Aula 202", "Ambiente 202",
// "Salon 202" -> "Ambiente 202". Debe coincidir con parseAmbiente del normalizador.
// Sin esto, un Excel que dice "Aula 202" no matchea el catalogo ("Ambiente 202"),
// se toma como ambiente nuevo/duplicado y RN-05 (AMBIENTE_OCUPADO) no detecta el choque.
function canonAmbiente(v: unknown): string {
  const s = String(v ?? '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  if (s.toLowerCase().includes('estrella')) return 'Aula Ambiental La Estrella';
  const m = s.match(/^(?:aula|ambiente|salon|sal[oó]n|amb\.?)?\s*(\d+)$/i);
  return m ? `Ambiente ${m[1]}` : s;
}

const DIAS: Record<string, number> = {
  '1': 1, 'lunes': 1, '2': 2, 'martes': 2, '3': 3, 'miercoles': 3,
  '4': 4, 'jueves': 4, '5': 5, 'viernes': 5, '6': 6, 'sabado': 6, '7': 7, 'domingo': 7,
};

const DIA_NOMBRE: Record<number, string> = {
  1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes', 6: 'sabado', 7: 'domingo',
};

// Contexto humano de la fila para que un error sea UBICABLE sin depender del
// numero de fila del template: nombra al instructor (por NOMBRE, no correo),
// grupo, dia y horas. `nombres` = mapa email -> nombre de la hoja Instructores.
function contextoFila(hoja: string, row: any, nombres: Map<string, string>): string {
  const g = row['numero_grupo'] ?? row['numero_ficha'];
  const email = String(row['instructor_email'] ?? row['email'] ?? '').trim().toLowerCase();
  const persona = nombres.get(email) ?? row['nombre'] ?? row['instructor_email'] ?? row['email'] ?? '?';
  if (hoja === 'Horarios') {
    const dia = DIA_NOMBRE[Number(row['dia_semana'])] ?? String(row['dia_semana'] ?? '');
    const horas = row['hora_inicio'] && row['hora_fin'] ? ` ${row['hora_inicio']}-${row['hora_fin']}` : '';
    return `Instructor ${persona} · grupo ${g ?? '?'} · ${dia}${horas}`.trim();
  }
  if (hoja === 'Asignaciones') return `Instructor ${persona} · grupo ${g ?? '?'}`;
  if (hoja === 'Grupos') return `Grupo ${g ?? '?'}`;
  if (hoja === 'Instructores') return `${row['nombre'] ?? persona}`;
  return '';
}

// Referencia a la ubicacion en el Excel cargado (hoja + fila), si el template la
// trae. Se dice "Excel cargado" (no "del lider") para no señalar a una persona.
function origenFila(row: any): string {
  return row['origen_hoja']
    ? ` [Excel cargado: hoja "${row['origen_hoja']}", fila ${row['origen_fila']}]`
    : '';
}

function toDiaSemana(v: unknown): number {
  const d = DIAS[norm(v)];
  if (!d) throw new ValidationError(`dia_semana invalido: "${v}" (usa 1-7 o Lunes..Domingo)`);
  return d;
}

function toHora(v: unknown): string {
  const s = String(v ?? '').trim();
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) throw new ValidationError(`hora invalida: "${v}" (formato HH:MM)`);
  const h = Number(m[1]);
  const min = Number(m[2]);
  // La hora debe EXISTIR (00:00–23:59). Antes solo se validaba el formato, asi
  // que un dato mal escrito como "28:00" pasaba y luego aparecia como un falso
  // "cruce de horarios". Ahora se rechaza con un mensaje claro y ubicable.
  if (h > 23 || min > 59) {
    throw new ValidationError(`la hora "${v}" no existe (debe estar entre 00:00 y 23:59)`);
  }
  return s.length === 4 ? '0' + s : s;
}

function toFecha(v: unknown): string {
  const s = String(v ?? '').trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new ValidationError(`fecha invalida: "${v}" (formato YYYY-MM-DD)`);
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  // La fecha debe EXISTIR (no solo tener el formato): rechaza 2026-13-45, etc.
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    throw new ValidationError(`la fecha "${v}" no existe`);
  }
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
    const canon = canonAmbiente(nombre);
    return unico('SELECT id FROM ambientes WHERE nombre = ? AND activo = TRUE LIMIT 1', [canon], 'Ambiente', canon);
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

  // Idempotencia: si el instructor ya existia, se cuenta como OMITIDO (no error).
  if ((inst as any).reused) throw new DuplicadoError('El instructor ya existe');
}

async function procesarGrupo(row: any): Promise<void> {
  const numero = String(row['numero_grupo'] ?? row['numero_ficha'] ?? '').trim();
  // Idempotencia: si el grupo ya existe, se omite (no se duplica ni es error).
  if (numero && (await FichaModel.findByNumero(numero))) {
    throw new DuplicadoError('El grupo ya existe');
  }
  await FichaService.create({
    numero_ficha: numero,
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
  const ficha_id = await resolver.ficha(row['numero_grupo'] ?? row['numero_ficha']);

  // Idempotencia: si ya existe una asignacion ACTIVA de ese instructor en ese
  // grupo, se omite (no error). Si existe inactiva, el service la reactiva.
  const existente = await AsignacionModel.findRawByInstructorFicha(instructor_id, ficha_id);
  if (existente && (existente as any).activo) {
    throw new DuplicadoError('La asignacion ya existe');
  }

  // La asignacion importada es fuente autoritativa (viene del reporte oficial de
  // coordinacion). Garantizamos que el instructor quede habilitado para esas
  // competencias antes de crear la asignacion, para que RN-13 no bloquee la
  // carga masiva cuando la hoja Instructores no listo la competencia. Solo
  // aplica en el importador; el flujo de UI sigue exigiendo habilitacion previa.
  // addCompetencia es INSERT IGNORE: no duplica en reimports.
  for (const compId of competencia_ids) {
    await InstructorService.addCompetencia(instructor_id, compId);
  }

  // Provisional (RN-11): NO se infiere por area. Los instructores transversales /
  // bilinguismo en ADSO son COMPLEMENTOS del programa (competencias transversales
  // normales), no estan "fuera de su area". Una asignacion es provisional solo si
  // se aclara EXPLICITAMENTE en el Excel (columna es_provisional / provisional) o
  // si la coordinacion la marca a mano en el sistema. Aqui se respeta el flag del
  // Excel si viene; si no, no es provisional.
  const esProvisional = norm(row['es_provisional'] ?? row['provisional']) === 'si'
    || norm(row['es_provisional'] ?? row['provisional']) === 'true';

  await AsignacionService.create({
    instructor_id,
    ficha_id,
    jornada_id: row['jornada'] ? await resolver.jornada(row['jornada']) : null,
    es_lider_ficha: norm(row['es_lider']) === 'si' || norm(row['es_lider']) === 'true',
    es_provisional: esProvisional,
    motivo_provisional: esProvisional ? String(row['motivo_provisional'] ?? 'Provisional segun el Excel de planeacion') : null,
    competencia_ids,
  }, 'import'); // carga masiva: permisivo (alerta), no bloquea RN-06/05/carga
}

async function procesarHorario(row: any): Promise<void> {
  const instructor_id = await resolver.instructor(row['instructor_email']);
  const ficha_id = await resolver.ficha(row['numero_grupo'] ?? row['numero_ficha']);
  const competencia_id = await resolver.competencia(row['codigo_competencia']);
  const dia_semana = toDiaSemana(row['dia_semana'] ?? row['dia']);
  const hora_inicio = toHora(row['hora_inicio']);
  const hora_fin = toHora(row['hora_fin']);
  const semana = row['semana'] ? toFecha(row['semana']) : null;

  // Idempotencia: si ya existe un horario IDENTICO, se omite (no error ni
  // duplicado). Asi se puede re-subir el Excel corregido y solo entra lo nuevo.
  if (semana && (await HorarioModel.existeIdentico(instructor_id, ficha_id, competencia_id, dia_semana, hora_inicio, hora_fin, semana))) {
    throw new DuplicadoError('El horario ya existe');
  }

  await HorarioService.create({
    instructor_id,
    ficha_id,
    competencia_id,
    rap_id: await resolver.rap(row['codigo_rap']),
    ambiente_id: await resolver.ambiente(row['ambiente']),
    dia_semana,
    hora_inicio,
    hora_fin,
    tipo_actividad_id: await resolver.tipoActividad(row['tipo_actividad']),
    jornada_id: await resolver.jornada(row['jornada']),
    semana: semana ?? undefined,
  }, 'import'); // carga masiva: permisivo (alerta), no bloquea RN-06/05/carga
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
  omitidos: number; // ya existian (idempotencia): no son error
  errores: { fila: number; mensaje: string }[];
}

function leerWorkbook(archivoBase64: string): XLSX.WorkBook {
  if (!archivoBase64) throw new ValidationError('archivo_base64 es obligatorio');
  try {
    const limpio = archivoBase64.replace(/^data:.*;base64,/, '');
    return XLSX.read(Buffer.from(limpio, 'base64'), { type: 'buffer' });
  } catch {
    throw new ValidationError('No se pudo leer el archivo (¿es un .xlsx valido en base64?)');
  }
}

// Crea los ambientes aprobados que aun no existen (salones nuevos de la
// planeacion). tipo 'aula' por defecto; el admin puede ajustarlo despues.
async function crearAmbientesAprobados(nombres: string[]): Promise<void> {
  for (const raw of nombres ?? []) {
    const nombre = canonAmbiente(raw);
    if (!nombre) continue;
    const [ex] = await pool.query<RowDataPacket[]>('SELECT id FROM ambientes WHERE nombre = ? LIMIT 1', [nombre]);
    if ((ex as any[]).length) continue;
    await pool.query(
      'INSERT INTO ambientes (nombre, tipo, capacidad, area_id, sede_id) VALUES (?, ?, ?, ?, ?)',
      [nombre, 'aula', 30, null, null],
    );
  }
}

// Persiste las correcciones pendientes detectadas en el preview para que
// coordinacion / subdireccion / admin las tengan a la mano en Reportes aunque se
// cierre la pestana. Reemplaza el set anterior: siempre se muestra lo ultimo
// detectado. Best-effort: un fallo aqui nunca tumba el preview.
async function persistirCorrecciones(
  errores: { hoja?: string; fila?: number; entidad?: string; valor?: string; motivo?: string }[],
): Promise<void> {
  try {
    await pool.query('DELETE FROM import_correcciones');
    if (!errores.length) return;
    const values = errores.map((e) => [
      String(e.hoja ?? ''), Number(e.fila ?? 0), String(e.entidad ?? ''),
      String(e.valor ?? '').slice(0, 255), String(e.motivo ?? '').slice(0, 255),
    ]);
    await pool.query(
      'INSERT INTO import_correcciones (hoja, fila, entidad, valor, motivo) VALUES ?',
      [values],
    );
  } catch (err) {
    console.error('[importar] no se pudieron guardar las correcciones pendientes:', err);
  }
}

export const ImportarService = {
  // Previsualiza SIN escribir: detecta formato, normaliza el crudo del lider
  // contra el catalogo vivo, y clasifica en resumen / nuevos / errores /
  // posible_baja. Devuelve tambien el template normalizado (base64) para que
  // el frontend lo reenvie a importar() cuando el admin confirme.
  async preview(archivoBase64: string, programaCodigo?: string): Promise<PreviewResultado> {
    const wb = leerWorkbook(archivoBase64);
    const formato = detectarFormato(wb);

    if (formato === 'template') {
      const cuenta = (hoja: string) => {
        const ws = wb.Sheets[hoja];
        return ws ? XLSX.utils.sheet_to_json<any>(ws, { defval: null }).length : 0;
      };
      return {
        formato,
        resumen: {
          instructores: cuenta('Instructores'), grupos: cuenta('Grupos'),
          asignaciones: cuenta('Asignaciones'), horarios: cuenta('Horarios'),
        },
        nuevos: { ambientes: [], instructores: [] },
        errores: [],
        posible_baja: { asignaciones: [] },
        plantilla_base64: archivoBase64.replace(/^data:.*;base64,/, ''),
      };
    }

    if (!programaCodigo) {
      throw new ValidationError('Para un Excel de planeacion sin normalizar se requiere el codigo del programa (programa_codigo)');
    }
    const prog = await pool.query<RowDataPacket[]>('SELECT id FROM programas WHERE codigo = ? AND activo = TRUE LIMIT 1', [programaCodigo.trim()]);
    if ((prog[0] as any[]).length === 0) throw new ValidationError(`Programa no encontrado: "${programaCodigo}"`);

    const { filas, nuevos, errores, grupos, asignacionesSet } = await normalizarCrudo(wb, programaCodigo.trim());
    const posibleBaja = await detectarPosibleBaja(grupos, asignacionesSet);
    // Guardar las correcciones pendientes para que queden a la mano en Reportes.
    await persistirCorrecciones(errores);
    return {
      formato,
      resumen: {
        instructores: filas.instructores.length - 1, grupos: filas.grupos.length - 1,
        asignaciones: filas.asignaciones.length - 1, horarios: filas.horarios.length - 1,
      },
      nuevos,
      errores,
      posible_baja: { asignaciones: posibleBaja },
      plantilla_base64: filasATemplateBase64(filas),
    };
  },

  async importar(
    archivoBase64: string,
    opts?: { crearAmbientes?: string[] },
  ): Promise<{ resumen: ResumenHoja[] }> {
    const wb = leerWorkbook(archivoBase64);

    // Ambientes nuevos aprobados en el preview: crearlos antes de resolver grupos/horarios.
    if (opts?.crearAmbientes?.length) await crearAmbientesAprobados(opts.crearAmbientes);

    const resumen: ResumenHoja[] = [];

    // Mapa email -> nombre (hoja Instructores) para mostrar el NOMBRE del
    // instructor en los mensajes de error, no el correo.
    const emailToNombre = new Map<string, string>();
    const wsInst = wb.Sheets['Instructores'];
    if (wsInst) {
      for (const row of XLSX.utils.sheet_to_json<any>(wsInst, { defval: null })) {
        const em = String((row as any)['email'] ?? '').trim().toLowerCase();
        const nom = String((row as any)['nombre'] ?? '').trim();
        if (em && nom) emailToNombre.set(em, nom);
      }
    }

    for (const { nombre, fn } of HOJAS) {
      const ws = wb.Sheets[nombre];
      if (!ws) continue; // hoja opcional: si no viene, se omite

      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: null });
      const r: ResumenHoja = { hoja: nombre, filas: rows.length, creados: 0, omitidos: 0, errores: [] };

      for (let i = 0; i < rows.length; i++) {
        const fila = i + 2; // fila 1 = encabezados
        // Saltar filas totalmente vacias
        if (Object.values(rows[i]).every((v) => v === null || String(v).trim() === '')) continue;
        try {
          await fn(rows[i]);
          r.creados++;
        } catch (err: any) {
          // Idempotencia: "ya existe" no es error, se cuenta como omitido.
          if (err instanceof DuplicadoError) { r.omitidos++; continue; }
          const ctx = contextoFila(nombre, rows[i], emailToNombre);
          const base = err?.message ?? 'Error desconocido';
          r.errores.push({ fila, mensaje: `${ctx ? ctx + ' — ' : ''}${base}${origenFila(rows[i])}` });
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
