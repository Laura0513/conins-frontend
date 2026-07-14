import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// ─── Colores SENA ───
const SENA_GREEN: [number, number, number] = [57, 169, 0]       // #39A900
const SENA_DARK: [number, number, number] = [30, 90, 0]         // para textos sobre fondo claro
const GRAY_800: [number, number, number] = [31, 41, 55]
const GRAY_500: [number, number, number] = [107, 114, 128]
const GRAY_400: [number, number, number] = [156, 163, 175]
const WHITE: [number, number, number] = [255, 255, 255]
const ROW_ALT: [number, number, number] = [248, 250, 248]       // verde muy suave
const HEADER_BG: [number, number, number] = [240, 253, 235]     // fondo header suave

const COLOR_OK: [number, number, number] = [22, 163, 74]
const COLOR_WARN: [number, number, number] = [202, 138, 4]
const COLOR_DANGER: [number, number, number] = [220, 38, 38]

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

// ─── Header compartido ───
function addHeader(doc: jsPDF, titulo: string, subtitulo?: string, orientation: "portrait" | "landscape" = "portrait") {
  const pageWidth = orientation === "landscape" ? 297 : 210
  const margin = 14

  // Barra verde superior
  doc.setFillColor(...SENA_GREEN)
  doc.rect(0, 0, pageWidth, 4, "F")

  // Titulo principal
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...GRAY_800)
  doc.text("CONINS", margin, 18)

  // Subtitulo institucional
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...GRAY_500)
  doc.text("Centro de Desarrollo y Manufactura Cerámica · SENA", margin, 24)

  // Fecha a la derecha
  const fecha = new Date().toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  doc.setFontSize(8)
  doc.setTextColor(...GRAY_400)
  doc.text(fecha, pageWidth - margin, 18, { align: "right" })

  // Línea separadora fina
  doc.setDrawColor(...SENA_GREEN)
  doc.setLineWidth(0.3)
  doc.line(margin, 28, pageWidth - margin, 28)

  // Titulo del reporte
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...SENA_DARK)
  doc.text(titulo, margin, 36)

  // Subtitulo opcional
  if (subtitulo) {
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...GRAY_500)
    doc.text(subtitulo, margin, 42)
  }
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const pw = doc.internal.pageSize.getWidth()
    const ph = doc.internal.pageSize.getHeight()

    // Línea footer
    doc.setDrawColor(230, 230, 230)
    doc.setLineWidth(0.2)
    doc.line(14, ph - 14, pw - 14, ph - 14)

    // Texto izquierda
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...GRAY_400)
    doc.text("CONINS · Sistema de Control de Instructores", 14, ph - 9)

    // Página derecha
    doc.text(`${i} / ${pageCount}`, pw - 14, ph - 9, { align: "right" })
  }
}

// Estilos de tabla compartidos
const tableDefaults = {
  theme: "striped" as const,
  headStyles: {
    fillColor: SENA_GREEN as any,
    textColor: WHITE as any,
    fontSize: 8,
    fontStyle: "bold" as const,
    halign: "left" as const,
    cellPadding: 4,
  },
  bodyStyles: {
    fontSize: 8,
    textColor: GRAY_800 as any,
    cellPadding: 3.5,
    lineColor: [235, 235, 235] as any,
    lineWidth: 0.1,
  },
  alternateRowStyles: {
    fillColor: ROW_ALT as any,
  },
  margin: { left: 14, right: 14 },
}

// ─── 1. Malla de Horarios ───
export function exportarHorariosPDF(horarios: Horario[], titulo: string = "Malla de Horarios") {
  const doc = new jsPDF()
  addHeader(doc, titulo, `${horarios.length} registros`)

  const tableData = horarios.map((h) => [
    h.ficha_numero,
    h.instructor_nombre,
    h.competencia,
    h.ambiente || "—",
    h.jornada,
    h.tipo_actividad || "—",
    h.dias.join(", "),
    h.horas,
    h.estado || "—",
  ])

  autoTable(doc, {
    startY: 46,
    head: [["Ficha", "Instructor", "Competencia", "Ambiente", "Jornada", "Actividad", "Días", "Horas", "Estado"]],
    body: tableData,
    ...tableDefaults,
    headStyles: {
      ...tableDefaults.headStyles,
      fontSize: 7,
      halign: "center",
    },
    bodyStyles: {
      ...tableDefaults.bodyStyles,
      fontSize: 7,
    },
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
    didParseCell: (cellData: any) => {
      if (cellData.column.index === 8 && cellData.section === "body") {
        const valor = cellData.cell.raw
        if (valor === "Aprobado") {
          cellData.cell.styles.textColor = COLOR_OK
          cellData.cell.styles.fontStyle = "bold"
        } else if (valor === "Pendiente") {
          cellData.cell.styles.textColor = COLOR_WARN
        } else if (valor === "Rechazado") {
          cellData.cell.styles.textColor = COLOR_DANGER
        }
      }
    },
  })

  addFooter(doc)
  doc.save(`malla-horarios-${new Date().toISOString().split("T")[0]}.pdf`)
}

