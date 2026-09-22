import { useState, useMemo, useEffect } from "react"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
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
  es_complementaria?: number | boolean
  programa?: string
  programa_codigo?: string
  modalidad?: string
  fecha_inicio?: string
  fecha_fin?: string | null
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

const JORNADAS = [
  { key: "manana", label: "Mañana", horario: "06:00 – 12:00", bg: "bg-green-50", text: "text-green-800", border: "border-green-200", headerBg: "bg-green-100" },
  { key: "mixta", label: "Tarde", horario: "12:00 – 18:00", bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200", headerBg: "bg-blue-100" },
  { key: "noche", label: "Noche", horario: "18:00 – 22:00", bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", headerBg: "bg-purple-100" },
]

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
  const sabado = new Date(lunes)
  sabado.setDate(lunes.getDate() + 5)
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
  return `${lunes.toLocaleDateString("es-CO", opts)} — ${sabado.toLocaleDateString("es-CO", opts)}, ${lunes.getFullYear()}`
}

function getLunesISO(offset: number): string {
  const lunes = getLunes(offset)
  const y = lunes.getFullYear()
  const m = String(lunes.getMonth() + 1).padStart(2, "0")
  const d = String(lunes.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

type GrillaHorariosProps = {
  horarios: Horario[]
  onSemanaChange?: (semana: string | undefined) => void
  loading?: boolean
  onClickHorario?: (horario: Horario) => void
  onClickEntidad?: (tipo: "instructor" | "grupo" | "ambiente", valor: string) => void
  onClickEmpty?: (dia: string, jornadaKey: string) => void
  filterDia?: string | null
}

export default function GrillaHorarios({ horarios, onSemanaChange, loading, onClickHorario, onClickEntidad, onClickEmpty, filterDia }: GrillaHorariosProps) {
  const [semanaOffset, setSemanaOffset] = useState(0)
  const lunes = getLunes(semanaOffset)

  useEffect(() => {
    if (onSemanaChange) {
      onSemanaChange(getLunesISO(semanaOffset))
    }
  }, [semanaOffset])

  // Build grid: jornada → dia → Horario[]
  const grilla = useMemo(() => {
    const map: Record<string, Record<string, Horario[]>> = {}

    for (const j of JORNADAS) {
      map[j.key] = {}
      for (const dia of DIAS) {
        map[j.key][dia] = []
      }
    }

    for (const h of horarios) {
      const jornadaKey = h.jornada?.toLowerCase() || "manana"
      // Map jornada to our 3 rows
      const targetKey = JORNADAS.find(j => j.key === jornadaKey) ? jornadaKey : "manana"

      for (const dia of h.dias) {
        const diaNorm = dia === "Mié" ? "Mie" : dia
        if (map[targetKey]?.[diaNorm]) {
          map[targetKey][diaNorm].push(h)
        }
      }
    }

    return map
  }, [horarios])

  const diasVisibles = filterDia ? DIAS.filter(d => d === filterDia) : DIAS

  const navegarSemana = (dir: number) => {
    setSemanaOffset((o) => o + dir)
  }

  const hideNav = !!filterDia

  return (
    <div className="space-y-4">
      {/* Navegación semanal */}
      {!hideNav && (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navegarSemana(-1)}
          className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">
            {semanaOffset === 0
              ? "Semana actual"
              : semanaOffset > 0
              ? `+${semanaOffset} semana${semanaOffset > 1 ? "s" : ""}`
              : `${semanaOffset} semana${semanaOffset < -1 ? "s" : ""}`}
          </p>
          <p className="text-xs text-gray-500">{formatFechaSemana(lunes)}</p>
        </div>
        <button
          onClick={() => navegarSemana(1)}
          className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      )}

      {/* Grilla por jornadas */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Cargando horarios...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-3 font-medium text-gray-500 w-32 border-r border-gray-100 text-center">
                    Jornada
                  </th>
                  {diasVisibles.map((dia) => (
                    <th key={dia} className="px-3 py-3 font-medium text-gray-500 text-center min-w-[150px]">
                      {DIAS_LABEL[dia]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {JORNADAS.map((jornada) => (
                  <tr key={jornada.key} className="border-b border-gray-100">
                    <td className={`px-3 py-3 border-r border-gray-100 text-center ${jornada.headerBg} align-top`}>
                      <div className="space-y-0.5">
                        <p className={`text-sm font-semibold ${jornada.text}`}>{jornada.label}</p>
                        <p className="text-xs text-gray-400">{jornada.horario}</p>
                      </div>
                    </td>
                    {diasVisibles.map((dia) => {
                      const entries = grilla[jornada.key]?.[dia] || []

                      if (entries.length === 0) {
                        return (
                          <td
                            key={dia}
                            className={`px-1 py-2 border-r border-gray-50 last:border-r-0 align-top min-h-[80px] ${onClickEmpty ? "cursor-pointer group/cell" : ""}`}
                            onClick={() => onClickEmpty?.(dia, jornada.key)}
                          >
                            <div className={`h-20 rounded-lg flex items-center justify-center transition-colors ${onClickEmpty ? "group-hover/cell:bg-gray-50 group-hover/cell:border group-hover/cell:border-dashed group-hover/cell:border-gray-300" : ""}`}>
                              {onClickEmpty && (
                                <span className="text-gray-300 text-lg opacity-0 group-hover/cell:opacity-100 transition-opacity">+</span>
                              )}
                            </div>
                          </td>
                        )
                      }

                      return (
                        <td key={dia} className="px-1 py-2 border-r border-gray-50 last:border-r-0 align-top">
                          <div className="flex flex-col gap-1">
                            {entries.map((h) => {
                              const esCompl = h.es_complementaria === 1 || h.es_complementaria === true
                              return (
                              <div
                                key={h.id}
                                onClick={() => onClickHorario?.(h)}
                                className={`${esCompl ? "bg-emerald-50 border-emerald-300" : `${jornada.bg} ${jornada.border}`} border-l-2 rounded-r px-2 py-1.5 min-h-[60px] ${onClickHorario ? "cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all" : ""}`}
                              >
                                <div className={`${esCompl ? "text-emerald-800" : jornada.text} text-xs space-y-0.5`}>
                                  {esCompl && (
                                    <span className="inline-block px-1.5 py-0.5 bg-emerald-200 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-wide mb-0.5">
                                      Complementaria
                                    </span>
                                  )}
                                  <p
                                    className={`font-bold truncate ${onClickEntidad ? "cursor-pointer hover:underline" : ""}`}
                                    onClick={(e) => { e.stopPropagation(); if (!esCompl) onClickEntidad?.("grupo", h.ficha_numero) }}
                                  >
                                    {esCompl ? (h.programa || h.ficha_numero) : h.ficha_numero}
                                  </p>
                                  <p
                                    className={`truncate ${onClickEntidad ? "cursor-pointer hover:underline" : ""}`}
                                    onClick={(e) => { e.stopPropagation(); onClickEntidad?.("instructor", h.instructor_nombre) }}
                                  >
                                    {h.instructor_nombre.split(" ").slice(0, 2).join(" ")}
                                  </p>
                                  {esCompl && h.modalidad && (
                                    <p className="truncate text-emerald-600 capitalize">{h.modalidad}</p>
                                  )}
                                  {esCompl && h.fecha_inicio && (
                                    <p className="truncate text-emerald-500 text-[10px]">
                                      {h.fecha_inicio}{h.fecha_fin ? ` → ${h.fecha_fin}` : ""}
                                    </p>
                                  )}
                                  {h.ambiente && (
                                    <p
                                      className={`truncate ${esCompl ? "text-emerald-500" : "text-gray-500"} ${onClickEntidad ? "cursor-pointer hover:underline" : ""}`}
                                      onClick={(e) => { e.stopPropagation(); onClickEntidad?.("ambiente", h.ambiente) }}
                                    >
                                      {h.ambiente}
                                    </p>
                                  )}
                                  <p className={esCompl ? "text-emerald-500" : "text-gray-400"}>{h.horas}</p>
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
        )}
      </div>

      {/* Leyenda */}
      {!hideNav && (
        <div className="flex flex-wrap gap-4 px-2">
          {JORNADAS.map((j) => (
            <div key={j.key} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${j.bg} ${j.border} border`} />
              <span className="text-xs text-gray-500">{j.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-50 border-emerald-300 border" />
            <span className="text-xs text-gray-500">Complementaria</span>
          </div>
        </div>
      )}
    </div>
  )
}
