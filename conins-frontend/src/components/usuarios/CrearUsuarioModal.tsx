import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import FormField, { inputClass, selectClass } from "@/components/ui/FormField"

type CrearUsuarioModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { nombre: string; email: string; rol: string; tipo_documento: string; documento: string }) => Promise<void>
}

export default function CrearUsuarioModal({ isOpen, onClose, onSubmit }: CrearUsuarioModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    rol: "Instructor",
    tipo_documento: "cc",
    documento: "",
    cargo: "",
    area: "",
  })

  if (!isOpen) return null

  // Validaciones
  const errors: Record<string, string> = {}
  if (!formData.nombre.trim()) errors.nombre = "El nombre es obligatorio"
  else if (formData.nombre.trim().length < 3) errors.nombre = "Mínimo 3 caracteres"
  if (!formData.email.trim()) errors.email = "El correo es obligatorio"
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Correo no válido"
  if (!formData.documento.trim()) errors.documento = "El documento es obligatorio"
  else if (!/^\d{6,15}$/.test(formData.documento.trim())) errors.documento = "Solo números, entre 6 y 15 dígitos"

  const isValid = Object.keys(errors).length === 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ nombre: true, email: true, documento: true })
    if (!isValid) return
    setSubmitting(true)
    try {
      await onSubmit(formData)
      setFormData({ nombre: "", email: "", rol: "Instructor", tipo_documento: "cc", documento: "", cargo: "", area: "" })
      setTouched({})
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Nuevo usuario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          <FormField label="Nombre completo" required error={touched.nombre ? errors.nombre : undefined}>
            <input
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleChange}
              onBlur={() => handleBlur("nombre")}
              className={inputClass(touched.nombre && !!errors.nombre)}
              placeholder="Ej: Juan Pérez"
            />
          </FormField>

          <FormField label="Correo electrónico" required error={touched.email ? errors.email : undefined}>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur("email")}
              className={inputClass(touched.email && !!errors.email)}
              placeholder="correo@sena.edu.co"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tipo de documento">
              <select
                name="tipo_documento"
                value={formData.tipo_documento}
                onChange={handleChange}
                className={selectClass()}
              >
                <option value="cc">Cédula de Ciudadanía</option>
                <option value="ce">Cédula de Extranjería</option>
                <option value="ti">Tarjeta de Identidad</option>
                <option value="pasaporte">Pasaporte</option>
              </select>
            </FormField>
            <FormField label="Número de documento" required error={touched.documento ? errors.documento : undefined}>
              <input
                name="documento"
                type="text"
                value={formData.documento}
                onChange={handleChange}
                onBlur={() => handleBlur("documento")}
                className={inputClass(touched.documento && !!errors.documento)}
                placeholder="1234567890"
              />
            </FormField>
          </div>

          <FormField label="Rol">
            <select
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              className={selectClass()}
            >
              <option value="Instructor">Instructor</option>
              <option value="Coordinadora Academica">Coordinadora Académica</option>
              <option value="Asistente Coordinacion">Asistente Coordinación</option>
              <option value="Subdirector">Subdirector</option>
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Cargo">
              <input
                name="cargo"
                type="text"
                value={formData.cargo}
                onChange={handleChange}
                className={inputClass()}
                placeholder="Ej: Instructor"
              />
            </FormField>
            <FormField label="Área">
              <select
                name="area"
                value={formData.area}
                onChange={handleChange}
                className={selectClass()}
              >
                <option value="">Seleccionar</option>
                <option value="Tecnica">Técnica</option>
                <option value="Transversal">Transversal</option>
                <option value="Administrativa">Administrativa</option>
              </select>
            </FormField>
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
              disabled={submitting || !isValid}
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
