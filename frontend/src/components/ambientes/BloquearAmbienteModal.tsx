import { useState, useEffect } from "react"
import { X, Loader2, AlertTriangle } from "lucide-react"
import { api } from "@/lib/api"

type TipoNovedadAmbiente = {
  id: number
  nombre: string
  descripcion?: string
}

type Ambiente = {
  id: number
  nombre: string
  tipo: string
  activo: boolean
}

type BloquearAmbienteModalProps = {
  isOpen: boolean
  onClose: () => void
  ambiente: Ambiente | null
  onSubmit: (data: any) => Promise<void>
}

export default function BloquearAmbienteModal({ isOpen, onClose, ambiente, onSubmit }: BloquearAmbienteModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tiposNovedad, setTiposNovedad] = useState<TipoNovedadAmbiente[]>([])
  const [formData, setFormData] = useState({
    tipo_novedad_id: 0,
    fecha_inicio: "",
    fecha_fin: "",
    observacion: "",
  })

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      api.catalogo.getTiposNovedadAmbiente()
        .then((res) => {
          setTiposNovedad(res.data || [])
          if (res.data && res.data.length > 0) {
            setFormData(prev => ({ ...prev, tipo_novedad_id: res.data[0].id }))
          }
        })
        .catch((err) => {
          console.error("Error cargando tipos de novedad de ambiente:", err)
          setTiposNovedad([
            { id: 1, nombre: "mantenimiento" },
            { id: 2, nombre: "evento institucional" },
            { id: 3, nombre: "cerramiento temporal" }
          ])
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen])

  if (!isOpen || !ambiente) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(formData)
      setFormData({ tipo_novedad_id: tiposNovedad[0]?.id || 0, fecha_inicio: "", fecha_fin: "", observacion: "" })
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
          <h2 className="text-lg font-bold text-gray-900">Registrar bloqueo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-orange-50 border-b border-orange-100 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <div className="text-sm text-orange-800">
            <p className="font-medium">Ambiente: {ambiente.nombre}</p>
            <p className="text-orange-700/80">El ambiente no podra ser asignado durante el periodo de bloqueo.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de novedad</label>
            {loading ? (
              <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-500 bg-gray-50 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando tipos...
              </div>
            ) : (
              <select
                value={formData.tipo_novedad_id}
                onChange={(e) => handleChange("tipo_novedad_id", Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
              >
                {tiposNovedad.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre.charAt(0).toUpperCase() + tipo.nombre.slice(1)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={formData.fecha_inicio}
                onChange={(e) => handleChange("fecha_inicio", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={formData.fecha_fin}
                onChange={(e) => handleChange("fecha_fin", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observacion</label>
            <textarea
              rows={3}
              value={formData.observacion}
              onChange={(e) => handleChange("observacion", e.target.value)}
              placeholder="Ej: Mantenimiento preventivo, reparacion de equipos..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 resize-none"
            />
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
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Registrar bloqueo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
