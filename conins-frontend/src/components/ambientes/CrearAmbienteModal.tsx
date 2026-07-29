import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import FormField, { inputClass, selectClass } from "@/components/ui/FormField"

type CrearAmbienteModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

type Area = { id: number; nombre: string }

export default function CrearAmbienteModal({ isOpen, onClose, onSubmit }: CrearAmbienteModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [areas, setAreas] = useState<Area[]>([])
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "aula",
    capacidad: "",
    area_id: "",
  })

  useEffect(() => {
    if (isOpen) {
      api.catalogo.getAreas()
        .then((res) => setAreas(res.data || []))
        .catch(() => setAreas([]))
    }
  }, [isOpen])

  if (!isOpen) return null

  // Validaciones
  const errors: Record<string, string> = {}
  if (!formData.nombre.trim()) errors.nombre = "El nombre es obligatorio"
  else if (formData.nombre.trim().length < 2) errors.nombre = "Mínimo 2 caracteres"
  if (!formData.capacidad) errors.capacidad = "La capacidad es obligatoria"
  else if (Number(formData.capacidad) < 1 || Number(formData.capacidad) > 500) errors.capacidad = "Entre 1 y 500"

  const isValid = Object.keys(errors).length === 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ nombre: true, capacidad: true })
    if (!isValid) return
    setSubmitting(true)
    try {
      const payload = {
        nombre: formData.nombre,
        tipo: formData.tipo,
        capacidad: Number(formData.capacidad),
        area_id: formData.area_id ? Number(formData.area_id) : null,
      }
      await onSubmit(payload)
      setFormData({ nombre: "", tipo: "aula", capacidad: "", area_id: "" })
      setTouched({})
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Registrar ambiente</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          <FormField label="Nombre" required error={touched.nombre ? errors.nombre : undefined}>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              onBlur={() => handleBlur("nombre")}
              placeholder="Ej: Aula 301"
              className={inputClass(touched.nombre && !!errors.nombre)}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tipo">
              <select
                value={formData.tipo}
                onChange={(e) => handleChange("tipo", e.target.value)}
                className={selectClass()}
              >
                <option value="aula">Aula</option>
                <option value="taller">Taller</option>
                <option value="laboratorio">Laboratorio</option>
              </select>
            </FormField>
            <FormField label="Capacidad" required error={touched.capacidad ? errors.capacidad : undefined}>
              <input
                type="number"
                value={formData.capacidad}
                onChange={(e) => handleChange("capacidad", e.target.value)}
                onBlur={() => handleBlur("capacidad")}
                placeholder="30"
                min={1}
                max={500}
                className={inputClass(touched.capacidad && !!errors.capacidad)}
              />
            </FormField>
          </div>

          <FormField label="Área" hint="Opcional">
            <select
              value={formData.area_id}
              onChange={(e) => handleChange("area_id", e.target.value)}
              className={selectClass()}
            >
              <option value="">Sin área específica</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
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
