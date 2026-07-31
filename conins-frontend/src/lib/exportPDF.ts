import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// ─── Paleta alineada con la UI (Tailwind + globals.css) ───
const SENA: [number, number, number] = [57, 169, 0]          // #39A900 — color principal
const GRAY_900: [number, number, number] = [17, 24, 39]      // text-gray-900
const GRAY_700: [number, number, number] = [55, 65, 81]      // text-gray-700
const GRAY_500: [number, number, number] = [107, 114, 128]   // text-gray-500
const GRAY_400: [number, number, number] = [156, 163, 175]   // text-gray-400
const GRAY_200: [number, number, number] = [229, 231, 235]   // border-gray-200
const GRAY_50: [number, number, number] = [249, 250, 251]    // bg-gray-50
const WHITE: [number, number, number] = [255, 255, 255]

const COLOR_OK: [number, number, number] = [22, 163, 74]     // text-green-600
const COLOR_WARN: [number, number, number] = [202, 138, 4]   // text-yellow-600
const COLOR_DANGER: [number, number, number] = [220, 38, 38] // text-red-600

// ─── Header — estilo limpio como la UI ───
function addHeader(doc: jsPDF, titulo: string, subtitulo?: string, orientation: "portrait" | "landscape" = "portrait") {
  const pw = orientation === "landscape" ? 297 : 210
  const m = 14

  // Línea superior sutil verde
  doc.setFillColor(...SENA)
  doc.rect(0, 0, pw, 2.5, "F")

  // Logo texto
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...GRAY_900)
  doc.text("CONINS", m, 16)

  // Institucional
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...GRAY_500)
  doc.text("Sistema de Control de Instructores — SENA CDMC", m, 22)

  // Fecha derecha
  const fecha = new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
  doc.setFontSize(8)
  doc.setTextColor(...GRAY_400)
  doc.text(fecha, pw - m, 16, { align: "right" })

  // Separador
  doc.setDrawColor(...GRAY_200)
  doc.setLineWidth(0.4)
  doc.line(m, 26, pw - m, 26)

  // Título reporte
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...GRAY_900)
  doc.text(titulo, m, 34)

  if (subtitulo) {
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...GRAY_500)
    doc.text(subtitulo, m, 40)
  }
}

function addFooter(doc: jsPDF) {
  const n = doc.getNumberOfPages()
  for (let i = 1; i <= n; i++) {
    doc.setPage(i)
    const pw = doc.internal.pageSize.getWidth()
    const ph = doc.internal.pageSize.getHeight()

    doc.setDrawColor(...GRAY_200)
    doc.setLineWidth(0.3)
    doc.line(14, ph - 12, pw - 14, ph - 12)

    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...GRAY_400)
    doc.text("CONINS — Sistema de Control de Instructores · SENA CDMC", 14, ph - 7)
    doc.text(`Página ${i} de ${n}`, pw - 14, ph - 7, { align: "right" })
  }
}