// ─── 2. Carga Horaria ───
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

  const totalHoras = data.reduce((sum, c) => sum + c.total_horas, 0)
  const sobrecarga = data.filter((c) => c.estado === "Sobrecarga").length
  addHeader(doc, "Carga Horaria de Instructores", `${data.length} instructores · ${totalHoras}h totales · ${sobrecarga} en sobrecarga`)

  const tableData = data.map((c) => [
    c.instructor_nombre,
    `${c.total_horas}h`,
    String(c.fichas_count),
    String(c.competencias_count),
    c.estado,
  ])

  autoTable(doc, {
    startY: 46,
    head: [["Instructor", "Horas semanales", "Fichas", "Competencias", "Estado"]],
    body: tableData,
    ...tableDefaults,
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30, halign: "center" },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 30, halign: "center" },
      4: { cellWidth: 30, halign: "center" },
    },
    didParseCell: (cellData: any) => {
      if (cellData.column.index === 4 && cellData.section === "body") {
        const valor = cellData.cell.raw
        if (valor === "Sobrecarga") {
          cellData.cell.styles.textColor = COLOR_DANGER
          cellData.cell.styles.fontStyle = "bold"
        } else if (valor === "Bajo carga") {
          cellData.cell.styles.textColor = COLOR_WARN
        } else {
          cellData.cell.styles.textColor = COLOR_OK
        }
      }
    },
  })

  addFooter(doc)
  doc.save(`carga-horaria-${new Date().toISOString().split("T")[0]}.pdf`)
}

// ─── 3. Horario por Ficha ───
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
  addHeader(doc, "Horario Semanal por Ficha", `${data.length} fichas`, "landscape")

  const tableData = data.map((h) => [
    h.ficha_numero,
    h.programa,
    h.lunes || "—",
    h.martes || "—",
    h.miercoles || "—",
    h.jueves || "—",
    h.viernes || "—",
    h.sabado || "—",
  ])

  autoTable(doc, {
    startY: 46,
    head: [["Ficha", "Programa", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]],
    body: tableData,
    ...tableDefaults,
    headStyles: {
      ...tableDefaults.headStyles,
      halign: "center",
    },
    bodyStyles: {
      ...tableDefaults.bodyStyles,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 25, fontStyle: "bold", halign: "left" },
      1: { cellWidth: 45, halign: "left" },
      2: { cellWidth: 33 },
      3: { cellWidth: 33 },
      4: { cellWidth: 33 },
      5: { cellWidth: 33 },
      6: { cellWidth: 33 },
      7: { cellWidth: 33 },
    },
  })

  addFooter(doc)
  doc.save(`horario-por-ficha-${new Date().toISOString().split("T")[0]}.pdf`)
}

// ─── 4. Ocupación de Ambientes ───
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

  const promedioOcupacion = data.length > 0
    ? Math.round(data.reduce((sum, o) => sum + (o.porcentaje ?? 0), 0) / data.length)
    : 0
  addHeader(doc, "Ocupación de Ambientes", `${data.length} ambientes · Ocupación promedio: ${promedioOcupacion}%`)

  const tableData = data.map((o) => [
    o.ambiente_nombre || "—",
    o.tipo || "—",
    o.capacidad != null ? String(o.capacidad) : "—",
    `${o.horas_ocupadas ?? 0}h / ${o.horas_totales ?? 0}h`,
    `${o.porcentaje ?? 0}%`,
  ])

  autoTable(doc, {
    startY: 46,
    head: [["Ambiente", "Tipo", "Capacidad", "Horas", "Ocupación"]],
    body: tableData,
    ...tableDefaults,
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 30, halign: "center" },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 40, halign: "center" },
      4: { cellWidth: 30, halign: "center" },
    },
    didParseCell: (cellData: any) => {
      if (cellData.column.index === 4 && cellData.section === "body") {
        const valor = parseInt(cellData.cell.raw)
        if (valor > 80) {
          cellData.cell.styles.textColor = COLOR_DANGER
          cellData.cell.styles.fontStyle = "bold"
        } else if (valor > 50) {
          cellData.cell.styles.textColor = COLOR_WARN
        } else {
          cellData.cell.styles.textColor = COLOR_OK
        }
      }
    },
  })

  addFooter(doc)
  doc.save(`ocupacion-ambientes-${new Date().toISOString().split("T")[0]}.pdf`)
}

