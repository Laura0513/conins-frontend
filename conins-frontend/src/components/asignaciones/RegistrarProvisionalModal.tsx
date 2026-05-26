import { useState } from "react"
import { X, Loader2, AlertCircle } from "lucide-react"

type RegistrarProvisionalModalProps = {
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
]

const AUTORIZADORES_MOCK = [
  { id: 1, nombre: "Dyron Ramírez" },
  { id: 2, nombre: "Coordinador Técnico" },
]

export default function RegistrarProvisionalModal({ isOpen, onClose, onSubmit }: RegistrarProvisionalModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    instructor_id: "",
    tipo: "ficha",
    ficha_o_programa_id: "",
    autorizado_por_id: "",
    fecha_autorizacion: "",
    motivo: "",
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(formData)
      setFormData({
        instructor_id: "",
        tipo: "ficha",
        ficha_o_programa_id: "",
        autorizado_por_id: "",
        fecha_autorizacion: "",
        motivo: "",
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Registrar provisional</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipo"
                  value="ficha"
                  checked={formData.tipo === "ficha"}
                  onChange={(e) => handleChange("tipo", e.target.value)}
                  className="w-4 h-4 text-sena border-gray-300 focus:ring-sena"
                />
                <span className="text-sm text-gray-700">Por ficha</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipo"
                  value="programa"
                  checked={formData.tipo === "programa"}
                  onChange={(e) => handleChange("tipo", e.target.value)}
                  className="w-4 h-4 text-sena border-gray-300 focus:ring-sena"
                />
                <span className="text-sm text-gray-700">Por programa</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ficha o programa</label>
            <select
              required
              value={formData.ficha_o_programa_id}
              onChange={(e) => handleChange("ficha_o_programa_id", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="">Seleccionar</option>
              {FICHAS_MOCK.map((f) => (
                <option key={f.id} value={f.id}>{f.numero}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Autorizado por</label>
            <select
              required
              value={formData.autorizado_por_id}
              onChange={(e) => handleChange("autorizado_por_id", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="">Seleccionar</option>
              {AUTORIZADORES_MOCK.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha autorización</label>
            <input
              type="date"
              required
              value={formData.fecha_autorizacion}
              onChange={(e) => handleChange("fecha_autorizacion", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <textarea
              rows={3}
              required
              value={formData.motivo}
              onChange={(e) => handleChange("motivo", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 resize-none"
              placeholder="Justificación de la asignación provisional..."
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              Quedará registrada con trazabilidad completa.
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
              Registrar provisional
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
