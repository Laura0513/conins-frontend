import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import {
  X,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  CheckCheck,
} from "lucide-react"

type RapSeguimiento = {
  id: number
  asignacion_competencia_id: number
  rap_id: number
  rap_nombre: string
  rap_codigo: string
  competencia: string
  instructor_nombre?: string
  fecha_inicio: string | null
  fecha_fin_programada: string | null
  estado_evaluacion: "pendiente_por_evaluar" | "evaluado"
  estado_aprobacion: "aprobado" | "no_aprobado" | null
  activo: boolean
}

type Props = {
  isOpen: boolean
  onClose: () => void
  fichaId: number | null
  fichaNumero: string
  puedeEditar: boolean
  onToast: (msg: string, tipo: "success" | "error") => void
}

function EstadoBadge({ seg }: { seg: RapSeguimiento }) {
  if (seg.estado_evaluacion === "evaluado") {
    if (seg.estado_aprobacion === "aprobado") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          Aprobado
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3 h-3" />
        No aprobado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      <Clock className="w-3 h-3" />
      Pendiente
    </span>
  )
}

export default function RapSeguimientoModal({
  isOpen,
  onClose,
  fichaId,
  fichaNumero,
  puedeEditar,
  onToast,
}: Props) {
  const [seguimientos, setSeguimientos] = useState<RapSeguimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedComps, setExpandedComps] = useState<Set<string>>(new Set())
  const [aprobandoTodos, setAprobandoTodos] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && fichaId) {
      cargarDatos()
    }
  }, [isOpen, fichaId])

  const cargarDatos = async () => {
    if (!fichaId) return
    setLoading(true)
    try {
      const res = await api.rapSeguimiento.getByFicha(fichaId)
      setSeguimientos(res.data || [])

      // Expandir todas las competencias
      const comps = new Set<string>()
      ;(res.data || []).forEach((s: RapSeguimiento) => comps.add(s.competencia))
      setExpandedComps(comps)
    } catch (err) {
      console.warn("Error cargando RAPs:", err)
      setSeguimientos([])
    } finally {
      setLoading(false)
    }
  }

  const toggleComp = (comp: string) => {
    setExpandedComps((prev) => {
      const next = new Set(prev)
      if (next.has(comp)) next.delete(comp)
      else next.add(comp)
      return next
    })
  }

  const handleEvaluar = async (segId: number, estado: "aprobado" | "no_aprobado") => {
    try {
      await api.rapSeguimiento.evaluar(segId, estado)
      onToast(`RAP marcado como ${estado === "aprobado" ? "aprobado" : "no aprobado"}`, "success")
      cargarDatos()
    } catch (err: any) {
      onToast(err.message || "Error al evaluar RAP", "error")
    }
  }

  const handleAprobarTodos = async (competencia: string) => {
    const pendientes = seguimientos.filter(
      (s) => s.competencia === competencia && s.estado_evaluacion === "pendiente_por_evaluar" && s.activo
    )
    if (pendientes.length === 0) return

    setAprobandoTodos(competencia)
    try {
      for (const seg of pendientes) {
        await api.rapSeguimiento.evaluar(seg.id, "aprobado")
      }
      onToast(`${pendientes.length} RAPs aprobados en ${competencia}`, "success")
      cargarDatos()
    } catch (err: any) {
      onToast(err.message || "Error al aprobar RAPs", "error")
    } finally {
      setAprobandoTodos(null)
    }
  }

  if (!isOpen || !fichaId) return null

  // Agrupar por competencia
  const porCompetencia: Record<string, RapSeguimiento[]> = {}
  seguimientos.forEach((s) => {
    if (!porCompetencia[s.competencia]) porCompetencia[s.competencia] = []
    porCompetencia[s.competencia].push(s)
  })

  const totalRaps = seguimientos.length
  const aprobados = seguimientos.filter((s) => s.estado_aprobacion === "aprobado").length
  const pendientes = seguimientos.filter((s) => s.estado_evaluacion === "pendiente_por_evaluar").length
  const noAprobados = seguimientos.filter((s) => s.estado_aprobacion === "no_aprobado").length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Evaluación de RAPs</h2>
            <p className="text-sm text-gray-500">Grupo {fichaNumero}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen */}
        {!loading && totalRaps > 0 && (
          <div className="px-6 pt-4 pb-2 flex gap-3 flex-wrap shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500">Total:</span>
              <span className="text-sm font-semibold text-gray-900">{totalRaps}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg">
              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
              <span className="text-sm font-semibold text-green-700">{aprobados}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-yellow-600" />
              <span className="text-sm font-semibold text-yellow-700">{pendientes}</span>
            </div>
            {noAprobados > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-lg">
                <XCircle className="w-3.5 h-3.5 text-red-600" />
                <span className="text-sm font-semibold text-red-700">{noAprobados}</span>
              </div>
            )}
            {totalRaps > 0 && (
              <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-sena/5 rounded-lg">
                <span className="text-xs text-gray-500">Progreso:</span>
                <span className="text-sm font-semibold text-sena">
                  {Math.round((aprobados / totalRaps) * 100)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Contenido */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-sena mb-2" />
              <p>Cargando RAPs...</p>
            </div>
          ) : totalRaps === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p>No hay RAPs registrados para este grupo.</p>
              <p className="text-xs mt-1">Los seguimientos se crean automáticamente al asignar competencias.</p>
            </div>
          ) : (
            Object.entries(porCompetencia).map(([comp, raps]) => {
              const isExpanded = expandedComps.has(comp)
              const compAprobados = raps.filter((r) => r.estado_aprobacion === "aprobado").length
              const compPendientes = raps.filter((r) => r.estado_evaluacion === "pendiente_por_evaluar" && r.activo).length

              return (
                <div key={comp} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <button
                      onClick={() => toggleComp(comp)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{comp}</p>
                        <p className="text-xs text-gray-500">
                          {compAprobados}/{raps.length} aprobados
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-3">
                      {/* Barra de progreso */}
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sena rounded-full transition-all"
                            style={{ width: `${raps.length > 0 ? (compAprobados / raps.length) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">
                          {raps.length > 0 ? Math.round((compAprobados / raps.length) * 100) : 0}%
                        </span>
                      </div>

                      {/* Aprobar todos */}
                      {puedeEditar && compPendientes > 0 && (
                        <button
                          onClick={() => handleAprobarTodos(comp)}
                          disabled={aprobandoTodos === comp}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-sena bg-sena/10 hover:bg-sena/20 rounded-lg transition-colors disabled:opacity-50"
                          title={`Aprobar ${compPendientes} RAPs pendientes`}
                        >
                          {aprobandoTodos === comp ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCheck className="w-3.5 h-3.5" />
                          )}
                          Aprobar todos ({compPendientes})
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="divide-y divide-gray-100">
                      {raps.map((seg) => (
                        <div
                          key={seg.id}
                          className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            !seg.activo ? "opacity-50" : ""
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono text-sena bg-sena/10 px-2 py-0.5 rounded">
                                {seg.rap_codigo}
                              </span>
                              <EstadoBadge seg={seg} />
                            </div>
                            <p className="text-sm text-gray-700 mt-1 line-clamp-2">{seg.rap_nombre}</p>
                            {seg.instructor_nombre && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                Instructor: {seg.instructor_nombre}
                              </p>
                            )}
                          </div>

                          {/* Acciones de evaluación */}
                          {puedeEditar && seg.activo && seg.estado_evaluacion === "pendiente_por_evaluar" && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleEvaluar(seg.id, "aprobado")}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Aprobar
                              </button>
                              <button
                                onClick={() => handleEvaluar(seg.id, "no_aprobado")}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                No aprobar
                              </button>
                            </div>
                          )}

                          {/* Re-evaluar */}
                          {puedeEditar && seg.activo && seg.estado_evaluacion === "evaluado" && (
                            <div className="flex items-center gap-2 shrink-0">
                              {seg.estado_aprobacion === "no_aprobado" && (
                                <button
                                  onClick={() => handleEvaluar(seg.id, "aprobado")}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Aprobar
                                </button>
                              )}
                              {seg.estado_aprobacion === "aprobado" && (
                                <button
                                  onClick={() => handleEvaluar(seg.id, "no_aprobado")}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Revertir
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
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
