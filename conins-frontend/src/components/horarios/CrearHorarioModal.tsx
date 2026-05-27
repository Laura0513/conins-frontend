import { useState } from "react"
import { X, Loader2, AlertCircle, Clock } from "lucide-react"

type CrearHorarioModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

// Mock data
const FICHAS_MOCK = [
  { id: 1, numero: "2995403", programa: "ADSO" },
  { id: 2, numero: "2887341", programa: "Calzado" },
]

const INSTRUCTORES_MOCK = [
  { id: 1, nombre: "Carlos Álvarez" },
  { id: 2, nombre: "Andrés Pareja" },
]

const COMPETENCIAS_MOCK = [
  { id: 1, nombre: "Bases de datos" },
  { id: 2, nombre: "Contabilidad básica" },
]

const AMBIENTES_MOCK = [
  { id: 1, nombre: "Aula 203" },
  { id: 2, nombre: "Aula 207" },
  { id: 3, nombre: "Taller T2" },
]

const JORNADAS = ["Mañana", "Mixta", "Noche", "Virtual"]
const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

export default function CrearHorarioModal({ isOpen, onClose, onSubmit }: CrearHorarioModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    ficha_id: "",
    instructor_id: "",
    competencia_id: "",
    jornada: "Mañana",
    dias: [] as string[],
    hora_inicio: "",
    hora_fin: "",
    ambiente_id: "",
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(formData)
      setFormData({
        ficha_id: "",
        instructor_id: "",
        competencia_id: "",
        jornada: "Mañana",
        dias: [],
        hora_inicio: "",
        hora_fin: "",
        ambiente_id: "",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const toggleDia = (dia: string) => {
    const nuevosDias = formData.dias.includes(dia)
      ? formData.dias.filter((d) => d !== dia)
      : [...formData.dias, dia]
    setFormData({ ...formData, dias: nuevosDias })
  }

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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ficha <span className="text-red-500">*</span></label>
            <select
              required
              value={formData.ficha_id}
              onChange={(e) => handleChange("ficha_id", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="">Seleccionar ficha</option>
              {FICHAS_MOCK.map((f) => (
                <option key={f.id} value={f.id}>{f.numero}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructor <span className="text-red-500">*</span></label>
            <select
              required
              value={formData.instructor_id}
              onChange={(e) => handleChange("instructor_id", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="">Seleccionar instructor</option>
              {INSTRUCTORES_MOCK.map((i) => (
                <option key={i.id} value={i.id}>{i.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Competencia <span className="text-red-500">*</span></label>
            <select
              required
              value={formData.competencia_id}
              onChange={(e) => handleChange("competencia_id", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="">Seleccionar competencia</option>
              {COMPETENCIAS_MOCK.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Solo se muestran competencias habilitadas según contrato.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jornada</label>
            <div className="flex flex-wrap gap-2">
              {JORNADAS.map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => handleChange("jornada", j)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    formData.jornada === j
                      ? "bg-sena text-white border-sena"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Días de la semana</label>
            <div className="flex flex-wrap gap-2">
              {DIAS_SEMANA.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDia(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                    formData.dias.includes(d)
                      ? "bg-gray-800 text-white border-gray-800"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
              <div className="relative">
                <input
                  type="time"
                  required
                  value={formData.hora_inicio}
                  onChange={(e) => handleChange("hora_inicio", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                />
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin</label>
              <div className="relative">
                <input
                  type="time"
                  required
                  value={formData.hora_fin}
                  onChange={(e) => handleChange("hora_fin", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                />
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente <span className="text-red-500">*</span></label>
            <select
              required
              value={formData.ambiente_id}
              onChange={(e) => handleChange("ambiente_id", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="">Seleccionar ambiente</option>
              {AMBIENTES_MOCK.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              Este ambiente ya tiene otra ficha en esta jornada. Puede continuar.
            </p>
          </div>

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
              disabled={submitting}
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
