import { useState, useEffect } from "react"
import { X, Loader2, AlertTriangle, Plus, Calendar, FileText } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"

type TipoNovedad = {
  id: number
  nombre: string
  descripcion?: string
}

type Novedad = {
  id: number
  tipo_novedad: string
  tipo_novedad_id: number
  fecha_inicio: string
  fecha_regreso: string
  observacion: string
  activo: boolean
  created_at: string
}

type NovedadFichaModalProps = {
  isOpen: boolean
  onClose: () => void
  ficha: { id: number; numero_ficha: string } | null
  puedeEditar: boolean
}

export default function NovedadFichaModal({ isOpen, onClose, ficha, puedeEditar }: NovedadFichaModalProps) {
  const { showToast } = useToast()
  const [novedades, setNovedades] = useState<Novedad[]>([])
  const [tiposNovedad, setTiposNovedad] = useState<TipoNovedad[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState({
    tipo_novedad_id: 0,
    fecha_inicio: "",
    fecha_regreso: "",
    observacion: "",
  })

  useEffect(() => {
    if (isOpen && ficha) {
      setShowForm(false)
      setFormData({ tipo_novedad_id: 0, fecha_inicio: "", fecha_regreso: "", observacion: "" })
      cargarDatos()
    }
  }, [isOpen, ficha])

  const cargarDatos = async () => {
    if (!ficha) return
    setLoading(true)
    try {
      const [novedadesRes, tiposRes] = await Promise.allSettled([
        api.fichas.getNovedades(ficha.id),
        api.catalogo.getTiposNovedadFicha(),
      ])

      if (novedadesRes.status === "fulfilled") {
        setNovedades(novedadesRes.value.data || [])
      } else {
        setNovedades([])
      }

      if (tiposRes.status === "fulfilled") {
        const tipos = tiposRes.value.data || []
        setTiposNovedad(tipos)
        if (tipos.length > 0) {
          setFormData(prev => ({ ...prev, tipo_novedad_id: tipos[0].id }))
        }
      }
    } catch {
      setNovedades([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ficha) return

    if (!formData.fecha_inicio || !formData.fecha_regreso) {
      showToast("Las fechas son obligatorias", "error")
      return
    }

    setSubmitting(true)
    try {
      await api.fichas.crearNovedad(ficha.id, formData)
      showToast("Novedad registrada exitosamente", "success")
      setShowForm(false)
      setFormData({ tipo_novedad_id: tiposNovedad[0]?.id || 0, fecha_inicio: "", fecha_regreso: "", observacion: "" })
      cargarDatos()
    } catch (err: any) {
      showToast(err.message || "Error al registrar novedad", "error")
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (novedad: Novedad) => {
    if (!ficha) return
    try {
      await api.fichas.toggleNovedad(ficha.id, novedad.id)
      showToast(novedad.activo ? "Novedad desactivada" : "Novedad reactivada", "success")
      cargarDatos()
    } catch (err: any) {
      showToast(err.message || "Error al cambiar estado", "error")
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
  }

  const isVigente = (novedad: Novedad) => {
    if (!novedad.activo) return false
    const hoy = new Date()
    const regreso = new Date(novedad.fecha_regreso)
    return hoy <= regreso
  }

  if (!isOpen || !ficha) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Novedades de ficha</h2>
            <p className="text-sm text-gray-500">Ficha {ficha.numero_ficha}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Alerta informativa */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800 leading-relaxed">
              La ficha queda excluida de nuevas asignaciones de horarios mientras una novedad este vigente.
            </p>
          </div>

          {/* Botón nueva novedad */}
          {puedeEditar && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl py-4 text-sm font-medium text-gray-500 hover:border-sena hover:text-sena transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Registrar nueva novedad
            </button>
          )}

          {/* Formulario */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-6 space-y-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Nueva novedad</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de novedad</label>
                <select
                  value={formData.tipo_novedad_id}
                  onChange={(e) => setFormData({ ...formData, tipo_novedad_id: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                >
                  {tiposNovedad.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.descripcion || tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha inicio</label>
                  <input
                    type="date"
                    required
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha est. de regreso</label>
                  <input
                    type="date"
                    required
                    value={formData.fecha_regreso}
                    onChange={(e) => setFormData({ ...formData, fecha_regreso: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Observacion (opcional)</label>
                <textarea
                  rows={2}
                  value={formData.observacion}
                  onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 resize-none"
                  placeholder="Motivo o detalles adicionales..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2.5 bg-sena hover:bg-sena/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Registrar
                </button>
              </div>
            </form>
          )}

          {/* Lista de novedades */}
          {loading ? (
            <div className="py-8 flex flex-col items-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin text-sena mb-2" />
              <p className="text-sm">Cargando novedades...</p>
            </div>
          ) : novedades.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay novedades registradas para esta ficha.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {novedades.map((novedad) => (
                <div
                  key={novedad.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    isVigente(novedad)
                      ? "border-yellow-200 bg-yellow-50/50"
                      : novedad.activo
                      ? "border-gray-200 bg-white"
                      : "border-gray-100 bg-gray-50 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {novedad.tipo_novedad || `Tipo ${novedad.tipo_novedad_id}`}
                        </span>
                        {isVigente(novedad) && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Vigente
                          </span>
                        )}
                        {!novedad.activo && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            Inactiva
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(novedad.fecha_inicio)} — {formatDate(novedad.fecha_regreso)}
                        </span>
                      </div>
                      {novedad.observacion && (
                        <p className="text-sm text-gray-600 mt-1">{novedad.observacion}</p>
                      )}
                    </div>

                    {puedeEditar && novedad.activo && (
                      <button
                        onClick={() => handleToggle(novedad)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0"
                      >
                        Desactivar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
