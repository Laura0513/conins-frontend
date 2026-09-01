import * as XLSX from 'xlsx';
import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

// ============================================================
// Normalizador del Excel del lider (P39+ — 26/08/2026)
// Convierte el formato CRUDO que entrega el lider (una hoja por
// instructor/grupo, columnas legibles, celdas con datos compuestos:
// varias fechas por celda, "Nombre - Area - Ficha", "FICHA - cod - JORNADA - DIA")
// en el template de 4 hojas que consume el importador.
//
// Resuelve contra el CATALOGO VIVO de la BD (no contra el seed):
//   competencia por nombre (fuzzy Jaccard) -> codigo
//   instructor por nombre -> email (o lo marca NUEVO con email sugerido)
//   ambiente por nombre    -> existente o NUEVO
//   jornada por texto      -> nombre canonico
//
// NO escribe nada: produce el template + la clasificacion para el preview.
// ============================================================

// --- tipos de salida ---
export interface FilaError {
  hoja: string;
  fila: number;
  entidad: string;
  valor: string;
  motivo: string;
}
export interface InstructorNuevo {
  nombre: string;
  email_sugerido: string;
  tipo_area: string;
}
export interface PreviewResultado {
  formato: 'crudo' | 'template';
  resumen: { instructores: number; grupos: number; asignaciones: number; horarios: number };
  nuevos: { ambientes: string[]; instructores: InstructorNuevo[] };
  errores: FilaError[];
  posible_baja: { asignaciones: { instructor_email: string; numero_grupo: string }[] };
  plantilla_base64: string;
}

// --- helpers de texto ---
function norm(s: unknown): string {
  return String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // sin tildes
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const JMAP: Record<string, string> = { MANANA: 'manana', 'MAÑANA': 'manana', TARDE: 'mixta', NOCHE: 'noche' };
const JHORA: Record<string, [string, string]> = {
  manana: ['06:00', '12:00'], mixta: ['12:00', '18:00'], noche: ['18:00', '22:00'],
};
// getDay JS: 0=Dom..6=Sab -> dia_semana 1=Lun..7=Dom
const DIA_ISO = (d: Date): number => (d.getDay() === 0 ? 7 : d.getDay());

function parseFicha(s: unknown): { ficha: string | null; jornada: string | null; hi: string | null; hf: string | null } {
  const t = String(s ?? '');
  const fic = t.match(/\b(\d{7})\b/);
  let jor: string | null = null;
  for (const [k, v] of Object.entries(JMAP)) {
    if (t.toUpperCase().includes(k)) { jor = v; break; }
  }
  let hi: string | null = null, hf: string | null = null;
  const hor = t.match(/(\d{1,2}:\d{2})\s*A\s*(\d{1,2}:\d{2})/i);
  if (hor) { hi = hor[1]; hf = hor[2]; }
  return { ficha: fic ? fic[1] : null, jornada: jor, hi, hf };
}

function parseFechas(cell: unknown): Date[] {
  const out: Date[] = [];
  for (const line of String(cell ?? '').split('\n')) {
    const m = line.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      const [, d, mo, y] = m;
      const dt = new Date(Number(y), Number(mo) - 1, Number(d));
      if (!isNaN(dt.getTime())) out.push(dt);
    }
  }
  return out;
}

function parseAmbiente(v: unknown): string {
  const s = String(v ?? '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  if (/^\d+$/.test(s)) return `Ambiente ${s}`;
  if (s.toLowerCase().includes('estrella')) return 'Aula Ambiental La Estrella';
  return s.split(' ').map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w)).join(' ');
}