// ─── Estilos de tabla — coinciden con las tablas de la UI ───
const tableDefaults = {
  theme: "plain" as const,
  headStyles: {
    fillColor: GRAY_50 as any,
    textColor: GRAY_500 as any,
    fontSize: 8,
    fontStyle: "bold" as const,
    halign: "left" as const,
    cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
    lineColor: GRAY_200 as any,
    lineWidth: { bottom: 0.4 } as any,
  },
  bodyStyles: {
    fontSize: 8,
    textColor: GRAY_700 as any,
    cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 },
    lineColor: GRAY_200 as any,
    lineWidth: { bottom: 0.15 } as any,
  },
  alternateRowStyles: {
    fillColor: WHITE as any,
  },
  margin: { left: 14, right: 14 },
  tableLineColor: GRAY_200 as any,
  tableLineWidth: 0,
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
  const doc = new jsPDF()
  addHeader(doc, titulo, `${horarios.length} registros`)

  autoTable(doc, {
    startY: 46,
    head: [["Grupo", "Instructor", "Competencia", "Ambiente", "Jornada", "Actividad", "Días", "Horas", "Estado"]],
    body: horarios.map((h) => [
      h.ficha_numero,
      h.instructor_nombre,
      h.competencia,
      h.ambiente || "—",
      h.jornada,
      h.tipo_actividad || "—",
      h.dias.join(", "),
      h.horas,
      h.estado || "—",
    ]),
    ...tableDefaults,
    headStyles: { ...tableDefaults.headStyles, fontSize: 7, halign: "center" },
    bodyStyles: { ...tableDefaults.bodyStyles, fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 18, halign: "center" },
      1: { cellWidth: 28 },
      2: { cellWidth: 28 },
      3: { cellWidth: 18 },
      4: { cellWidth: 16, halign: "center" },
      5: { cellWidth: 20 },
      6: { cellWidth: 25 },
      7: { cellWidth: 16, halign: "center" },
      8: { cellWidth: 18, halign: "center" },
    },
    didParseCell: (d: any) => {
      if (d.column.index === 8 && d.section === "body") {
        const v = d.cell.raw
        if (v === "Aprobado") { d.cell.styles.textColor = COLOR_OK; d.cell.styles.fontStyle = "bold" }
        else if (v === "Pendiente") d.cell.styles.textColor = COLOR_WARN
        else if (v === "Rechazado") d.cell.styles.textColor = COLOR_DANGER
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
  const totalHoras = data.reduce((s, c) => s + Number(c.total_horas || 0), 0)
  const sobrecarga = data.filter((c) => c.estado === "Sobrecarga").length
  addHeader(doc, "Carga Horaria de Instructores", `${data.length} instructores · ${Math.round(totalHoras)}h totales · ${sobrecarga} en sobrecarga`)

  autoTable(doc, {
    startY: 46,
    head: [["Instructor", "Horas semanales", "Grupos", "Competencias", "Estado"]],
    body: data.map((c) => [c.instructor_nombre, `${Math.round(Number(c.total_horas || 0))}h`, String(c.fichas_count), String(c.competencias_count), c.estado]),
    ...tableDefaults,
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30, halign: "center" },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 30, halign: "center" },
      4: { cellWidth: 30, halign: "center" },
    },
    didParseCell: (d: any) => {
      if (d.column.index === 4 && d.section === "body") {
        const v = d.cell.raw
        if (v === "Sobrecarga") { d.cell.styles.textColor = COLOR_DANGER; d.cell.styles.fontStyle = "bold" }
        else if (v === "Bajo carga") d.cell.styles.textColor = COLOR_WARN
        else d.cell.styles.textColor = COLOR_OK
      }
    },
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
  addHeader(doc, "Horario Semanal por Grupo", `${data.length} grupos`, "landscape")

  autoTable(doc, {
    startY: 46,
    head: [["Grupo", "Programa", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]],
    body: data.map((h) => [h.ficha_numero, h.programa, h.lunes || "—", h.martes || "—", h.miercoles || "—", h.jueves || "—", h.viernes || "—", h.sabado || "—"]),
    ...tableDefaults,
    headStyles: { ...tableDefaults.headStyles, halign: "center" },
    bodyStyles: { ...tableDefaults.bodyStyles, halign: "center" },
    columnStyles: {
      0: { cellWidth: 25, fontStyle: "bold", halign: "left" },
      1: { cellWidth: 45, halign: "left" },
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
  const prom = data.length ? Math.round(data.reduce((s, o) => s + (o.porcentaje ?? 0), 0) / data.length) : 0
  addHeader(doc, "Ocupación de Ambientes", `${data.length} ambientes · Ocupación promedio: ${prom}%`)

  autoTable(doc, {
    startY: 46,
    head: [["Ambiente", "Tipo", "Capacidad", "Horas", "Ocupación"]],
    body: data.map((o) => [o.ambiente_nombre || "—", o.tipo || "—", o.capacidad != null ? String(o.capacidad) : "—", `${o.horas_ocupadas ?? 0}h / ${o.horas_totales ?? 0}h`, `${o.porcentaje ?? 0}%`]),
    ...tableDefaults,
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 30, halign: "center" },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 40, halign: "center" },
      4: { cellWidth: 30, halign: "center" },
    },
    didParseCell: (d: any) => {
      if (d.column.index === 4 && d.section === "body") {
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
  addHeader(doc, "Listado de Instructores", `${data.length} instructores · ${activos} activos`)

  autoTable(doc, {
    startY: 46,
    head: [["Nombre", "Correo electrónico", "Área", "Horas/sem", "Estado"]],
    body: data.map((i) => [
      i.nombre,
      i.email,
      i.tipo_area?.charAt(0).toUpperCase() + i.tipo_area?.slice(1) || "—",
      i.horas_semana != null ? `${i.horas_semana}h` : "—",
      i.activo ? "Activo" : "Inactivo",
    ]),
    ...tableDefaults,
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 55 },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 22, halign: "center" },
      4: { cellWidth: 22, halign: "center" },
    },
    didParseCell: (d: any) => {
      if (d.column.index === 4 && d.section === "body") {
        d.cell.styles.textColor = d.cell.raw === "Activo" ? COLOR_OK : COLOR_DANGER
        d.cell.styles.fontStyle = "bold"
      }
    },
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
  addHeader(doc, "Listado de Grupos", `${data.length} grupos`)

  autoTable(doc, {
    startY: 46,
    head: [["No. Grupo", "Programa", "Jornada", "Etapa", "Instructores", "Estado"]],
    body: data.map((g) => [
      g.numero_ficha,
      g.programa,
      g.jornada,
      g.etapa?.charAt(0).toUpperCase() + g.etapa?.slice(1) || "—",
      String(g.instructores_count),
      g.activo ? "Activo" : "Inactivo",
    ]),
    ...tableDefaults,
    columnStyles: {
      0: { cellWidth: 22, halign: "center", fontStyle: "bold" },
      1: { cellWidth: 55 },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 22, halign: "center" },
      4: { cellWidth: 22, halign: "center" },
      5: { cellWidth: 22, halign: "center" },
    },
    didParseCell: (d: any) => {
      if (d.column.index === 5 && d.section === "body") {
        d.cell.styles.textColor = d.cell.raw === "Activo" ? COLOR_OK : COLOR_DANGER
        d.cell.styles.fontStyle = "bold"
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
  addHeader(doc, "Listado de Ambientes", `${data.length} ambientes`)

  autoTable(doc, {
    startY: 46,
    head: [["Nombre", "Tipo", "Capacidad", "Área", "Estado"]],
    body: data.map((a) => [
      a.nombre,
      a.tipo?.charAt(0).toUpperCase() + a.tipo?.slice(1) || "—",
      String(a.capacidad),
      a.area || "Sin asignar",
      a.activo ? "Activo" : "Inactivo",
    ]),
    ...tableDefaults,
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 30, halign: "center" },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 35, halign: "center" },
      4: { cellWidth: 22, halign: "center" },
    },
    didParseCell: (d: any) => {
      if (d.column.index === 4 && d.section === "body") {
        d.cell.styles.textColor = d.cell.raw === "Activo" ? COLOR_OK : COLOR_DANGER
        d.cell.styles.fontStyle = "bold"
      }
    },
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
  addHeader(doc, `Asignaciones ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`, `${data.length} asignaciones`)

  autoTable(doc, {
    startY: 46,
    head: [["Instructor", "Grupo", "Competencia", "Ambiente", "Jornada", "Líder"]],
    body: data.map((a) => [
      a.instructor_nombre,
      a.ficha_numero,
      a.competencia,
      a.ambiente || "—",
      a.jornada || "—",
      a.es_lider ? "Sí" : "No",
    ]),
    ...tableDefaults,
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 22, halign: "center" },
      2: { cellWidth: 40 },
      3: { cellWidth: 28 },
      4: { cellWidth: 22, halign: "center" },
      5: { cellWidth: 16, halign: "center" },
    },
    didParseCell: (d: any) => {
      if (d.column.index === 5 && d.section === "body" && d.cell.raw === "Sí") {
        d.cell.styles.textColor = SENA
        d.cell.styles.fontStyle = "bold"
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

// ═════════════════════════════════════════════════
// REPORTES INDIVIDUALES
// ═════════════════════════════════════════════════

// ─── Sección de info (key-value pairs) ───
function addInfoSection(doc: jsPDF, items: { label: string; value: string }[], startY: number): number {
  let y = startY
  const m = 14
  for (const item of items) {
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...GRAY_500)
    doc.text(item.label + ":", m, y)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...GRAY_900)
    doc.text(item.value || "—", m + 40, y)
    y += 6
  }
  return y + 4
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...GRAY_900)
  doc.text(title, 14, y)
  doc.setDrawColor(...SENA)
  doc.setLineWidth(0.5)
  doc.line(14, y + 2, 60, y + 2)
  return y + 8
}

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
  addHeader(doc, `Reporte — ${instructor.nombre}`, `Instructor · Generado el ${new Date().toLocaleDateString("es-CO")}`)

  let y = addInfoSection(doc, [
    { label: "Nombre", value: instructor.nombre },
    { label: "Correo", value: instructor.email },
    { label: "Área", value: instructor.tipo_area?.charAt(0).toUpperCase() + instructor.tipo_area?.slice(1) || "—" },
    { label: "Horas/semana", value: instructor.horas_semana != null ? `${instructor.horas_semana}h` : "—" },
    { label: "Estado", value: instructor.activo ? "Activo" : "Inactivo" },
  ], 46)

  // Asignaciones
  y = addSectionTitle(doc, `Asignaciones (${asignaciones.length})`, y)

  if (asignaciones.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Grupo", "Competencia", "Jornada", "Ambiente", "Líder"]],
      body: asignaciones.map((a) => [
        a.ficha_numero,
        a.competencia,
        a.jornada || "—",
        a.ambiente || "—",
        a.es_lider ? "Sí" : "No",
      ]),
      ...tableDefaults,
      columnStyles: {
        0: { cellWidth: 22, halign: "center" },
        1: { cellWidth: 55 },
        2: { cellWidth: 25, halign: "center" },
        3: { cellWidth: 35 },
        4: { cellWidth: 16, halign: "center" },
      },
    })
    y = (doc as any).lastAutoTable.finalY + 10
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
      bodyStyles: { ...tableDefaults.bodyStyles, fontSize: 7 },
      headStyles: { ...tableDefaults.headStyles, fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 20, halign: "center" },
        1: { cellWidth: 45 },
        2: { cellWidth: 30 },
        3: { cellWidth: 22, halign: "center" },
        4: { cellWidth: 30 },
        5: { cellWidth: 20, halign: "center" },
      },
      didParseCell: (d: any) => {
        if (d.column.index === 5 && d.section === "body") {
          const v = d.cell.raw
          if (v === "Aprobado") { d.cell.styles.textColor = COLOR_OK; d.cell.styles.fontStyle = "bold" }
          else if (v === "Pendiente") d.cell.styles.textColor = COLOR_WARN
          else if (v === "Rechazado") d.cell.styles.textColor = COLOR_DANGER
        }
      },
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
  addHeader(doc, `Reporte — Grupo ${ficha.numero_ficha}`, `${ficha.programa} · Generado el ${new Date().toLocaleDateString("es-CO")}`)

  let y = addInfoSection(doc, [
    { label: "No. Grupo", value: ficha.numero_ficha },
    { label: "Programa", value: ficha.programa },
    { label: "Jornada", value: ficha.jornada },
    { label: "Etapa", value: ficha.etapa?.charAt(0).toUpperCase() + ficha.etapa?.slice(1) || "—" },
    { label: "Modalidad", value: ficha.modalidad || "—" },
    { label: "Estado", value: ficha.activo ? "Activo" : "Inactivo" },
  ], 46)

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
        0: { cellWidth: 55 },
        1: { cellWidth: 80 },
        2: { cellWidth: 16, halign: "center" },
      },
    })
    y = (doc as any).lastAutoTable.finalY + 10
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
        h.ficha_numero, // reused as instructor name in this context
        h.competencia,
        h.dias.join(", "),
        h.horas,
        h.ambiente || "—",
        h.estado || "—",
      ]),
      ...tableDefaults,
      bodyStyles: { ...tableDefaults.bodyStyles, fontSize: 7 },
      headStyles: { ...tableDefaults.headStyles, fontSize: 7 },
      didParseCell: (d: any) => {
        if (d.column.index === 5 && d.section === "body") {
          const v = d.cell.raw
          if (v === "Aprobado") { d.cell.styles.textColor = COLOR_OK; d.cell.styles.fontStyle = "bold" }
          else if (v === "Pendiente") d.cell.styles.textColor = COLOR_WARN
          else if (v === "Rechazado") d.cell.styles.textColor = COLOR_DANGER
        }
      },
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
  addHeader(doc, `Reporte — ${ambiente.nombre}`, `Ambiente · Generado el ${new Date().toLocaleDateString("es-CO")}`)

  let y = addInfoSection(doc, [
    { label: "Nombre", value: ambiente.nombre },
    { label: "Tipo", value: ambiente.tipo },
    { label: "Capacidad", value: ambiente.capacidad ? `${ambiente.capacidad} personas` : "—" },
    { label: "Estado", value: ambiente.activo ? "Activo" : "Inactivo" },
  ], 46)

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
      bodyStyles: { ...tableDefaults.bodyStyles, fontSize: 7 },
      headStyles: { ...tableDefaults.headStyles, fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 20, halign: "center" },
        2: { cellWidth: 40 },
        3: { cellWidth: 30 },
        4: { cellWidth: 22, halign: "center" },
        5: { cellWidth: 20, halign: "center" },
      },
      didParseCell: (d: any) => {
        if (d.column.index === 5 && d.section === "body") {
          const v = d.cell.raw
          if (v === "Aprobado") { d.cell.styles.textColor = COLOR_OK; d.cell.styles.fontStyle = "bold" }
          else if (v === "Pendiente") d.cell.styles.textColor = COLOR_WARN
          else if (v === "Rechazado") d.cell.styles.textColor = COLOR_DANGER
        }
      },
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
  addHeader(doc, `Reporte de Horario`, `${horario.instructor_nombre} — Grupo ${horario.ficha_numero}`)

  addInfoSection(doc, [
    { label: "Instructor", value: horario.instructor_nombre },
    { label: "Grupo", value: horario.ficha_numero },
    { label: "Competencia", value: horario.competencia },
    { label: "RAP", value: horario.rap_codigo ? `${horario.rap_codigo} — ${horario.rap_descripcion || ""}` : "—" },
    { label: "Ambiente", value: horario.ambiente || "—" },
    { label: "Jornada", value: horario.jornada },
    { label: "Tipo actividad", value: horario.tipo_actividad || "—" },
    { label: "Días", value: horario.dias.join(", ") },
    { label: "Horas", value: horario.horas },
    { label: "Estado", value: horario.estado },
  ], 46)

  addFooter(doc)
  doc.save(`horario-${horario.ficha_numero}-${horario.instructor_nombre.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`)
}

export function exportarUsuariosPDF(data: UsuarioExport[]) {
  const doc = new jsPDF()
  addHeader(doc, "Listado de Usuarios", `${data.length} usuarios`)

  autoTable(doc, {
    startY: 46,
    head: [["Nombre", "Correo electrónico", "Rol", "Estado"]],
    body: data.map((u) => [
      u.nombre,
      u.email,
      u.rol,
      u.activo ? "Activo" : "Inactivo",
    ]),
    ...tableDefaults,
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 55 },
      2: { cellWidth: 35, halign: "center" },
      3: { cellWidth: 22, halign: "center" },
    },
    didParseCell: (d: any) => {
      if (d.column.index === 3 && d.section === "body") {
        d.cell.styles.textColor = d.cell.raw === "Activo" ? COLOR_OK : COLOR_DANGER
        d.cell.styles.fontStyle = "bold"
      }
    },
  })

  addFooter(doc)
  doc.save(`usuarios-${new Date().toISOString().split("T")[0]}.pdf`)
}
