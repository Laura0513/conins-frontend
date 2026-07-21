import { useState, useEffect } from "react"
import { X, Loader2, Clock, User, BookOpen, Hash } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"

type Horario = {
  id: number
  ficha_numero: string
  instructor_nombre: string
  competencia: string
  ambiente: string
  jornada: string
  tipo_actividad?: string | null
  dias: string[]
  horas: string
  estado: string
  activo: boolean
  dia_semana?: number
  hora_inicio?: string
  hora_fin?: string
  jornada_id?: number
  ambiente_id?: number | null
  tipo_actividad_id?: number | null
}

type Ambiente = {
  id: number
  nombre: string
}

type TipoActividad = {
  id: number
  nombre: string
  suma_carga_horaria: boolean
  requiere_ficha: boolean
  requiere_ambiente: boolean
  requiere_competencia: boolean
}

type EditarHorarioModalProps = {
  isOpen: boolean
  onClose: () => void
  horario: Horario | null
  onSubmit: (data: any) => Promise<void>
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

export default function EditarHorarioModal({ isOpen, onClose, horario, onSubmit }: EditarHorarioModalProps) {
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [ambientes, setAmbientes] = useState<Ambiente[]>([])
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([])
  const [loading, setLoading] = useState(false)
  
  // El backend devuelve días como ["Lun", "Mar"], necesitamos mapear a IDs para el formulario
  // Pero para edición simple, asumimos que el horario tiene un solo bloque o tomamos el primero.
  // Para simplificar, permitimos cambiar el día y la hora.
  
  const [formData, setFormData] = useState({
    dia_ids: [] as number[],
    hora_inicio: "",
    hora_fin: "",
    jornada_id: "",
    ambiente_id: "",
    tipo_actividad_id: "",
  })

  useEffect(() => {
    if (isOpen && horario) {
      setLoading(true)
      Promise.all([
        api.ambientes.getAll().then((res) => setAmbientes(res.data || [])),
        api.catalogo.getTiposActividad().then((res) => setTiposActividad(res.data || [])),
      ]).finally(() => setLoading(false))

      // Mapear días del string a IDs
      const selectedDayIds: number[] = []
      if (horario.dias && horario.dias.length > 0) {
        horario.dias.forEach(diaNombre => {
          const diaObj = DIAS_SEMANA.find(d => d.nombre === diaNombre)
          if (diaObj) selectedDayIds.push(diaObj.id)
        })
      }

      let horaInicio = ""
      let horaFin = ""
      if (horario.horas) {
        const partes = horario.horas.split(" - ")
        if (partes.length === 2) {
          horaInicio = partes[0]
          horaFin = partes[1]
        }
      }

      let jornadaId = ""
      const jornadaObj = JORNADAS.find(j => j.nombre === horario.jornada)
      if (jornadaObj) jornadaId = String(jornadaObj.id)

      setFormData({
        dia_ids: selectedDayIds,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        jornada_id: jornadaId,
        ambiente_id: horario.ambiente_id ? String(horario.ambiente_id) : "",
        tipo_actividad_id: horario.tipo_actividad_id ? String(horario.tipo_actividad_id) : "",
      })
    }
  }, [isOpen, horario])

  if (!isOpen || !horario) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.dia_ids.length === 0) {
      showToast("Selecciona al menos un día", "error")
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        dia_ids: formData.dia_ids,
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin,
        jornada_id: Number(formData.jornada_id),
        ambiente_id: formData.ambiente_id ? Number(formData.ambiente_id) : null,
        tipo_actividad_id: formData.tipo_actividad_id ? Number(formData.tipo_actividad_id) : null,
      }
      await onSubmit(payload)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleDay = (diaId: number) => {
    setFormData(prev => ({
      ...prev,
      dia_ids: prev.dia_ids.includes(diaId)
        ? prev.dia_ids.filter(id => id !== diaId)
        : [...prev.dia_ids, diaId].sort()
    }))
  }

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Editar horario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Info de solo lectura */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{horario.instructor_nombre}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Hash className="w-4 h-4 text-gray-400" />
              <span>Grupo {horario.ficha_numero}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <BookOpen className="w-4 h-4 text-gray-400" />
              <span>{horario.competencia}</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-4 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Cargando...
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Días de la semana <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDay(d.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                        formData.dia_ids.includes(d.id)
                          ? "bg-gray-800 text-white border-gray-800"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {d.nombre}
                    </button>
                  ))}
                </div>
                {formData.dia_ids.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Selecciona al menos un día</p>
                )}
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
                  <option value="">Usar ambiente del grupo</option>
                  {ambientes.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de actividad</label>
                <select
                  value={formData.tipo_actividad_id}
                  onChange={(e) => handleChange("tipo_actividad_id", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                >
                  <option value="">Sin clasificar</option>
                  {tiposActividad.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
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
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
