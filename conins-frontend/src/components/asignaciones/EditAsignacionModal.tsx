import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"

type Asignacion = {
  id: number
  instructor_nombre: string
  ficha_numero: string
  competencia: string
  ambiente: string
  jornada: string
  es_lider: boolean
  tipo: "activa" | "provisional" | "historica"
}

type EditAsignacionModalProps = {
  isOpen: boolean
  onClose: () => void
  asignacion: Asignacion | null
  onSubmit: (data: Partial<Asignacion>) => Promise<void>
}

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

export default function EditAsignacionModal({ isOpen, onClose, asignacion, onSubmit }: EditAsignacionModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    competencia: "",
    ambiente: "",
    es_lider: false,
  })

  useEffect(() => {
    if (asignacion) {
      setFormData({
        competencia: asignacion.competencia,
        ambiente: asignacion.ambiente,
        es_lider: asignacion.es_lider,
      })
    }
  }, [asignacion])

  if (!isOpen || !asignacion) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(formData)
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
          <h2 className="text-lg font-bold text-gray-900">Editar asignación</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sena/10 flex items-center justify-center">
              <span className="text-xs font-bold text-sena">{asignacion.instructor_nombre.charAt(0)}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{asignacion.instructor_nombre}</p>
              <p className="text-xs text-gray-500">Ficha {asignacion.ficha_numero}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Competencia</label>
            <select
              required
              value={formData.competencia}
              onChange={(e) => handleChange("competencia", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              {COMPETENCIAS_MOCK.map((c) => (
                <option key={c.id} value={c.nombre}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente</label>
            <select
              value={formData.ambiente}
              onChange={(e) => handleChange("ambiente", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              {AMBIENTES_MOCK.map((a) => (
                <option key={a.id} value={a.nombre}>{a.nombre}</option>
              ))}
            </select>
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
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