function fechaLunes(d: Date): string {
  const l = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
  const y = l.getFullYear(), m = String(l.getMonth() + 1).padStart(2, '0'), dd = String(l.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function emailSugerido(nombre: string, usados: Set<string>): string {
  const parts = norm(nombre).split(' ').filter(Boolean);
  const inicial = parts[0]?.[0] ?? 'x';
  const apellido = parts.length > 1 ? parts[parts.length - 1] : (parts[0] ?? 'instructor');
  let base = `${inicial}${apellido}`.replace(/[^a-z0-9]/g, '');
  let email = `${base}@sena.edu.co`;
  let i = 1;
  while (usados.has(email)) { email = `${base}${i}@sena.edu.co`; i++; }
  usados.add(email);
  return email;
}

// --- catalogo vivo ---
interface Catalogo {
  competencias: { nombreNorm: string; codigo: string }[];
  instructores: Map<string, string>; // nombreNorm -> email
  ambientes: Set<string>;            // nombres existentes
  jornadas: Set<string>;             // nombres existentes (norm)
  fichas: Set<string>;               // numeros de ficha existentes
}

async function cargarCatalogo(): Promise<Catalogo> {
  const [comp] = await pool.query<RowDataPacket[]>('SELECT nombre, codigo FROM competencias WHERE activo = TRUE');
  const [inst] = await pool.query<RowDataPacket[]>(
    `SELECT u.nombre, u.email FROM instructores i JOIN usuarios u ON i.usuario_id = u.id WHERE i.activo = TRUE`,
  );
  const [amb] = await pool.query<RowDataPacket[]>('SELECT nombre FROM ambientes WHERE activo = TRUE');
  const [jor] = await pool.query<RowDataPacket[]>('SELECT nombre FROM jornadas');
  const [fic] = await pool.query<RowDataPacket[]>('SELECT numero_ficha FROM fichas WHERE activo = TRUE');
  const instMap = new Map<string, string>();
  for (const r of inst as any[]) instMap.set(norm(r.nombre), String(r.email));
  return {
    competencias: (comp as any[]).map((r) => ({ nombreNorm: norm(r.nombre), codigo: String(r.codigo) })),
    instructores: instMap,
    ambientes: new Set((amb as any[]).map((r) => String(r.nombre))),
    jornadas: new Set((jor as any[]).map((r) => norm(r.nombre))),
    fichas: new Set((fic as any[]).map((r) => String(r.numero_ficha))),
  };
}

function matchCompetencia(texto: unknown, cat: Catalogo): string | null {
  const t = new Set(norm(texto).split(' ').filter(Boolean));
  if (t.size === 0) return null;
  let best = 0, bestCod: string | null = null;
  for (const c of cat.competencias) {
    const s = new Set(c.nombreNorm.split(' ').filter(Boolean));
    if (s.size === 0) continue;
    let inter = 0;
    for (const w of t) if (s.has(w)) inter++;
    const union = t.size + s.size - inter;
    const j = union ? inter / union : 0;
    if (j > best) { best = j; bestCod = c.codigo; }
  }
  return best >= 0.35 ? bestCod : null;
}

function matchInstructorEmail(nombre: string, cat: Catalogo): string | null {
  const n = norm(nombre);
  if (cat.instructores.has(n)) return cat.instructores.get(n)!;
  const tn = new Set(n.split(' ').filter(Boolean));
  for (const [k, v] of cat.instructores) {
    const ks = new Set(k.split(' ').filter(Boolean));
    let inter = 0;
    for (const w of tn) if (ks.has(w)) inter++;
    // subconjunto en cualquier direccion con >=2 tokens en comun
    if (inter >= 2 && (inter === tn.size || inter === ks.size)) return v;
  }
  return null;
}

const TRANSV_SHEETS = new Set(['bilinguismo', 'transversales']);

// --- deteccion de formato ---
export function detectarFormato(wb: XLSX.WorkBook): 'crudo' | 'template' {
  const hojas = new Set(wb.SheetNames.map((s) => s.trim().toLowerCase()));
  const esTemplate = ['instructores', 'grupos', 'asignaciones', 'horarios'].some((h) => hojas.has(h));
  return esTemplate ? 'template' : 'crudo';
}

// --- normalizacion del crudo -> filas de template + clasificacion ---
interface FilasTemplate {
  instructores: any[][];
  grupos: any[][];
  asignaciones: any[][];
  horarios: any[][];
}

export async function normalizarCrudo(
  wb: XLSX.WorkBook,
  programaCodigo: string,
): Promise<{ filas: FilasTemplate; nuevos: PreviewResultado['nuevos']; errores: FilaError[]; grupos: Set<string>; asignacionesSet: Set<string> }> {
  const cat = await cargarCatalogo();
  const errores: FilaError[] = [];
  const emailsNuevos = new Set<string>();
  const nuevosAmbientes = new Set<string>();
  const nuevosInstructores = new Map<string, InstructorNuevo>();

  // acumuladores
  const instructoresByEmail = new Map<string, { nombre: string; tipo_area: string; comps: Set<string> }>();
  const grupos = new Map<string, { jornada: string; ambiente: string }>();
  const asignaciones = new Map<string, { email: string; ficha: string; comps: Set<string> }>();
  const horarios: any[][] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const tipoArea = TRANSV_SHEETS.has(sheetName.trim().toLowerCase()) ? 'transversal' : 'tecnica';
    const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null, blankrows: false });

    rows.forEach((r, idx) => {
      const filaNum = idx + 1;
      const inst = r[1];
      if (typeof inst !== 'string') return;
      const u = inst.trim();
      if (!u || u.toUpperCase() === 'INSTRUCTORES' || u.toUpperCase().includes('EVENTOS')) return;

      const nombre = u.split(' - ')[0].trim();
      const compTxt = r[3];
      const ambC = r[7];
      const ficC = r[8];

      const { ficha, jornada, hi, hf } = parseFicha(ficC);
      const jor = jornada;
      let horaI = hi, horaF = hf;
      if (jor && !(horaI && horaF)) { [horaI, horaF] = JHORA[jor] ?? [null, null]; }
      const cod = matchCompetencia(compTxt, cat);
      const amb = parseAmbiente(ambC);
      const fechas = parseFechas(r[5]);

      // errores duros
      if (!ficha) { errores.push({ hoja: sheetName, fila: filaNum, entidad: 'grupo', valor: String(ficC ?? ''), motivo: 'ficha no detectada' }); return; }
      if (!cod) { errores.push({ hoja: sheetName, fila: filaNum, entidad: 'competencia', valor: String(compTxt ?? '').slice(0, 60), motivo: 'competencia sin coincidencia en catalogo (Sofia Plus)' }); return; }

      // instructor: existente o NUEVO (no bloquea; se marca)
      let email = matchInstructorEmail(nombre, cat);
      if (!email) {
        const key = norm(nombre);
        if (!nuevosInstructores.has(key)) {
          email = emailSugerido(nombre, emailsNuevos);
          nuevosInstructores.set(key, { nombre, email_sugerido: email, tipo_area: tipoArea });
        } else {
          email = nuevosInstructores.get(key)!.email_sugerido;
        }
      }

      // ambiente nuevo (se marca; el import lo crea si se aprueba)
      if (amb && !cat.ambientes.has(amb)) nuevosAmbientes.add(amb);

      // acumular template
      const iAcc = instructoresByEmail.get(email) ?? { nombre, tipo_area: tipoArea, comps: new Set<string>() };
      iAcc.comps.add(cod); instructoresByEmail.set(email, iAcc);
      if (!grupos.has(ficha)) grupos.set(ficha, { jornada: jor ?? '', ambiente: amb });
      const aKey = `${email}||${ficha}`;
      const aAcc = asignaciones.get(aKey) ?? { email, ficha, comps: new Set<string>() };
      aAcc.comps.add(cod); asignaciones.set(aKey, aAcc);
      for (const d of fechas) {
        // Se arrastra hoja/fila del Excel del lider (origen_*) para que los
        // errores del import sean ubicables en el archivo original, no por el
        // numero de fila del template.
        horarios.push([email, ficha, cod, '', amb, DIA_ISO(d), horaI ?? '', horaF ?? '', jor ?? '', fechaLunes(d), sheetName, filaNum]);
      }
    });
  }

  // construir filas de template (arreglos con encabezado)
  const filas: FilasTemplate = {
    instructores: [['nombre', 'email', 'tipo_area', 'codigos_competencia']],
    grupos: [['numero_grupo', 'codigo_programa', 'jornada', 'ambiente']],
    asignaciones: [['instructor_email', 'numero_grupo', 'codigos_competencia']],
    horarios: [['instructor_email', 'numero_grupo', 'codigo_competencia', 'codigo_rap', 'ambiente', 'dia_semana', 'hora_inicio', 'hora_fin', 'jornada', 'semana', 'origen_hoja', 'origen_fila']],
  };
  for (const [email, v] of instructoresByEmail) filas.instructores.push([v.nombre, email, v.tipo_area, [...v.comps].sort().join(';')]);
  for (const [ficha, v] of grupos) filas.grupos.push([ficha, programaCodigo, v.jornada, v.ambiente]);
  for (const [, v] of asignaciones) filas.asignaciones.push([v.email, v.ficha, [...v.comps].sort().join(';')]);
  for (const h of horarios) filas.horarios.push(h);

  return {
    filas,
    nuevos: { ambientes: [...nuevosAmbientes].sort(), instructores: [...nuevosInstructores.values()] },
    errores,
    grupos: new Set(grupos.keys()),
    asignacionesSet: new Set([...asignaciones.values()].map((a) => `${a.email}||${a.ficha}`)),
  };
}

