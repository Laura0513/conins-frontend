import { useState, useEffect, useMemo } from "react"
import { X, User, BookOpen, MapPin, Clock, ChevronLeft, ChevronRight, Loader2, FileDown, Calendar, AlertCircle, CheckCircle2 } from "lucide-react"
import { api } from "@/lib/api"
import { formatJornada } from "@/lib/terminology"
import { exportarHorariosPDF } from "@/lib/exportPDF"

type Horario = {
  id: number
  ficha_numero: string
  instructor_nombre: string
  competencia: string
  ambiente: string
  jornada: string
  dias: string[]
  horas: string
  activo: boolean
  instructor_id?: number | null
  ficha_id?: number | null
  ambiente_id?: number | null
}

type FiltroTipo = "instructor" | "grupo" | "ambiente"

type VistaRapidaHorarioModalProps = {
  isOpen: boolean
  onClose: () => void
  tipo: FiltroTipo
  valor: string
  semanaInicial?: string // ISO del lunes, ej: "2026-08-25"
  soloHoy?: boolean // true cuando el filtro "Día" está activo
}

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
const DIAS_LABEL_COMPLETO: Record<string, string> = {
  Dom: "Domingo", Lun: "Lunes", Mar: "Martes", Mie: "Miércoles", Jue: "Jueves", Vie: "Viernes", Sab: "Sábado",
}

const JORNADA_COLORES: Record<string, { bg: string; text: string; border: string }> = {
  manana: { bg: "bg-green-50", text: "text-green-800", border: "border-green-200" },
  mixta: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
  noche: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
}

function getLunesISO(offset: number): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const lunes = new Date(now)
  lunes.setDate(now.getDate() + diff + offset * 7)
  const y = lunes.getFullYear()
  const m = String(lunes.getMonth() + 1).padStart(2, "0")
  const d = String(lunes.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function formatFechaSemana(offset: number): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const lunes = new Date(now)
  lunes.setDate(now.getDate() + diff + offset * 7)
  const sabado = new Date(lunes)
  sabado.setDate(lunes.getDate() + 5)
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
  return `${lunes.toLocaleDateString("es-CO", opts)} — ${sabado.toLocaleDateString("es-CO", opts)}, ${lunes.getFullYear()}`
}

