import { useMemo } from "react"
import { formatJornada } from "@/lib/terminology"

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
const DIAS_LABEL: Record<string, string> = {
  Lun: "Lunes",
  Mar: "Martes",
  Mie: "Miércoles",
  Jue: "Jueves",
  Vie: "Viernes",
  Sab: "Sábado",
}
const HORAS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00",
]

const JORNADA_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  manana: { bg: "bg-green-50", text: "text-green-800", border: "border-green-200" },
  mixta: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
  noche: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
  virtual: { bg: "bg-gray-50", text: "text-gray-800", border: "border-gray-200" },
}

function getColors(jornada: string) {
  const key = jornada?.toLowerCase() || "virtual"
  return JORNADA_COLORS[key] || JORNADA_COLORS.virtual
}

function parseHora(horas: string): { inicio: string; fin: string } {
  const parts = horas.split(" - ")
  return { inicio: parts[0] || "", fin: parts[1] || "" }
}

function getRowSpan(horas: string) {
  const { inicio, fin } = parseHora(horas)
  const i = HORAS.indexOf(inicio)
  const f = HORAS.indexOf(fin)
  if (i === -1 || f === -1) return 1
  return Math.max(f - i, 1)
}

function getLunes(offset: number): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const lunes = new Date(now)
  lunes.setDate(now.getDate() + diff + offset * 7)
  lunes.setHours(0, 0, 0, 0)
  return lunes
}

function formatFechaSemana(lunes: Date): string {
  const domingo = new Date(lunes)
  domingo.setDate(lunes.getDate() + 5)
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
  return `${lunes.toLocaleDateString("es-CO", opts)} — ${domingo.toLocaleDateString("es-CO", opts)}, ${lunes.getFullYear()}`
}

type GrillaHorariosProps = {
  horarios: Horario[]
}

export default function GrillaHorarios({ horarios }: GrillaHorariosProps) {
  // Build grid: dia → hora → Horario[] (multiple per slot)
  const { grilla, ocupados } = useMemo(() => {
    const map: Record<string, Record<string, Horario[]>> = {}
    const ocu: Record<string, Set<string>> = {}

    for (const dia of DIAS) {
      map[dia] = {}
      ocu[dia] = new Set()
    }

    for (const h of horarios) {
      for (const dia of h.dias) {
        const diaNorm = dia === "Mié" ? "Mie" : dia
        if (!map[diaNorm]) continue

        const { inicio } = parseHora(h.horas)
        if (!map[diaNorm][inicio]) map[diaNorm][inicio] = []
        map[diaNorm][inicio].push(h)

        // Mark spanned hours as occupied
        const span = getRowSpan(h.horas)
        const startIdx = HORAS.indexOf(inicio)
        for (let s = 1; s < span; s++) {
          if (HORAS[startIdx + s]) {
            ocu[diaNorm].add(HORAS[startIdx + s])
          }
        }
      }
    }

    return { grilla: map, ocupados: ocu }
  }, [horarios])

  return (
    <div className="space-y-4">
      {/* Etiqueta de programación semanal */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex items-center justify-center">
        <p className="text-sm font-semibold text-gray-900">Programación semanal</p>
      </div>

      {/* Grilla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-3 font-medium text-gray-500 w-20 border-r border-gray-100 text-center">Hora</th>
                {DIAS.map((dia) => (
                  <th key={dia} className="px-3 py-3 font-medium text-gray-500 text-center min-w-[150px]">
                    {DIAS_LABEL[dia]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HORAS.map((hora) => (
                <tr key={hora} className="border-b border-gray-50">
                  <td className="px-3 py-2 text-xs text-gray-400 font-medium border-r border-gray-100 text-center bg-gray-50/50 whitespace-nowrap">
                    {hora}
                  </td>
                  {DIAS.map((dia) => {
                    // Skip if this cell is spanned by a previous rowSpan
                    if (ocupados[dia]?.has(hora)) return null

                    const entries = grilla[dia]?.[hora]
                    if (!entries || entries.length === 0) {
                      return (
                        <td key={dia} className="px-1 py-1 border-r border-gray-50 last:border-r-0 h-10" />
                      )
                    }

                    // Use the max rowSpan of entries in this slot
                    const maxSpan = Math.max(...entries.map((e) => getRowSpan(e.horas)))

                    return (
                      <td
                        key={dia}
                        rowSpan={maxSpan}
                        className="px-1 py-1 border-r border-gray-50 last:border-r-0 align-top"
                      >
                        <div className="flex flex-col gap-1 h-full">
                          {entries.map((h) => {
                            const colors = getColors(h.jornada)
                            return (
                              <div
                                key={h.id}
                                className={`${colors.bg} ${colors.border} border-l-2 rounded-r px-2 py-1.5 flex-1 min-h-[36px]`}
                              >
                                <div className={`${colors.text} text-xs space-y-0.5`}>
                                  <p className="font-bold truncate">{h.ficha_numero}</p>
                                  <p className="truncate">{h.instructor_nombre.split(" ").slice(0, 2).join(" ")}</p>
                                  {h.ambiente && (
                                    <p className="truncate text-gray-500">{h.ambiente}</p>
                                  )}
                                  <p className="text-gray-400">{h.horas}</p>
                                </div>
                              </div>
                            )
                          })}
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

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 px-2">
        {Object.entries(JORNADA_COLORS).map(([key, colors]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${colors.bg} ${colors.border} border`} />
            <span className="text-xs text-gray-500 capitalize">{key === "manana" ? "Mañana" : key}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
