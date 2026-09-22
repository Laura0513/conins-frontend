import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { formatJornada } from "@/lib/terminology"

// ═══════════════════════════════════════════════════════════
//  CONINS — Exportación PDF · Diseño profesional v2
// ═══════════════════════════════════════════════════════════

// ─── Paleta de colores ───
const SENA: [number, number, number] = [57, 169, 0]
const SENA_DARK: [number, number, number] = [40, 120, 0]
const SENA_LIGHT: [number, number, number] = [230, 247, 220]

const GRAY_900: [number, number, number] = [17, 24, 39]
const GRAY_700: [number, number, number] = [55, 65, 81]
const GRAY_500: [number, number, number] = [107, 114, 128]
const GRAY_400: [number, number, number] = [156, 163, 175]
const GRAY_200: [number, number, number] = [229, 231, 235]
const GRAY_100: [number, number, number] = [243, 244, 246]
const GRAY_50: [number, number, number] = [249, 250, 251]
const WHITE: [number, number, number] = [255, 255, 255]

const COLOR_OK: [number, number, number] = [22, 163, 74]
const COLOR_WARN: [number, number, number] = [202, 138, 4]
const COLOR_DANGER: [number, number, number] = [220, 38, 38]

// Colores de jornada (para badges en tablas)
const JORNADA_COLORS: Record<string, { bg: [number, number, number]; text: [number, number, number] }> = {
  "Mañana": { bg: [220, 252, 231], text: [22, 101, 52] },
  "Tarde":  { bg: [219, 234, 254], text: [30, 64, 175] },
  "Mixta":  { bg: [219, 234, 254], text: [30, 64, 175] },
  "Noche":  { bg: [243, 232, 255], text: [88, 28, 135] },
}

// ─── Header profesional ───
function addHeader(doc: jsPDF, titulo: string, subtitulo?: string, orientation: "portrait" | "landscape" = "portrait") {
  const pw = orientation === "landscape" ? 297 : 210
  const m = 14

  // Barra superior verde con gradiente simulado
  doc.setFillColor(...SENA)
  doc.rect(0, 0, pw, 3, "F")
  doc.setFillColor(...SENA_DARK)
  doc.rect(0, 0, pw * 0.3, 3, "F")

  // Fondo del header
  doc.setFillColor(252, 253, 252)
  doc.rect(0, 3, pw, 32, "F")

  // Logo texto CONINS
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...SENA)
  doc.text("CONINS", m, 18)

  // Subtítulo institucional
  doc.setFontSize(7.5)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...GRAY_500)
  doc.text("Control de Instructores — SENA Centro de Diseño y Metrología", m, 24)

  // Fecha y hora a la derecha
  const ahora = new Date()
  const fecha = ahora.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
  const hora = ahora.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
  doc.setFontSize(7.5)
  doc.setTextColor(...GRAY_400)
  doc.text(fecha, pw - m, 16, { align: "right" })
  doc.text(hora, pw - m, 21, { align: "right" })

  // Línea separadora
  doc.setDrawColor(...GRAY_200)
  doc.setLineWidth(0.5)
  doc.line(0, 35, pw, 35)

  // Título del reporte
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...GRAY_900)
  doc.text(titulo, m, 45)

  if (subtitulo) {
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...GRAY_500)
    doc.text(subtitulo, m, 51)
  }
}

// ─── Footer profesional ───
function addFooter(doc: jsPDF) {
  const n = doc.getNumberOfPages()
  for (let i = 1; i <= n; i++) {
    doc.setPage(i)
    const pw = doc.internal.pageSize.getWidth()
    const ph = doc.internal.pageSize.getHeight()

    // Barra inferior
    doc.setFillColor(...GRAY_50)
    doc.rect(0, ph - 14, pw, 14, "F")
    doc.setDrawColor(...GRAY_200)
    doc.setLineWidth(0.3)
    doc.line(0, ph - 14, pw, ph - 14)

    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...GRAY_400)
    doc.text("CONINS · Sistema de Control de Instructores · SENA CDMC", 14, ph - 5)
    doc.text(`Página ${i} de ${n}`, pw - 14, ph - 5, { align: "right" })
  }
}

// ─── Tarjetas de resumen (KPI cards) ───
function addSummaryCards(
  doc: jsPDF,
  cards: { label: string; value: string; color?: [number, number, number] }[],
  startY: number,
  orientation: "portrait" | "landscape" = "portrait"
): number {
  const pw = orientation === "landscape" ? 297 : 210
  const m = 14
  const availW = pw - m * 2
  const cardCount = Math.min(cards.length, 4)
  const gap = 4
  const cardW = (availW - gap * (cardCount - 1)) / cardCount
  const cardH = 16

  for (let i = 0; i < cardCount; i++) {
    const card = cards[i]
    const x = m + i * (cardW + gap)
    const color = card.color || SENA

    // Card background
    doc.setFillColor(...GRAY_50)
    doc.roundedRect(x, startY, cardW, cardH, 2, 2, "F")

    // Left accent bar
    doc.setFillColor(...color)
    doc.rect(x, startY + 2, 1.5, cardH - 4, "F")

    // Value
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...color)
    doc.text(card.value, x + 6, startY + 7)

    // Label
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...GRAY_500)
    doc.text(card.label, x + 6, startY + 12.5)
  }

  return startY + cardH + 6
}

