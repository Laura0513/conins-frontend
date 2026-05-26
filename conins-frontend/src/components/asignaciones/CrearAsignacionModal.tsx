import { useState } from "react"
import { X, Loader2 } from "lucide-react"

type CrearAsignacionModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

// Mock data
const INSTRUCTORES_MOCK = [
  { id: 1, nombre: "Carlos Álvarez" },
  { id: 2, nombre: "Ana García" },
  { id: 3, nombre: "Luis Pérez" },
]

const FICHAS_MOCK = [
  { id: 1, numero: "2995403", programa: "ADSO" },
  { id: 2, numero: "2887341", programa: "Calzado" },
  { id: 3, numero: "3012456", programa: "Diseño" },
]

const COMPETENCIAS_MOCK = [
  { id: 1, nombre: "Bases de datos" },
  { id: 2, nombre: "Contabilidad general" },
  { id: 3, nombre: "Logística inversa" },
]

const AMBIENTES_MOCK = [
  { id: 0, nombre: "Sin asignar" },
  { id: 1, nombre: "Aula 203" },
  { id: 2, nombre: "Aula 207" },
  { id: 3, nombre: "Taller T2" },
]

export default function CrearAsignacionModal({ isOpen, onClose, onSubmit }: CrearAsignacionModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    instructor_id: "",
    ficha_id: "",
    competencia_id: "",
    ambiente_id: "",
    es_lider: false,
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(formData)
      setFormData({
        instructor_id: "",
        ficha_id: "",
        competencia_id: "",
        ambiente_id: "",
        es_lider: false,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Asignar competencia</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Ficha</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Competencia</label>
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

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleChange("es_lider", !formData.es_lider)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.es_lider ? "bg-sena" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.es_lider ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <div>
              <span className="text-sm font-medium text-gray-700">¿Es líder de esta ficha?</span>
              <p className="text-xs text-gray-500">Función administrativa. No modifica permisos.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente (opcional)</label>
            <select
              value={formData.ambiente_id}
              onChange={(e) => handleChange("ambiente_id", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              {AMBIENTES_MOCK.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
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
              Asignar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
