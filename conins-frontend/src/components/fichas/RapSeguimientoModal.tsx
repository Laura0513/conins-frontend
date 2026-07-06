import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import {
  X,
  Loader2,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
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

type RapDisponible = {
  asignacion_competencia_id: number
  competencia: string
  rap_id: number
  rap_codigo: string
  rap_nombre: string
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

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
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
  const [disponibles, setDisponibles] = useState<RapDisponible[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedComps, setExpandedComps] = useState<Set<string>>(new Set())
  const [showCrear, setShowCrear] = useState(false)
  const [crearForm, setCrearForm] = useState({
    selectedIndex: -1,
    fecha_inicio: "",
    fecha_fin_programada: "",
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && fichaId) {
      cargarDatos()
    }
  }, [isOpen, fichaId])

  const cargarDatos = async () => {
    if (!fichaId) return
    setLoading(true)
    try {
      const [segRes, dispRes] = await Promise.all([
        api.rapSeguimiento.getByFicha(fichaId),
        puedeEditar ? api.rapSeguimiento.getDisponibles(fichaId) : Promise.resolve({ data: [] }),
      ])
      setSeguimientos(segRes.data || [])
      setDisponibles(dispRes.data || [])

      // Expandir todas las competencias por defecto
      const comps = new Set<string>()
      ;(segRes.data || []).forEach((s: RapSeguimiento) => comps.add(s.competencia))
      setExpandedComps(comps)
    } catch (err) {
      console.warn("Error cargando RAPs:", err)
      setSeguimientos([])
      setDisponibles([])
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

  const handleCrear = async () => {
    if (crearForm.selectedIndex < 0) return
    const rap = disponibles[crearForm.selectedIndex]
    if (!rap) return

    setSubmitting(true)
    try {
      await api.rapSeguimiento.create({
        asignacion_competencia_id: rap.asignacion_competencia_id,
        rap_id: rap.rap_id,
        fecha_inicio: crearForm.fecha_inicio || null,
        fecha_fin_programada: crearForm.fecha_fin_programada || null,
      })
      onToast("Seguimiento RAP creado exitosamente", "success")
      setShowCrear(false)
      setCrearForm({ selectedIndex: -1, fecha_inicio: "", fecha_fin_programada: "" })
      cargarDatos()
    } catch (err: any) {
      onToast(err.message || "Error al crear seguimiento", "error")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen || !fichaId) return null

  // Agrupar seguimientos por competencia
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
            <h2 className="text-lg font-bold text-gray-900">Seguimiento RAPs</h2>
            <p className="text-sm text-gray-500">Ficha {fichaNumero}</p>
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
          ) : totalRaps === 0 && disponibles.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p>No hay RAPs registrados ni disponibles para esta ficha.</p>
              <p className="text-xs mt-1">Primero debe haber asignaciones con competencias asociadas.</p>
            </div>
          ) : (
            <>
              {/* Lista agrupada por competencia */}
              {Object.entries(porCompetencia).map(([comp, raps]) => {
                const isExpanded = expandedComps.has(comp)
                const compAprobados = raps.filter((r) => r.estado_aprobacion === "aprobado").length

                return (
                  <div key={comp} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleComp(comp)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{comp}</p>
                          <p className="text-xs text-gray-500">
                            {compAprobados}/{raps.length} RAPs aprobados
                          </p>
                        </div>
                      </div>
                      {/* Mini barra de progreso */}
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
                    </button>

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
                              <div className="flex gap-4 mt-1.5 text-xs text-gray-400">
                                <span>Inicio: {formatDate(seg.fecha_inicio)}</span>
                                <span>Fin prog.: {formatDate(seg.fecha_fin_programada)}</span>
                              </div>
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
                                  title="Aprobar RAP"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Aprobar
                                </button>
                                <button
                                  onClick={() => handleEvaluar(seg.id, "no_aprobado")}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                  title="No aprobar RAP"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  No aprobar
                                </button>
                              </div>
                            )}

                            {/* Re-evaluar si ya fue evaluado */}
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
              })}

              {/* Empty state cuando hay disponibles pero no seguimientos */}
              {totalRaps === 0 && disponibles.length > 0 && (
                <div className="py-8 text-center text-gray-500">
                  <p>No hay seguimientos registrados aun.</p>
                  <p className="text-xs mt-1">
                    Hay {disponibles.length} RAP(s) disponibles para registrar.
                  </p>
                </div>
              )}

              {/* Formulario crear seguimiento */}
              {puedeEditar && disponibles.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowCrear(!showCrear)}
                    className="w-full flex items-center gap-2 p-4 bg-sena/5 hover:bg-sena/10 transition-colors text-left"
                  >
                    <Plus className="w-4 h-4 text-sena" />
                    <span className="text-sm font-medium text-sena">
                      Registrar seguimiento RAP ({disponibles.length} disponibles)
                    </span>
                  </button>

                  {showCrear && (
                    <div className="p-4 space-y-4 border-t border-gray-100">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          RAP a registrar
                        </label>
                        <select
                          value={crearForm.selectedIndex}
                          onChange={(e) =>
                            setCrearForm({ ...crearForm, selectedIndex: Number(e.target.value) })
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena bg-white"
                        >
                          <option value={-1}>Seleccione un RAP...</option>
                          {disponibles.map((d, i) => (
                            <option key={`${d.asignacion_competencia_id}-${d.rap_id}`} value={i}>
                              [{d.rap_codigo}] {d.rap_nombre} — {d.competencia}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Fecha inicio (opcional)
                          </label>
                          <input
                            type="date"
                            value={crearForm.fecha_inicio}
                            onChange={(e) =>
                              setCrearForm({ ...crearForm, fecha_inicio: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Fecha fin programada (opcional)
                          </label>
                          <input
                            type="date"
                            value={crearForm.fecha_fin_programada}
                            onChange={(e) =>
                              setCrearForm({ ...crearForm, fecha_fin_programada: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => {
                            setShowCrear(false)
                            setCrearForm({ selectedIndex: -1, fecha_inicio: "", fecha_fin_programada: "" })
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleCrear}
                          disabled={crearForm.selectedIndex < 0 || submitting}
                          className="px-4 py-2 bg-sena hover:bg-sena/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                          Registrar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
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