// ─── Sección de info (key-value pairs con diseño mejorado) ───
function addInfoSection(doc: jsPDF, items: { label: string; value: string }[], startY: number): number {
  const m = 14
  let y = startY

  // Fondo sutil
  doc.setFillColor(...GRAY_50)
  const h = items.length * 6.5 + 6
  doc.roundedRect(m, y - 3, 182, h, 2, 2, "F")

  y += 1
  for (const item of items) {
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...GRAY_500)
    doc.text(item.label, m + 4, y)

    doc.setFont("helvetica", "normal")
    doc.setTextColor(...GRAY_900)
    const labelW = 38
    doc.text(item.value || "—", m + 4 + labelW, y)
    y += 6.5
  }

  return y + 6
}

// ─── Título de sección ───
function addSectionTitle(doc: jsPDF, title: string, y: number, pw: number = 210): number {
  const m = 14
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...GRAY_900)
  doc.text(title, m, y)

  // Línea verde debajo
  doc.setDrawColor(...SENA)
  doc.setLineWidth(0.8)
  doc.line(m, y + 2, m + 50, y + 2)

  // Línea gris extendida
  doc.setDrawColor(...GRAY_200)
  doc.setLineWidth(0.3)
  doc.line(m + 50, y + 2, pw - m, y + 2)

  return y + 9
}

// ─── Estilos de tabla mejorados ───
const tableDefaults = {
  theme: "plain" as const,
  headStyles: {
    fillColor: [240, 253, 244] as any, // green-50 tenue
    textColor: GRAY_700 as any,
    fontSize: 7.5,
    fontStyle: "bold" as const,
    halign: "left" as const,
    cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
    lineColor: GRAY_200 as any,
    lineWidth: { bottom: 0.5 } as any,
  },
  bodyStyles: {
    fontSize: 7.5,
    textColor: GRAY_700 as any,
    cellPadding: { top: 3, bottom: 3, left: 5, right: 5 },
    lineColor: GRAY_100 as any,
    lineWidth: { bottom: 0.2 } as any,
  },
  alternateRowStyles: {
    fillColor: GRAY_50 as any,
  },
  margin: { left: 14, right: 14 },
  tableLineColor: GRAY_200 as any,
  tableLineWidth: 0,
  styles: {
    overflow: "linebreak" as const,
  },
}

// ─── Badge de estado en celdas ───
function applyEstadoBadge(d: any, colIdx: number) {
  if (d.column.index === colIdx && d.section === "body") {
    const v = String(d.cell.raw || "")
    if (v === "Activo" || v === "Aprobado") {
      d.cell.styles.textColor = COLOR_OK
      d.cell.styles.fontStyle = "bold"
    } else if (v === "Inactivo" || v === "Rechazado") {
      d.cell.styles.textColor = COLOR_DANGER
      d.cell.styles.fontStyle = "bold"
    } else if (v === "Pendiente" || v === "Bajo carga") {
      d.cell.styles.textColor = COLOR_WARN
    } else if (v === "Sobrecarga") {
      d.cell.styles.textColor = COLOR_DANGER
      d.cell.styles.fontStyle = "bold"
    }
  }
}

// ═════════════════════════════════════════════════
// 1. Malla de Horarios
// ═════════════════════════════════════════════════
type Horario = {
  ficha_numero: string
  instructor_nombre: string
  competencia: string
  ambiente: string
  jornada: string
  tipo_actividad?: string | null
  dias: string[]
  horas: string
  estado?: string
}

