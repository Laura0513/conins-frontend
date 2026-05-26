import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"

type Instructor = {
  id: number
  nombre: string
  email: string
  tipo_contrato: string
  tipo_area: string
  activo: boolean
  roles: string
  horas_semana?: number
  tiene_novedad?: boolean
}

type EditInstructorModalProps = {
  isOpen: boolean
  onClose: () => void
  instructor: Instructor | null
  onSubmit: (data: Partial<Instructor>) => Promise<void>
}

export default function EditInstructorModal({ isOpen, onClose, instructor, onSubmit }: EditInstructorModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    tipo_contrato: "contratista",
    tipo_area: "tecnica",
  })

  useEffect(() => {
    if (instructor) {
      setFormData({
        nombre: instructor.nombre,
        email: instructor.email,
        tipo_contrato: instructor.tipo_contrato,
        tipo_area: instructor.tipo_area,
      })
    }
  }, [instructor])

  if (!isOpen || !instructor) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Editar instructor</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electronico</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de contrato</label>
              <select
                value={formData.tipo_contrato}
                onChange={(e) => handleChange("tipo_contrato", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
              >
                <option value="contratista">Contratista</option>
                <option value="de_planta">De Planta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de area</label>
              <select
                value={formData.tipo_area}
                onChange={(e) => handleChange("tipo_area", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
              >
                <option value="tecnica">Tecnica</option>
                <option value="transversal">Transversal</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
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
