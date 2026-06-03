import { useState, useEffect } from "react"
import { X, Loader2, Clock, User, BookOpen, Hash } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"

type CrearHorarioModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

type Asignacion = {
  id: number
  instructor_nombre: string
  ficha_numero: string
  competencia: string
  instructor_id: number
  ficha_id: number
  competencia_id: number
  ambiente_id: number | null
}

type Ambiente = {
  id: number
  nombre: string
}

const JORNADAS = [
  { id: 1, nombre: "Mañana" },
  { id: 2, nombre: "Mixta" },
  { id: 3, nombre: "Noche" },
  { id: 4, nombre: "Virtual" },
]

const DIAS_SEMANA = [
  { id: 1, nombre: "Lun" },
  { id: 2, nombre: "Mar" },
  { id: 3, nombre: "Mié" },
  { id: 4, nombre: "Jue" },
  { id: 5, nombre: "Vie" },
  { id: 6, nombre: "Sáb" },
]

export default function CrearHorarioModal({ isOpen, onClose, onSubmit }: CrearHorarioModalProps) {
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [ambientes, setAmbientes] = useState<Ambiente[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    asignacion_id: "",
    dias: [] as number[],
    hora_inicio: "",
    hora_fin: "",
    jornada_id: "",
    ambiente_id: "",
  })

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      Promise.all([
        api.assignments.getAll().then((res) => setAsignaciones(res.data || [])).catch(() => setAsignaciones([])),
        api.ambientes.getAll().then((res) => setAmbientes(res.data || [])).catch(() => setAmbientes([])),
      ]).finally(() => setLoading(false))
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const selected = asignaciones.find((a) => a.id === Number(formData.asignacion_id))
      if (!selected) return

      const finalAmbienteId = formData.ambiente_id ? Number(formData.ambiente_id) : selected.ambiente_id

      if (!finalAmbienteId) {
        showToast("Esta ficha no tiene un ambiente asignado. Por favor selecciona uno manualmente.", "error")
        setSubmitting(false)
        return
      }

      const now = new Date()
      const day = now.getDay()
      const diff = day === 0 ? -6 : 1 - day
      const lunes = new Date(now)
      lunes.setDate(now.getDate() + diff)
      const semana = lunes.toISOString().split('T')[0]

      const payload = {
        ficha_id: selected.ficha_id,
        instructor_id: selected.instructor_id,
        competencia_id: selected.competencia_id,
        dias: formData.dias,
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin,
        jornada_id: Number(formData.jornada_id),
        ambiente_id: finalAmbienteId,
      }
      await onSubmit(payload)
      setFormData({
        asignacion_id: "",
        dias: [],
        hora_inicio: "",
        hora_fin: "",
        jornada_id: "",
        ambiente_id: "",
      })
    } catch (err: any) {
      showToast(err.message || "Error al registrar horario", "error")
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const toggleDia = (id: number) => {
    const nuevosDias = formData.dias.includes(id)
      ? formData.dias.filter((d) => d !== id)
      : [...formData.dias, id]
    setFormData({ ...formData, dias: nuevosDias })
  }

  const selectedAsignacion = asignaciones.find((a) => a.id === Number(formData.asignacion_id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Registrar horario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Cargando asignaciones...
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asignación activa <span className="text-red-500">*</span></label>
                <select
                  required
                  value={formData.asignacion_id}
                  onChange={(e) => handleChange("asignacion_id", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                >
                  <option value="">Seleccionar asignación</option>
                  {asignaciones.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.instructor_nombre} — Ficha {a.ficha_numero} — {a.competencia}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Selecciona una asignación vigente para crear el horario.</p>
              </div>

              {selectedAsignacion && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{selectedAsignacion.instructor_nombre}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <span>Ficha {selectedAsignacion.ficha_numero}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span>{selectedAsignacion.competencia}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Días de la semana <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDia(d.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                        formData.dias.includes(d.id)
                          ? "bg-gray-800 text-white border-gray-800"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {d.nombre}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jornada <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {JORNADAS.map((j) => (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => handleChange("jornada_id", String(j.id))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        Number(formData.jornada_id) === j.id
                          ? "bg-sena text-white border-sena"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {j.nombre}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    required
                    value={formData.hora_inicio}
                    onChange={(e) => handleChange("hora_inicio", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    required
                    value={formData.hora_fin}
                    onChange={(e) => handleChange("hora_fin", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente</label>
                <select
                  value={formData.ambiente_id}
                  onChange={(e) => handleChange("ambiente_id", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                >
                  <option value="">Sin asignar (usa el de la ficha)</option>
                  {ambientes.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="px-4 py-2.5 bg-sena hover:bg-sena/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