export function exportarHorariosPDF(horarios: Horario[], titulo: string = "Malla de Horarios") {
  const doc = new jsPDF("landscape")
  addHeader(doc, titulo, undefined, "landscape")

  // Estadísticas rápidas
  const instructoresUnicos = new Set(horarios.map(h => h.instructor_nombre)).size
  const gruposUnicos = new Set(horarios.map(h => h.ficha_numero)).size
  const ambientesUnicos = new Set(horarios.filter(h => h.ambiente).map(h => h.ambiente)).size

  const y = addSummaryCards(doc, [
    { label: "Horarios", value: String(horarios.length), color: SENA },
    { label: "Instructores", value: String(instructoresUnicos), color: [59, 130, 246] },
    { label: "Grupos", value: String(gruposUnicos), color: [139, 92, 246] },
    { label: "Ambientes", value: String(ambientesUnicos), color: [245, 158, 11] },
  ], 55, "landscape")

  autoTable(doc, {
    startY: y,
    head: [["Grupo", "Instructor", "Competencia", "Ambiente", "Jornada", "Días", "Horas"]],
    body: horarios.map((h) => [
      h.ficha_numero,
      h.instructor_nombre,
      h.competencia,
      h.ambiente || "—",
      formatJornada(h.jornada),
      h.dias.join(", "),
      h.horas,
    ]),
    ...tableDefaults,
    columnStyles: {
      0: { cellWidth: 24, halign: "center", fontStyle: "bold" },
      1: { cellWidth: 42 },
      2: { cellWidth: 58 },
      3: { cellWidth: 34 },
      4: { cellWidth: 22, halign: "center" },
      5: { cellWidth: 38, halign: "center" },
      6: { cellWidth: 24, halign: "center" },
    },
    didParseCell: (d: any) => {
      // Color de jornada
      if (d.column.index === 4 && d.section === "body") {
        const j = JORNADA_COLORS[String(d.cell.raw)]
        if (j) {
          d.cell.styles.fillColor = j.bg
          d.cell.styles.textColor = j.text
          d.cell.styles.fontStyle = "bold"
        }
      }
    },
  })

  addFooter(doc)
  doc.save(`malla-horarios-${new Date().toISOString().split("T")[0]}.pdf`)
}

// ═════════════════════════════════════════════════
// 2. Carga Horaria
// ═════════════════════════════════════════════════
type CargaHoraria = {
  instructor_id: number
  instructor_nombre: string
  total_horas: number
  fichas_count: number
  competencias_count: number
  estado: string
}

export function exportarCargaHorariaPDF(data: CargaHoraria[]) {
  const doc = new jsPDF()
  addHeader(doc, "Carga Horaria de Instructores")

  const totalHoras = data.reduce((s, c) => s + Number(c.total_horas || 0), 0)
  const sobrecarga = data.filter((c) => c.estado === "Sobrecarga").length
  const bajoCarga = data.filter((c) => c.estado === "Bajo carga").length

  const y = addSummaryCards(doc, [
    { label: "Instructores", value: String(data.length), color: SENA },
    { label: "Horas totales", value: `${Math.round(totalHoras)}h`, color: [59, 130, 246] },
    { label: "Sobrecarga", value: String(sobrecarga), color: COLOR_DANGER },
    { label: "Bajo carga", value: String(bajoCarga), color: COLOR_WARN },
  ], 55)

  autoTable(doc, {
    startY: y,
    head: [["Instructor", "Horas semanales", "Grupos", "Competencias", "Estado"]],
    body: data.map((c) => [
      c.instructor_nombre,
      `${Math.round(Number(c.total_horas || 0))}h`,
      String(c.fichas_count),
      String(c.competencias_count),
      c.estado,
    ]),
    ...tableDefaults,
    columnStyles: {
      0: { cellWidth: 58 },
      1: { cellWidth: 28, halign: "center" },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 28, halign: "center" },
      4: { cellWidth: 28, halign: "center" },
    },
    didParseCell: (d: any) => applyEstadoBadge(d, 4),
  })

  addFooter(doc)
  doc.save(`carga-horaria-${new Date().toISOString().split("T")[0]}.pdf`)
}

// ═════════════════════════════════════════════════
// 3. Horario por Grupo
// ═════════════════════════════════════════════════
type HorarioFicha = {
  ficha_numero: string
  programa: string
  lunes: string | null
  martes: string | null
  miercoles: string | null
  jueves: string | null
  viernes: string | null
  sabado: string | null
}

export function exportarHorarioFichaPDF(data: HorarioFicha[]) {
  const doc = new jsPDF("landscape")
  addHeader(doc, "Horario Semanal por Grupo", `${data.length} grupos registrados`, "landscape")

  const y = 57

  autoTable(doc, {
    startY: y,
    head: [["Grupo", "Programa", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]],
    body: data.map((h) => [
      h.ficha_numero,
      h.programa,
      h.lunes || "—",
      h.martes || "—",
      h.miercoles || "—",
      h.jueves || "—",
      h.viernes || "—",
      h.sabado || "—",
    ]),
    ...tableDefaults,
    headStyles: { ...tableDefaults.headStyles, halign: "center" },
    bodyStyles: { ...tableDefaults.bodyStyles, halign: "center", fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 24, fontStyle: "bold", halign: "center" },
      1: { cellWidth: 40, halign: "left" },
      2: { cellWidth: 32 },
      3: { cellWidth: 32 },
      4: { cellWidth: 32 },
      5: { cellWidth: 32 },
      6: { cellWidth: 32 },
      7: { cellWidth: 32 },
    },
  })

  addFooter(doc)
  doc.save(`horario-por-grupo-${new Date().toISOString().split("T")[0]}.pdf`)
}