export default function VistaRapidaHorarioModal({ isOpen, onClose, tipo, valor, semanaInicial, soloHoy }: VistaRapidaHorarioModalProps) {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [loading, setLoading] = useState(false)
  const [semanaOffset, setSemanaOffset] = useState(0)

  // Calcular offset inicial a partir de semanaInicial
  const calcularOffsetInicial = () => {
    if (!semanaInicial) return 0
    const lunesActual = new Date()
    const day = lunesActual.getDay()
    const diff = day === 0 ? -6 : 1 - day
    lunesActual.setDate(lunesActual.getDate() + diff)
    lunesActual.setHours(0, 0, 0, 0)
    const lunesParam = new Date(semanaInicial + "T00:00:00")
    const diffMs = lunesParam.getTime() - lunesActual.getTime()
    return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000))
  }

  const diaHoyAbrev = DIAS_SEMANA[new Date().getDay()]
  const tituloTipo = tipo === "instructor" ? "Instructor" : tipo === "grupo" ? "Grupo" : "Ambiente"
  const IconoTipo = tipo === "instructor" ? User : tipo === "grupo" ? BookOpen : MapPin

  useEffect(() => {
    if (isOpen) {
      const offset = calcularOffsetInicial()
      setSemanaOffset(offset)
      cargarHorarios(offset)
    }
  }, [isOpen, valor, tipo, semanaInicial])

  useEffect(() => {
    if (isOpen) {
      cargarHorarios(semanaOffset)
    }
  }, [semanaOffset])

  const cargarHorarios = async (offset: number) => {
    setLoading(true)
    try {
      const semana = getLunesISO(offset)
      const res = await api.horarios.getAll(semana)
      const todos = (res.data || []) as Horario[]
      const filtrados = todos.filter((h) => {
        if (!h.activo) return false
        switch (tipo) {
          case "instructor": return h.instructor_nombre === valor
          case "grupo": return h.ficha_numero === valor
          case "ambiente": return h.ambiente === valor
          default: return false
        }
      })
      setHorarios(filtrados)
    } catch {
      setHorarios([])
    } finally {
      setLoading(false)
    }
  }

  // Horarios del día de hoy
  const horariosHoy = useMemo(() => {
    return horarios.filter((h) => {
      const dias = h.dias.map((d) => (d === "Mié" ? "Mie" : d))
      return dias.includes(diaHoyAbrev)
    })
  }, [horarios, diaHoyAbrev])

  // Horarios organizados por día para la semana
  const horariosPorDia = useMemo(() => {
    const diasOrden = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
    const mapa: Record<string, Horario[]> = {}
    for (const dia of diasOrden) mapa[dia] = []
    for (const h of horarios) {
      for (const dia of h.dias) {
        const diaNorm = dia === "Mié" ? "Mie" : dia
        if (mapa[diaNorm]) mapa[diaNorm].push(h)
      }
    }
    return mapa
  }, [horarios])

  // Resumen rápido
  const resumen = useMemo(() => {
    const grupos = [...new Set(horarios.map((h) => h.ficha_numero))]
    const instructores = [...new Set(horarios.map((h) => h.instructor_nombre))]
    const ambientes = [...new Set(horarios.map((h) => h.ambiente).filter(Boolean))]
    const competencias = [...new Set(horarios.map((h) => h.competencia).filter(Boolean))]
    let totalBloques = 0
    for (const h of horarios) totalBloques += h.dias.length
    return { grupos, instructores, ambientes, competencias, totalBloques }
  }, [horarios])

  // Disponibilidad del ambiente: qué jornadas están libres cada día
  const disponibilidad = useMemo(() => {
    if (tipo !== "ambiente") return null
    const diasOrden = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
    const jornadasKey = ["manana", "mixta", "noche"]
    const jornadasLabel: Record<string, string> = { manana: "Mañana", mixta: "Tarde", noche: "Noche" }

    const mapa: Record<string, Record<string, Horario | null>> = {}
    for (const dia of diasOrden) {
      mapa[dia] = {}
      for (const j of jornadasKey) mapa[dia][j] = null
    }

    for (const h of horarios) {
      const jKey = h.jornada?.toLowerCase() || "manana"
      for (const dia of h.dias) {
        const diaNorm = dia === "Mié" ? "Mie" : dia
        if (mapa[diaNorm] && jornadasKey.includes(jKey)) {
          mapa[diaNorm][jKey] = h
        }
      }
    }

    return { mapa, diasOrden, jornadasKey, jornadasLabel }
  }, [horarios, tipo])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sena/10 flex items-center justify-center">
              <IconoTipo className="w-5 h-5 text-sena" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{valor}</h2>
              <p className="text-xs text-gray-500">{tituloTipo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const datos = soloHoy ? horariosHoy : horarios
                const titulo = soloHoy
                  ? `Horario de hoy — ${tituloTipo}: ${valor}`
                  : `Horarios — ${tituloTipo}: ${valor}`
                exportarHorariosPDF(datos, titulo)
              }}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              PDF
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* ═══ NAVEGACIÓN SEMANAL (siempre visible) ═══ */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">{soloHoy ? "Horario de hoy" : "Horario semanal"}</h3>
            {!soloHoy && (
            <div className="flex items-center gap-2">
              <button onClick={() => setSemanaOffset((o) => o - 1)} className="p-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-center min-w-[160px]">
                <p className="text-xs font-medium text-gray-700">
                  {semanaOffset === 0 ? "Semana actual" : semanaOffset > 0 ? `+${semanaOffset} sem.` : `${semanaOffset} sem.`}
                </p>
                <p className="text-[10px] text-gray-500">{formatFechaSemana(semanaOffset)}</p>
              </div>
              <button onClick={() => setSemanaOffset((o) => o + 1)} className="p-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Cargando...</span>
            </div>
          ) : horarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Calendar className="w-8 h-8 mb-2" />
              <p className="text-sm">Sin horarios esta semana</p>
              <p className="text-xs mt-1">Usa las flechas para navegar a otra semana</p>
            </div>
          ) : (
            <>
              {/* ═══ AHORA MISMO ═══ */}
              {(soloHoy || semanaOffset === 0) && (
                <div className={`rounded-xl p-4 ${horariosHoy.length > 0 ? "bg-sena/5 border border-sena/20" : "bg-gray-50 border border-gray-200"}`}>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sena" />
                    Hoy — {DIAS_LABEL_COMPLETO[diaHoyAbrev]}
                  </h3>
                  {horariosHoy.length === 0 ? (
                    <p className="text-sm text-gray-500">No tiene horarios programados hoy</p>
                  ) : (
                    <div className="space-y-2">
                      {horariosHoy.map((h) => {
                        const colores = JORNADA_COLORES[h.jornada?.toLowerCase()] || JORNADA_COLORES.manana
                        return (
                          <div key={h.id} className={`${colores.bg} ${colores.border} border rounded-lg p-3`}>
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-bold ${colores.text}`}>{h.horas}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${colores.bg} ${colores.text} border ${colores.border}`}>
                                    {formatJornada(h.jornada)}
                                  </span>
                                </div>
                                {tipo !== "grupo" && (
                                  <p className="text-sm text-gray-900 flex items-center gap-1.5">
                                    <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                                    Grupo <span className="font-semibold">{h.ficha_numero}</span>
                                  </p>
                                )}
                                {tipo !== "instructor" && (
                                  <p className="text-sm text-gray-900 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-gray-400" />
                                    {h.instructor_nombre}
                                  </p>
                                )}
                                {h.ambiente && tipo !== "ambiente" && (
                                  <p className="text-sm text-gray-700 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                    {h.ambiente}
                                  </p>
                                )}
                                {h.competencia && (
                                  <p className="text-xs text-gray-500 mt-1 truncate max-w-md" title={h.competencia}>
                                    {h.competencia}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ SEMANA COMPLETA ═══ */}
              {!soloHoy && <div>
                <div className="space-y-1">
                  {(["Lun", "Mar", "Mie", "Jue", "Vie", "Sab"] as const).map((dia) => {
                    const entries = horariosPorDia[dia] || []
                    const esHoy = semanaOffset === 0 && dia === diaHoyAbrev
                    return (
                      <div key={dia} className={`rounded-lg border ${esHoy ? "border-sena/30 bg-sena/5" : "border-gray-100 bg-gray-50"} p-3`}>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold w-20 ${esHoy ? "text-sena" : "text-gray-500"}`}>
                            {DIAS_LABEL_COMPLETO[dia]}
                            {esHoy && <span className="ml-1 text-[10px] font-normal">(hoy)</span>}
                          </span>
                          {entries.length === 0 ? (
                            <span className="text-xs text-gray-400">— Libre</span>
                          ) : (
                            <div className="flex-1 flex flex-wrap gap-2">
                              {entries.map((h) => {
                                const colores = JORNADA_COLORES[h.jornada?.toLowerCase()] || JORNADA_COLORES.manana
                                return (
                                  <div key={h.id} className={`${colores.bg} ${colores.border} border rounded px-2.5 py-1.5 text-xs`}>
                                    <span className={`font-bold ${colores.text}`}>{h.horas}</span>
                                    {tipo !== "grupo" && <span className="text-gray-600 ml-2">Grupo {h.ficha_numero}</span>}
                                    {tipo !== "instructor" && <span className="text-gray-600 ml-2">{h.instructor_nombre.split(" ").slice(0, 2).join(" ")}</span>}
                                    {h.ambiente && tipo !== "ambiente" && <span className="text-gray-500 ml-2">· {h.ambiente}</span>}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>}

              {/* ═══ DISPONIBILIDAD DEL AMBIENTE ═══ */}
              {!soloHoy && tipo === "ambiente" && disponibilidad && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Disponibilidad
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-2 py-2 text-left text-gray-500 font-medium border-b border-gray-200 w-20">Jornada</th>
                          {disponibilidad.diasOrden.map((dia) => {
                            const esHoy = semanaOffset === 0 && dia === diaHoyAbrev
                            return (
                              <th key={dia} className={`px-2 py-2 text-center font-medium border-b border-gray-200 ${esHoy ? "text-sena bg-sena/5" : "text-gray-500"}`}>
                                {DIAS_LABEL_COMPLETO[dia]?.slice(0, 3)}
                                {esHoy && <span className="block text-[9px] font-normal">(hoy)</span>}
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {disponibilidad.jornadasKey.map((jKey) => {
                          const colores = JORNADA_COLORES[jKey] || JORNADA_COLORES.manana
                          return (
                            <tr key={jKey} className="border-b border-gray-100">
                              <td className={`px-2 py-2 font-semibold ${colores.text} ${colores.bg}`}>
                                {disponibilidad.jornadasLabel[jKey]}
                              </td>
                              {disponibilidad.diasOrden.map((dia) => {
                                const ocupado = disponibilidad.mapa[dia][jKey]
                                const esHoy = semanaOffset === 0 && dia === diaHoyAbrev
                                return (
                                  <td key={dia} className={`px-1 py-2 text-center ${esHoy ? "bg-sena/5" : ""}`}>
                                    {ocupado ? (
                                      <div className={`${colores.bg} ${colores.border} border rounded px-1 py-1`}>
                                        <p className={`font-bold ${colores.text} truncate`}>{ocupado.ficha_numero}</p>
                                        <p className="text-gray-500 truncate">{ocupado.instructor_nombre.split(" ").slice(0, 2).join(" ")}</p>
                                      </div>
                                    ) : (
                                      <span className="inline-flex items-center gap-0.5 text-emerald-600 font-medium">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Libre
                                      </span>
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ═══ RESUMEN ═══ */}
              {!soloHoy && <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {tipo !== "grupo" && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-green-600 font-medium">Grupos</p>
                    <p className="text-lg font-bold text-green-900">{resumen.grupos.length}</p>
                    <div className="mt-1 space-y-0.5">
                      {resumen.grupos.map((g) => (
                        <p key={g} className="text-xs text-green-700">{g}</p>
                      ))}
                    </div>
                  </div>
                )}
                {tipo !== "instructor" && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-600 font-medium">Instructores</p>
                    <p className="text-lg font-bold text-blue-900">{resumen.instructores.length}</p>
                    <div className="mt-1 space-y-0.5">
                      {resumen.instructores.map((i) => (
                        <p key={i} className="text-xs text-blue-700 truncate">{i}</p>
                      ))}
                    </div>
                  </div>
                )}
                {tipo !== "ambiente" && (
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-purple-600 font-medium">Ambientes</p>
                    <p className="text-lg font-bold text-purple-900">{resumen.ambientes.length}</p>
                    <div className="mt-1 space-y-0.5">
                      {resumen.ambientes.map((a) => (
                        <p key={a} className="text-xs text-purple-700 truncate">{a}</p>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-xs text-orange-600 font-medium">Bloques</p>
                  <p className="text-lg font-bold text-orange-900">{resumen.totalBloques}</p>
                  <p className="text-xs text-orange-500 mt-1">esta semana</p>
                </div>
              </div>}
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
