import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import FormField, { inputClass, selectClass } from "@/components/ui/FormField"

type CreateInstructorModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { nombre: string; email: string; tipo_area: string }) => Promise<void>
}

export default function CreateInstructorModal({ isOpen, onClose, onSubmit }: CreateInstructorModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    tipo_area: "tecnica",
  })

  if (!isOpen) return null

  // Validaciones
  const errors: Record<string, string> = {}
  if (!formData.nombre.trim()) errors.nombre = "El nombre es obligatorio"
  else if (formData.nombre.trim().length < 3) errors.nombre = "Mínimo 3 caracteres"
  if (!formData.email.trim()) errors.email = "El correo es obligatorio"
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Correo no válido"
  else if (!formData.email.endsWith("@sena.edu.co") && !formData.email.endsWith("@misena.edu.co"))
    errors.email = "Debe ser un correo @sena.edu.co o @misena.edu.co"

  const isValid = Object.keys(errors).length === 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ nombre: true, email: true })
    if (!isValid) return
    setSubmitting(true)
    try {
      await onSubmit(formData)
      setFormData({ nombre: "", email: "", tipo_area: "tecnica" })
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
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Registrar instructor</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          <FormField label="Nombre completo" required error={touched.nombre ? errors.nombre : undefined}>
            <input
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              onBlur={() => handleBlur("nombre")}
              placeholder="Ej: Juan Perez"
              className={inputClass(touched.nombre && !!errors.nombre)}
            />
          </FormField>

          <FormField
            label="Correo electrónico"
            required
            error={touched.email ? errors.email : undefined}
            hint="Debe ser un correo institucional @sena.edu.co"
          >
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur("email")}
              placeholder="correo@sena.edu.co"
              className={inputClass(touched.email && !!errors.email)}
            />
          </FormField>

          <FormField label="Tipo de área">
            <select
              name="tipo_area"
              value={formData.tipo_area}
              onChange={handleChange}
              className={selectClass()}
            >
              <option value="tecnica">Técnica</option>
              <option value="transversal">Transversal</option>
            </select>
          </FormField>

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