// ═════════════════════════════════════════════════
// 4. Ocupación de Ambientes
// ═════════════════════════════════════════════════
type OcupacionAmbiente = {
  ambiente_nombre: string
  tipo: string
  capacidad: number
  horas_ocupadas: number
  horas_totales: number
  porcentaje: number
}

export function exportarOcupacionPDF(data: OcupacionAmbiente[]) {
  const doc = new jsPDF()
  addHeader(doc, "Ocupación de Ambientes")

  const ocupados = data.filter((o) => (o.porcentaje ?? 0) > 0)
  const prom = ocupados.length ? Math.round(ocupados.reduce((s, o) => s + (o.porcentaje ?? 0), 0) / ocupados.length) : 0
  const criticos = data.filter(o => (o.porcentaje ?? 0) > 80).length

  const y = addSummaryCards(doc, [
    { label: "Total ambientes", value: String(data.length), color: SENA },
    { label: "En uso", value: String(ocupados.length), color: [59, 130, 246] },
    { label: "Ocupación promedio", value: `${prom}%`, color: prom > 70 ? COLOR_WARN : SENA },
    { label: "Críticos (>80%)", value: String(criticos), color: COLOR_DANGER },
  ], 55)

  autoTable(doc, {
    startY: y,
    head: [["Ambiente", "Tipo", "Capacidad", "Horas ocupadas", "Horas disponibles", "Ocupación"]],
    body: data.map((o) => [
      o.ambiente_nombre || "—",
      o.tipo || "—",
      o.capacidad != null ? String(o.capacidad) : "—",
      `${Math.round(Number(o.horas_ocupadas) || 0)}h`,
      `${Math.round(Number(o.horas_totales) || 0)}h`,
      `${Math.round(Number(o.porcentaje) || 0)}%`,
    ]),
    ...tableDefaults,
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 28, halign: "center" },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 28, halign: "center" },
      4: { cellWidth: 28, halign: "center" },
      5: { cellWidth: 22, halign: "center" },
    },
    didParseCell: (d: any) => {
      if (d.column.index === 5 && d.section === "body") {
        const v = parseInt(d.cell.raw)
        if (v > 80) { d.cell.styles.textColor = COLOR_DANGER; d.cell.styles.fontStyle = "bold" }
        else if (v > 50) d.cell.styles.textColor = COLOR_WARN
        else d.cell.styles.textColor = COLOR_OK
      }
    },
  })

  addFooter(doc)
  doc.save(`ocupacion-ambientes-${new Date().toISOString().split("T")[0]}.pdf`)
}

// ═════════════════════════════════════════════════
// 5. Instructores
// ═════════════════════════════════════════════════
type InstructorExport = {
  nombre: string
  email: string
  tipo_area: string
  horas_semana?: number
  activo: boolean
}

export function exportarInstructoresPDF(data: InstructorExport[]) {
  const doc = new jsPDF()
  const activos = data.filter((i) => i.activo).length
  addHeader(doc, "Listado de Instructores")

  const y = addSummaryCards(doc, [
    { label: "Total instructores", value: String(data.length), color: SENA },
    { label: "Activos", value: String(activos), color: COLOR_OK },
    { label: "Inactivos", value: String(data.length - activos), color: COLOR_DANGER },
  ], 55)

  autoTable(doc, {
    startY: y,
    head: [["#", "Nombre", "Correo electrónico", "Área", "Horas/sem", "Estado"]],
    body: data.map((i, idx) => [
      String(idx + 1),
      i.nombre,
      i.email,
      i.tipo_area?.charAt(0).toUpperCase() + i.tipo_area?.slice(1) || "—",
      i.horas_semana != null ? `${i.horas_semana}h` : "—",
      i.activo ? "Activo" : "Inactivo",
    ]),
    ...tableDefaults,
    columnStyles: {
      0: { cellWidth: 10, halign: "center", textColor: GRAY_400 },
      1: { cellWidth: 45, fontStyle: "bold" },
      2: { cellWidth: 50 },
      3: { cellWidth: 25, halign: "center" },
      4: { cellWidth: 20, halign: "center" },
      5: { cellWidth: 20, halign: "center" },
    },
    didParseCell: (d: any) => applyEstadoBadge(d, 5),
  })

  addFooter(doc)
  doc.save(`instructores-${new Date().toISOString().split("T")[0]}.pdf`)
}

// ═════════════════════════════════════════════════
// 6. Grupos (Fichas)
// ═════════════════════════════════════════════════
type GrupoExport = {
  numero_ficha: string
  programa: string
  jornada: string
  etapa: string
  instructores_count: number
  activo: boolean
}

