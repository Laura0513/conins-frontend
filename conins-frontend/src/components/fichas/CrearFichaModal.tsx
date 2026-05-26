import { useState } from "react"
import { X, Loader2 } from "lucide-react"

type CrearFichaModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

// Mock data until backend is ready
const PROGRAMAS_MOCK = [
  { id: 1, nombre: "ADSO" },
  { id: 2, nombre: "Calzado" },
  { id: 3, nombre: "Diseño" },
  { id: 4, nombre: "HUI FORMACION" },
]

const INSTRUCTORES_MOCK = [
  { id: 1, nombre: "Carlos Álvarez" },
  { id: 2, nombre: "Ana García" },
  { id: 3, nombre: "Luis Pérez" },
]

const JORNADAS = ["Mañana", "Mixta", "Noche", "Virtual"]
const MODALIDADES = ["Presencial", "Virtual"]
const ETAPAS = ["Lectiva", "Productiva"]

export default function CrearFichaModal({ isOpen, onClose, onSubmit }: CrearFichaModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    numero_ficha: "",
    programa_id: "",
    jornada: "Mañana",
    modalidad: "Presencial",
    etapa: "Lectiva",
    fecha_inicio: "",
    fecha_fin: "",
    lider_ficha_id: "",
    es_lider: false,
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(formData)
      setFormData({
        numero_ficha: "",
        programa_id: "",
        jornada: "Mañana",
        modalidad: "Presencial",
        etapa: "Lectiva",
        fecha_inicio: "",
        fecha_fin: "",
        lider_ficha_id: "",
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
          <h2 className="text-lg font-bold text-gray-900">Registrar ficha</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de ficha</label>
            <input
              type="text"
              required
              value={formData.numero_ficha}
              onChange={(e) => handleChange("numero_ficha", e.target.value)}
              placeholder="2995403"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Programa</label>
            <select
              required
              value={formData.programa_id}
              onChange={(e) => handleChange("programa_id", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="">Seleccionar programa</option>
              {PROGRAMAS_MOCK.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jornada</label>
            <div className="flex flex-wrap gap-4">
              {JORNADAS.map((j) => (
                <label key={j} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="jornada"
                    value={j}
                    checked={formData.jornada === j}
                    onChange={(e) => handleChange("jornada", e.target.value)}
                    className="w-4 h-4 text-sena border-gray-300 focus:ring-sena"
                  />
                  <span className="text-sm text-gray-700">{j}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Modalidad</label>
            <div className="flex gap-4">
              {MODALIDADES.map((m) => (
                <label key={m} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="modalidad"
                    value={m}
                    checked={formData.modalidad === m}
                    onChange={(e) => handleChange("modalidad", e.target.value)}
                    className="w-4 h-4 text-sena border-gray-300 focus:ring-sena"
                  />
                  <span className="text-sm text-gray-700">{m}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Etapa</label>
            <div className="flex gap-4">
              {ETAPAS.map((e) => (
                <label key={e} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="etapa"
                    value={e}
                    checked={formData.etapa === e}
                    onChange={(ev) => handleChange("etapa", ev.target.value)}
                    className="w-4 h-4 text-sena border-gray-300 focus:ring-sena"
                  />
                  <span className="text-sm text-gray-700">{e}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
              <input
                type="date"
                value={formData.fecha_inicio}
                onChange={(e) => handleChange("fecha_inicio", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
              <input
                type="date"
                value={formData.fecha_fin}
                onChange={(e) => handleChange("fecha_fin", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Líder de ficha</label>
            <select
              value={formData.lider_ficha_id}
              onChange={(e) => handleChange("lider_ficha_id", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="">Seleccionar líder</option>
              {INSTRUCTORES_MOCK.map((i) => (
                <option key={i.id} value={i.id}>{i.nombre}</option>
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
              <span className="text-sm font-medium text-gray-700">Es líder de esta ficha</span>
              <p className="text-xs text-gray-500">Función administrativa. No modifica permisos del instructor.</p>
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
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
