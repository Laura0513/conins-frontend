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