export function exportarGruposPDF(data: GrupoExport[]) {
  const doc = new jsPDF()
  const activos = data.filter((g) => g.activo).length
  addHeader(doc, "Listado de Grupos")

  const y = addSummaryCards(doc, [
    { label: "Total grupos", value: String(data.length), color: SENA },
    { label: "Activos", value: String(activos), color: COLOR_OK },
    { label: "Inactivos", value: String(data.length - activos), color: COLOR_DANGER },
  ], 55)

  autoTable(doc, {
    startY: y,
    head: [["#", "No. Grupo", "Programa", "Jornada", "Etapa", "Instructores", "Estado"]],
    body: data.map((g, idx) => [
      String(idx + 1),
      g.numero_ficha,
      g.programa,
      formatJornada(g.jornada),
      g.etapa?.charAt(0).toUpperCase() + g.etapa?.slice(1) || "—",
      String(g.instructores_count),
      g.activo ? "Activo" : "Inactivo",
    ]),
    ...tableDefaults,
    columnStyles: {
      0: { cellWidth: 10, halign: "center", textColor: GRAY_400 },
      1: { cellWidth: 22, halign: "center", fontStyle: "bold" },
      2: { cellWidth: 52 },
      3: { cellWidth: 22, halign: "center" },
      4: { cellWidth: 22, halign: "center" },
      5: { cellWidth: 20, halign: "center" },
      6: { cellWidth: 20, halign: "center" },
    },
    didParseCell: (d: any) => {
      applyEstadoBadge(d, 6)
      // Color de jornada
      if (d.column.index === 3 && d.section === "body") {
        const j = JORNADA_COLORS[String(d.cell.raw)]
        if (j) {
          d.cell.styles.fillColor = j.bg
          d.cell.styles.textColor = j.text
          d.cell.styles.fontStyle = "bold"
        }
      }
    },
  })

  addFooter(doc)
  doc.save(`grupos-${new Date().toISOString().split("T")[0]}.pdf`)
}

// ═════════════════════════════════════════════════
// 7. Ambientes
// ═════════════════════════════════════════════════
type AmbienteExport = {
  nombre: string
  tipo: string
  capacidad: number
  area?: string
  activo: boolean
}

export function exportarAmbientesPDF(data: AmbienteExport[]) {
  const doc = new jsPDF()
  const activos = data.filter((a) => a.activo).length
  addHeader(doc, "Listado de Ambientes")

  const y = addSummaryCards(doc, [
    { label: "Total ambientes", value: String(data.length), color: SENA },
    { label: "Activos", value: String(activos), color: COLOR_OK },
    { label: "Inactivos", value: String(data.length - activos), color: COLOR_DANGER },
  ], 55)

  autoTable(doc, {
    startY: y,
    head: [["#", "Nombre", "Tipo", "Capacidad", "Área", "Estado"]],
    body: data.map((a, idx) => [
      String(idx + 1),
      a.nombre,
      a.tipo?.charAt(0).toUpperCase() + a.tipo?.slice(1) || "—",
      String(a.capacidad),
      a.area || "Sin asignar",
      a.activo ? "Activo" : "Inactivo",
    ]),
    ...tableDefaults,
    columnStyles: {
      0: { cellWidth: 10, halign: "center", textColor: GRAY_400 },
      1: { cellWidth: 42, fontStyle: "bold" },
      2: { cellWidth: 28, halign: "center" },
      3: { cellWidth: 22, halign: "center" },
      4: { cellWidth: 32, halign: "center" },
      5: { cellWidth: 20, halign: "center" },
    },
    didParseCell: (d: any) => applyEstadoBadge(d, 5),
  })

  addFooter(doc)
  doc.save(`ambientes-${new Date().toISOString().split("T")[0]}.pdf`)
}

// ═════════════════════════════════════════════════
// 8. Asignaciones
// ═════════════════════════════════════════════════
type AsignacionExport = {
  instructor_nombre: string
  ficha_numero: string
  competencia: string
  ambiente: string
  jornada: string
  es_lider: boolean
  activo: boolean
}

