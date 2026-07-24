import { useMemo } from "react"

type Horario = {
  id: number
  ficha_numero: string
  instructor_nombre: string
  competencia: string
  ambiente: string
  jornada: string
  dias: string[]
  horas: string
}

const DIAS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
const HORAS = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"]

const JORNADA_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Manana": { bg: "bg-green-50", text: "text-green-800", border: "border-green-200" },
  "manana": { bg: "bg-green-50", text: "text-green-800", border: "border-green-200" },
  "Mixta": { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
  "mixta": { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
  "Noche": { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
  "noche": { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
  "Virtual": { bg: "bg-gray-50", text: "text-gray-800", border: "border-gray-200" },
  "virtual": { bg: "bg-gray-50", text: "text-gray-800", border: "border-gray-200" },
}

function getHoraInicio(horas: string) {
  const parts = horas.split(" - ")
  return parts[0] || ""
}

function getHoraFin(horas: string) {
  const parts = horas.split(" - ")
  return parts[1] || ""
}

function getRowSpan(horas: string) {
  const inicio = getHoraInicio(horas)
  const fin = getHoraFin(horas)
  const inicioIdx = HORAS.indexOf(inicio)
  const finIdx = HORAS.indexOf(fin)
  if (inicioIdx === -1 || finIdx === -1) return 1
  return finIdx - inicioIdx + 1
}

type GrillaHorariosProps = {
  horarios: Horario[]
}

export default function GrillaHorarios({ horarios }: GrillaHorariosProps) {
  const grilla = useMemo(() => {
    const map: Record<string, Record<string, Horario>> = {}

    for (const dia of DIAS) {
      map[dia] = {}
    }

    for (const h of horarios) {
      for (const dia of h.dias) {
        const diaNorm = dia === "Mié" ? "Mie" : dia
        if (map[diaNorm]) {
          const horaInicio = getHoraInicio(h.horas)
          map[diaNorm][horaInicio] = h
        }
      }
    }

    return map
  }, [horarios])

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-3 font-medium text-gray-500 w-20 border-r border-gray-100">Hora</th>
              {DIAS.map((dia) => (
                <th key={dia} className="px-3 py-3 font-medium text-gray-500 text-center min-w-[160px]">
                  {dia}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HORAS.map((hora) => (
              <tr key={hora} className="border-b border-gray-50">
                <td className="px-3 py-2 text-xs text-gray-400 font-medium border-r border-gray-100 text-center bg-gray-50/50">
                  {hora}
                </td>
                {DIAS.map((dia) => {
                  const diaNorm = dia === "Mié" ? "Mie" : dia
                  const h = grilla[diaNorm]?.[hora]
                  if (!h) return <td key={dia} className="px-1 py-2 border-r border-gray-50 last:border-r-0"></td>

                  const rowSpan = getRowSpan(h.horas)
                  const colors = JORNADA_COLORS[h.jornada] || JORNADA_COLORS["Virtual"]

                  return (
                    <td
                      key={dia}
                      rowSpan={rowSpan}
                      className={`px-2 py-2 border-r border-gray-50 last:border-r-0 ${colors.bg} ${colors.border} border-l-2`}
                    >
                      <div className={`${colors.text} text-xs space-y-0.5`}>
                        <p className="font-bold">{h.ficha_numero}</p>
                        <p className="truncate">{h.instructor_nombre}</p>
                        <p className="truncate text-gray-500">{h.ambiente}</p>
                        <p className="text-gray-400">{h.horas}</p>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
