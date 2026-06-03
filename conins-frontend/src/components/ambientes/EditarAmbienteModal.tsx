import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

type Ambiente = {
  id: number
  nombre: string
  tipo: string
  capacidad: number
  area_id: number | null
  activo: boolean
}

type Area = { id: number; nombre: string }

type EditarAmbienteModalProps = {
  isOpen: boolean
  onClose: () => void
  ambiente: Ambiente | null
  onSubmit: (data: any) => Promise<void>
}

export default function EditarAmbienteModal({ isOpen, onClose, ambiente, onSubmit }: EditarAmbienteModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [areas, setAreas] = useState<Area[]>([])
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "aula",
    capacidad: "",
    area_id: "",
    activo: true,
  })

  useEffect(() => {
    if (isOpen) {
      api.catalogo.getAreas()
        .then((res) => setAreas(res.data || []))
        .catch(() => setAreas([]))
      
      if (ambiente) {
        setFormData({
          nombre: ambiente.nombre,
          tipo: ambiente.tipo,
          capacidad: String(ambiente.capacidad),
          area_id: ambiente.area_id ? String(ambiente.area_id) : "",
          activo: ambiente.activo,
        })
      }
    }
  }, [ambiente, isOpen])

  if (!isOpen || !ambiente) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        nombre: formData.nombre,
        tipo: formData.tipo,
        capacidad: Number(formData.capacidad),
        area_id: formData.area_id ? Number(formData.area_id) : null,
        activo: formData.activo,
      }
      await onSubmit(payload)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Editar ambiente</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={formData.tipo}
                onChange={(e) => handleChange("tipo", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
              >
                <option value="aula">Aula</option>
                <option value="taller">Taller</option>
                <option value="laboratorio">Laboratorio</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
              <input
                type="number"
                required
                value={formData.capacidad}
                onChange={(e) => handleChange("capacidad", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
            <select
              value={formData.area_id}
              onChange={(e) => handleChange("area_id", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="">Sin área específica</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) => handleChange("activo", e.target.checked)}
              className="w-4 h-4 text-sena border-gray-300 rounded focus:ring-sena"
            />
            <label htmlFor="activo" className="text-sm font-medium text-gray-700">
              Ambiente activo
            </label>
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