export function exportarAsignacionesPDF(data: AsignacionExport[], tipo: string = "activas") {
  const doc = new jsPDF()
  const tituloTipo = tipo.charAt(0).toUpperCase() + tipo.slice(1)
  addHeader(doc, `Asignaciones ${tituloTipo}`)

  const lideres = data.filter(a => a.es_lider).length

  const y = addSummaryCards(doc, [
    { label: "Total asignaciones", value: String(data.length), color: SENA },
    { label: "Líderes", value: String(lideres), color: [139, 92, 246] },
  ], 55)

  autoTable(doc, {
    startY: y,
    head: [["Instructor", "Grupo", "Competencia", "Ambiente", "Jornada", "Líder"]],
    body: data.map((a) => [
      a.instructor_nombre,
      a.ficha_numero,
      a.competencia,
      a.ambiente || "—",
      formatJornada(a.jornada || "—"),
      a.es_lider ? "Sí" : "No",
    ]),
    ...tableDefaults,
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 22, halign: "center", fontStyle: "bold" },
      2: { cellWidth: 42 },
      3: { cellWidth: 30 },
      4: { cellWidth: 22, halign: "center" },
      5: { cellWidth: 16, halign: "center" },
    },
    didParseCell: (d: any) => {
      if (d.column.index === 5 && d.section === "body" && d.cell.raw === "Sí") {
        d.cell.styles.textColor = SENA
        d.cell.styles.fontStyle = "bold"
      }
      // Color de jornada
      if (d.column.index === 4 && d.section === "body") {
        const j = JORNADA_COLORS[String(d.cell.raw)]
        if (j) {
          d.cell.styles.fillColor = j.bg
          d.cell.styles.textColor = j.text
          d.cell.styles.fontStyle = "bold"
        }
      }
    },
  })

  addFooter(doc)
  doc.save(`asignaciones-${tipo}-${new Date().toISOString().split("T")[0]}.pdf`)
}

// ═════════════════════════════════════════════════
// 9. Usuarios
// ═════════════════════════════════════════════════
type UsuarioExport = {
  nombre: string
  email: string
  rol: string
  activo: boolean
}

export function exportarUsuariosPDF(data: UsuarioExport[]) {
  const doc = new jsPDF()
  const activos = data.filter((u) => u.activo).length
  addHeader(doc, "Listado de Usuarios")

  const y = addSummaryCards(doc, [
    { label: "Total usuarios", value: String(data.length), color: SENA },
    { label: "Activos", value: String(activos), color: COLOR_OK },
    { label: "Inactivos", value: String(data.length - activos), color: COLOR_DANGER },
  ], 55)

  autoTable(doc, {
    startY: y,
    head: [["#", "Nombre", "Correo electrónico", "Rol", "Estado"]],
    body: data.map((u, idx) => [
      String(idx + 1),
      u.nombre,
      u.email,
      u.rol,
      u.activo ? "Activo" : "Inactivo",
    ]),
    ...tableDefaults,
    columnStyles: {
      0: { cellWidth: 10, halign: "center", textColor: GRAY_400 },
      1: { cellWidth: 45, fontStyle: "bold" },
      2: { cellWidth: 52 },
      3: { cellWidth: 35, halign: "center" },
      4: { cellWidth: 20, halign: "center" },
    },
    didParseCell: (d: any) => applyEstadoBadge(d, 4),
  })

  addFooter(doc)
  doc.save(`usuarios-${new Date().toISOString().split("T")[0]}.pdf`)
}

// ═════════════════════════════════════════════════
// REPORTES INDIVIDUALES
// ═════════════════════════════════════════════════

// ─── Instructor Individual ───
type InstructorIndividualData = {
  nombre: string
  email: string
  tipo_area: string
  horas_semana?: number
  activo: boolean
}

type AsignacionRelacionada = {
  ficha_numero: string
  competencia: string
  jornada: string
  ambiente?: string
  es_lider?: boolean
}

type HorarioRelacionado = {
  ficha_numero: string
  competencia: string
  dias: string[]
  horas: string
  ambiente?: string
  estado?: string
}

