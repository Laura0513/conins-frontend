import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"

type Usuario = {
  id: number
  nombre: string
  email: string
  rol: string
  tipo_documento?: string
  documento?: string
}

type EditarUsuarioModalProps = {
  isOpen: boolean
  onClose: () => void
  usuario: Usuario | null
  onSubmit: (data: { nombre: string; email: string; rol: string; tipo_documento: string; documento: string }) => Promise<void>
}

export default function EditarUsuarioModal({ isOpen, onClose, usuario, onSubmit }: EditarUsuarioModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    rol: "Instructor",
    tipo_documento: "cc",
    documento: "",
  })

  useEffect(() => {
    if (isOpen && usuario) {
      setFormData({
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        tipo_documento: usuario.tipo_documento || "cc",
        documento: usuario.documento || "",
      })
    }
  }, [isOpen, usuario])

  if (!isOpen || !usuario) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Editar usuario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input
              name="nombre"
              type="text"
              required
              value={formData.nombre}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de documento</label>
              <select
                name="tipo_documento"
                value={formData.tipo_documento}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
              >
                <option value="cc">Cédula de Ciudadanía</option>
                <option value="ce">Cédula de Extranjería</option>
                <option value="ti">Tarjeta de Identidad</option>
                <option value="pasaporte">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de documento</label>
              <input
                name="documento"
                type="text"
                required
                value={formData.documento}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                placeholder="1234567890"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              name="rol"
              value={formData.rol}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="Instructor">Instructor</option>
              
              <option value="Coordinadora Academica">Coordinadora Academica</option>
              <option value="Asistente Coordinacion">Asistente Coordinacion</option>
              <option value="Subdirector">Subdirector</option>
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
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