// --- serializa las filas a un .xlsx base64 (template de 4 hojas) ---
export function filasATemplateBase64(filas: FilasTemplate): string {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(filas.instructores), 'Instructores');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(filas.grupos), 'Grupos');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(filas.asignaciones), 'Asignaciones');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(filas.horarios), 'Horarios');
  return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
}

// --- posible baja: asignaciones activas del scope (grupos del archivo) que
// no aparecen en el archivo. Solo LECTURA; se muestra para que el admin decida. ---
export async function detectarPosibleBaja(
  gruposScope: Set<string>,
  asignacionesArchivo: Set<string>,
): Promise<{ instructor_email: string; numero_grupo: string }[] > {
  if (gruposScope.size === 0) return [];
  const nums = [...gruposScope];
  const placeholders = nums.map(() => '?').join(',');
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT u.email AS instructor_email, f.numero_ficha AS numero_grupo
       FROM asignacion a
       JOIN fichas f ON a.ficha_id = f.id
       JOIN instructores i ON a.instructor_id = i.id
       JOIN usuarios u ON i.usuario_id = u.id
      WHERE a.activo = TRUE AND f.numero_ficha IN (${placeholders})`,
    nums,
  );
  const baja: { instructor_email: string; numero_grupo: string }[] = [];
  for (const r of rows as any[]) {
    const key = `${String(r.instructor_email).toLowerCase()}||${r.numero_grupo}`;
    const enArchivo = [...asignacionesArchivo].some((a) => a.toLowerCase() === key);
    if (!enArchivo) baja.push({ instructor_email: r.instructor_email, numero_grupo: String(r.numero_grupo) });
  }
  return baja;
}