export function exportarInstructorIndividualPDF(
  instructor: InstructorIndividualData,
  asignaciones: AsignacionRelacionada[],
  horarios: HorarioRelacionado[]
) {
  const doc = new jsPDF()
  addHeader(doc, instructor.nombre, "Reporte individual de instructor")

  // Info card
  let y = addInfoSection(doc, [
    { label: "Nombre", value: instructor.nombre },
    { label: "Correo", value: instructor.email },
    { label: "Área", value: instructor.tipo_area?.charAt(0).toUpperCase() + instructor.tipo_area?.slice(1) || "—" },
    { label: "Horas/semana", value: instructor.horas_semana != null ? `${instructor.horas_semana}h` : "—" },
    { label: "Estado", value: instructor.activo ? "Activo" : "Inactivo" },
  ], 55)

  // Stats rápidos
  y = addSummaryCards(doc, [
    { label: "Asignaciones", value: String(asignaciones.length), color: SENA },
    { label: "Horarios", value: String(horarios.length), color: [59, 130, 246] },
  ], y)

  // Asignaciones
  y = addSectionTitle(doc, `Asignaciones (${asignaciones.length})`, y)

  if (asignaciones.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Grupo", "Competencia", "Jornada", "Ambiente", "Líder"]],
      body: asignaciones.map((a) => [
        a.ficha_numero,
        a.competencia,
        formatJornada(a.jornada || "—"),
        a.ambiente || "—",
        a.es_lider ? "Sí" : "No",
      ]),
      ...tableDefaults,
      columnStyles: {
        0: { cellWidth: 22, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 55 },
        2: { cellWidth: 25, halign: "center" },
        3: { cellWidth: 35 },
        4: { cellWidth: 16, halign: "center" },
      },
      didParseCell: (d: any) => {
        if (d.column.index === 4 && d.section === "body" && d.cell.raw === "Sí") {
          d.cell.styles.textColor = SENA
          d.cell.styles.fontStyle = "bold"
        }
        if (d.column.index === 2 && d.section === "body") {
          const j = JORNADA_COLORS[String(d.cell.raw)]
          if (j) {
            d.cell.styles.fillColor = j.bg
            d.cell.styles.textColor = j.text
            d.cell.styles.fontStyle = "bold"
          }
        }
      },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  } else {
    doc.setFontSize(8)
    doc.setTextColor(...GRAY_400)
    doc.text("Sin asignaciones activas", 14, y + 2)
    y += 12
  }

  // Horarios
  y = addSectionTitle(doc, `Horarios (${horarios.length})`, y)

  if (horarios.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Grupo", "Competencia", "Días", "Horas", "Ambiente", "Estado"]],
      body: horarios.map((h) => [
        h.ficha_numero,
        h.competencia,
        h.dias.join(", "),
        h.horas,
        h.ambiente || "—",
        h.estado || "—",
      ]),
      ...tableDefaults,
      columnStyles: {
        0: { cellWidth: 22, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 48 },
        2: { cellWidth: 32 },
        3: { cellWidth: 22, halign: "center" },
        4: { cellWidth: 30 },
        5: { cellWidth: 20, halign: "center" },
      },
      didParseCell: (d: any) => applyEstadoBadge(d, 5),
    })
  } else {
    doc.setFontSize(8)
    doc.setTextColor(...GRAY_400)
    doc.text("Sin horarios registrados", 14, y + 2)
  }

  addFooter(doc)
  const nombre = instructor.nombre.replace(/\s+/g, "-").toLowerCase()
  doc.save(`instructor-${nombre}-${new Date().toISOString().split("T")[0]}.pdf`)
}

// ─── Ficha/Grupo Individual ───
type FichaIndividualData = {
  numero_ficha: string
  programa: string
  jornada: string
  etapa: string
  modalidad?: string
  activo: boolean
}

type InstructorRelacionado = {
  instructor_nombre: string
  competencia: string
  es_lider?: boolean
}

export function exportarFichaIndividualPDF(
  ficha: FichaIndividualData,
  instructores: InstructorRelacionado[],
  horarios: HorarioRelacionado[]
) {
  const doc = new jsPDF()
  addHeader(doc, `Grupo ${ficha.numero_ficha}`, ficha.programa)

  let y = addInfoSection(doc, [
    { label: "No. Grupo", value: ficha.numero_ficha },
    { label: "Programa", value: ficha.programa },
    { label: "Jornada", value: formatJornada(ficha.jornada) },
    { label: "Etapa", value: ficha.etapa?.charAt(0).toUpperCase() + ficha.etapa?.slice(1) || "—" },
    { label: "Modalidad", value: ficha.modalidad || "—" },
    { label: "Estado", value: ficha.activo ? "Activo" : "Inactivo" },
  ], 55)

  y = addSummaryCards(doc, [
    { label: "Instructores", value: String(instructores.length), color: SENA },
    { label: "Horarios", value: String(horarios.length), color: [59, 130, 246] },
  ], y)

  // Instructores asignados
  y = addSectionTitle(doc, `Instructores asignados (${instructores.length})`, y)

  if (instructores.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Instructor", "Competencia", "Líder"]],
      body: instructores.map((i) => [
        i.instructor_nombre,
        i.competencia,
        i.es_lider ? "Sí" : "No",
      ]),
      ...tableDefaults,
      columnStyles: {
        0: { cellWidth: 55, fontStyle: "bold" },
        1: { cellWidth: 80 },
        2: { cellWidth: 16, halign: "center" },
      },
      didParseCell: (d: any) => {
        if (d.column.index === 2 && d.section === "body" && d.cell.raw === "Sí") {
          d.cell.styles.textColor = SENA
          d.cell.styles.fontStyle = "bold"
        }
      },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  } else {
    doc.setFontSize(8)
    doc.setTextColor(...GRAY_400)
    doc.text("Sin instructores asignados", 14, y + 2)
    y += 12
  }

  // Horarios
  y = addSectionTitle(doc, `Horarios (${horarios.length})`, y)

  if (horarios.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Instructor", "Competencia", "Días", "Horas", "Ambiente", "Estado"]],
      body: horarios.map((h) => [
        h.ficha_numero,
        h.competencia,
        h.dias.join(", "),
        h.horas,
        h.ambiente || "—",
        h.estado || "—",
      ]),
      ...tableDefaults,
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: 42 },
        2: { cellWidth: 30 },
        3: { cellWidth: 22, halign: "center" },
        4: { cellWidth: 26 },
        5: { cellWidth: 20, halign: "center" },
      },
      didParseCell: (d: any) => applyEstadoBadge(d, 5),
    })
  } else {
    doc.setFontSize(8)
    doc.setTextColor(...GRAY_400)
    doc.text("Sin horarios registrados", 14, y + 2)
  }

  addFooter(doc)
  doc.save(`grupo-${ficha.numero_ficha}-${new Date().toISOString().split("T")[0]}.pdf`)
}

