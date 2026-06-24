import jsPDF from "jspdf"
import "jspdf-autotable"

type Horario = {
  ficha_numero: string
  instructor_nombre: string
  competencia: string
  ambiente: string
  jornada: string
  dias: string[]
  horas: string
}

export function exportarHorariosPDF(horarios: Horario[], titulo: string = "Malla de Horarios") {
  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.setTextColor(0, 102, 51)
  doc.text("CONINS - CDMC SENA", 14, 15)

  doc.setFontSize(12)
  doc.setTextColor(50, 50, 50)
  doc.text(titulo, 14, 25)

  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generado: ${new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}`, 14, 32)

  const tableData = horarios.map((h) => [
    h.ficha_numero,
    h.instructor_nombre,
    h.competencia,
    h.ambiente,
    h.jornada,
    h.dias.join(", "),
    h.horas,
  ])

  ;(doc as any).autoTable({
    startY: 38,
    head: [["Ficha", "Instructor", "Competencia", "Ambiente", "Jornada", "Dias", "Horas"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [0, 102, 51],
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: 50,
    },
    alternateRowStyles: {
      fillColor: [245, 250, 245],
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 35 },
      2: { cellWidth: 35 },
      3: { cellWidth: 22 },
      4: { cellWidth: 20 },
      5: { cellWidth: 30 },
      6: { cellWidth: 25 },
    },
    margin: { left: 14, right: 14 },
  })

  doc.save(`malla-horarios-${new Date().toISOString().split("T")[0]}.pdf`)
}

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

  doc.setFontSize(16)
  doc.setTextColor(0, 102, 51)
  doc.text("CONINS - CDMC SENA", 14, 15)

  doc.setFontSize(12)
  doc.setTextColor(50, 50, 50)
  doc.text("Reporte de Carga Horaria", 14, 25)

  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generado: ${new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}`, 14, 32)

  const totalHoras = data.reduce((sum, c) => sum + c.total_horas, 0)
  doc.setFontSize(10)
  doc.setTextColor(50, 50, 50)
  doc.text(`Total instructores: ${data.length}  |  Horas totales: ${totalHoras}h`, 14, 38)

  const tableData = data.map((c) => [
    c.instructor_nombre,
    `${c.total_horas}h`,
    c.fichas_count.toString(),
    c.competencias_count.toString(),
    c.estado,
  ])

  ;(doc as any).autoTable({
    startY: 44,
    head: [["Instructor", "Horas", "Fichas", "Competencias", "Estado"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [0, 102, 51],
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: 50,
    },
    alternateRowStyles: {
      fillColor: [245, 250, 245],
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 25, halign: "center" },
      4: { cellWidth: 30, halign: "center" },
    },
    didParseCell: (cellData: any) => {
      if (cellData.column.index === 4 && cellData.section === "body") {
        const valor = cellData.cell.raw
        if (valor === "Sobrecarga") {
          cellData.cell.styles.textColor = [220, 38, 38]
          cellData.cell.styles.fontStyle = "bold"
        } else {
          cellData.cell.styles.textColor = [34, 197, 94]
        }
      }
    },
    margin: { left: 14, right: 14 },
  })

  doc.save(`carga-horaria-${new Date().toISOString().split("T")[0]}.pdf`)
}

type HorarioFicha = {
  ficha_numero: string
  programa: string
  lunes: string
  martes: string
  miercoles: string
  jueves: string
  viernes: string
  sabado: string
}

export function exportarHorarioFichaPDF(data: HorarioFicha[]) {
  const doc = new jsPDF("landscape")

  doc.setFontSize(16)
  doc.setTextColor(0, 102, 51)
  doc.text("CONINS - CDMC SENA", 14, 15)

  doc.setFontSize(12)
  doc.setTextColor(50, 50, 50)
  doc.text("Horario por Ficha", 14, 25)

  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generado: ${new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}`, 14, 32)

  const tableData = data.map((h) => [
    h.ficha_numero,
    h.programa,
    h.lunes,
    h.martes,
    h.miercoles,
    h.jueves,
    h.viernes,
    h.sabado,
  ])

  ;(doc as any).autoTable({
    startY: 38,
    head: [["Ficha", "Programa", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [0, 102, 51],
      textColor: 255,
      fontSize: 9,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 9,
      textColor: 50,
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [245, 250, 245],
    },
    columnStyles: {
      0: { cellWidth: 25, fontStyle: "bold" },
      1: { cellWidth: 45 },
      2: { cellWidth: 35 },
      3: { cellWidth: 35 },
      4: { cellWidth: 35 },
      5: { cellWidth: 35 },
      6: { cellWidth: 35 },
      7: { cellWidth: 35 },
    },
    margin: { left: 14, right: 14 },
  })

  doc.save(`horario-por-ficha-${new Date().toISOString().split("T")[0]}.pdf`)
}

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

  doc.setFontSize(16)
  doc.setTextColor(0, 102, 51)
  doc.text("CONINS - CDMC SENA", 14, 15)

  doc.setFontSize(12)
  doc.setTextColor(50, 50, 50)
  doc.text("Ocupacion de Ambientes", 14, 25)

  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generado: ${new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}`, 14, 32)

  const tableData = data.map((o) => [
    o.ambiente_nombre,
    o.tipo,
    o.capacidad.toString(),
    `${o.horas_ocupadas}h / ${o.horas_totales}h`,
    `${o.porcentaje}%`,
  ])

  ;(doc as any).autoTable({
    startY: 38,
    head: [["Ambiente", "Tipo", "Capacidad", "Horas Ocupadas", "Ocupacion"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [0, 102, 51],
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: 50,
    },
    alternateRowStyles: {
      fillColor: [245, 250, 245],
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 30, halign: "center" },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 40, halign: "center" },
      4: { cellWidth: 25, halign: "center" },
    },
    didParseCell: (cellData: any) => {
      if (cellData.column.index === 4 && cellData.section === "body") {
        const valor = parseInt(cellData.cell.raw)
        if (valor > 80) {
          cellData.cell.styles.textColor = [220, 38, 38]
          cellData.cell.styles.fontStyle = "bold"
        } else if (valor > 50) {
          cellData.cell.styles.textColor = [234, 179, 8]
        } else {
          cellData.cell.styles.textColor = [34, 197, 94]
        }
      }
    },
    margin: { left: 14, right: 14 },
  })

  doc.save(`ocupacion-ambientes-${new Date().toISOString().split("T")[0]}.pdf`)
}