// ─── Ambiente Individual ───
type AmbienteIndividualData = {
  nombre: string
  tipo: string
  capacidad: number
  activo: boolean
}

type HorarioAmbiente = {
  instructor_nombre: string
  ficha_numero: string
  competencia: string
  dias: string[]
  horas: string
  estado?: string
}

export function exportarAmbienteIndividualPDF(
  ambiente: AmbienteIndividualData,
  horarios: HorarioAmbiente[]
) {
  const doc = new jsPDF()
  addHeader(doc, ambiente.nombre, "Reporte individual de ambiente")

  let y = addInfoSection(doc, [
    { label: "Nombre", value: ambiente.nombre },
    { label: "Tipo", value: ambiente.tipo },
    { label: "Capacidad", value: ambiente.capacidad ? `${ambiente.capacidad} personas` : "—" },
    { label: "Estado", value: ambiente.activo ? "Activo" : "Inactivo" },
  ], 55)

  const instructoresUnicos = new Set(horarios.map(h => h.instructor_nombre)).size
  const gruposUnicos = new Set(horarios.map(h => h.ficha_numero)).size

  y = addSummaryCards(doc, [
    { label: "Horarios", value: String(horarios.length), color: SENA },
    { label: "Instructores", value: String(instructoresUnicos), color: [59, 130, 246] },
    { label: "Grupos", value: String(gruposUnicos), color: [139, 92, 246] },
  ], y)

  // Horarios en este ambiente
  y = addSectionTitle(doc, `Uso del ambiente (${horarios.length} horarios)`, y)

  if (horarios.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Instructor", "Grupo", "Competencia", "Días", "Horas", "Estado"]],
      body: horarios.map((h) => [
        h.instructor_nombre,
        h.ficha_numero,
        h.competencia,
        h.dias.join(", "),
        h.horas,
        h.estado || "—",
      ]),
      ...tableDefaults,
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: 22, halign: "center", fontStyle: "bold" },
        2: { cellWidth: 40 },
        3: { cellWidth: 30 },
        4: { cellWidth: 22, halign: "center" },
        5: { cellWidth: 20, halign: "center" },
      },
      didParseCell: (d: any) => applyEstadoBadge(d, 5),
    })
  } else {
    doc.setFontSize(8)
    doc.setTextColor(...GRAY_400)
    doc.text("Sin horarios registrados en este ambiente", 14, y + 2)
  }

  addFooter(doc)
  const nombre = ambiente.nombre.replace(/\s+/g, "-").toLowerCase()
  doc.save(`ambiente-${nombre}-${new Date().toISOString().split("T")[0]}.pdf`)
}

// ─── Horario Individual ───
type HorarioIndividualData = {
  ficha_numero: string
  instructor_nombre: string
  competencia: string
  ambiente: string
  jornada: string
  tipo_actividad: string | null
  dias: string[]
  horas: string
  estado: string
  rap_codigo?: string | null
  rap_descripcion?: string | null
}

export function exportarHorarioIndividualPDF(horario: HorarioIndividualData) {
  const doc = new jsPDF()
  addHeader(doc, "Detalle de Horario", `${horario.instructor_nombre} — Grupo ${horario.ficha_numero}`)

  let y = 55

  // Card principal con la info del horario
  addInfoSection(doc, [
    { label: "Instructor", value: horario.instructor_nombre },
    { label: "Grupo", value: horario.ficha_numero },
    { label: "Competencia", value: horario.competencia },
    { label: "RAP", value: horario.rap_codigo ? `${horario.rap_codigo} — ${horario.rap_descripcion || ""}` : "No asignado" },
    { label: "Ambiente", value: horario.ambiente || "Sin asignar" },
    { label: "Jornada", value: formatJornada(horario.jornada) },
    { label: "Tipo actividad", value: horario.tipo_actividad || "—" },
    { label: "Días", value: horario.dias.join(", ") },
    { label: "Horas", value: horario.horas },
    { label: "Estado", value: horario.estado },
  ], y)

  addFooter(doc)
  doc.save(`horario-${horario.ficha_numero}-${horario.instructor_nombre.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`)
}
