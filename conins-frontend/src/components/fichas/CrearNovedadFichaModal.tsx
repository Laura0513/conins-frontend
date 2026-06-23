import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

type TipoNovedadFicha = {
  id: number
  nombre: string
  descripcion?: string
}

type Ficha = {
  id: number
  numero_ficha: string
  programa: string
}

type CrearNovedadFichaModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

export default function CrearNovedadFichaModal({ isOpen, onClose, onSubmit }: CrearNovedadFichaModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tiposNovedad, setTiposNovedad] = useState<TipoNovedadFicha[]>([])
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [formData, setFormData] = useState({
    ficha_id: 0,
    tipo_novedad_id: 0,
    fecha_inicio: "",
    fecha_fin: "",
    observacion: "",
  })

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      Promise.all([
        api.catalogo.getTiposNovedadFicha(),
        api.fichas.getAll(),
      ])
        .then(([tiposRes, fichasRes]) => {
          setTiposNovedad(tiposRes.data || [])
          setFichas(fichasRes.data || [])
          if (tiposRes.data && tiposRes.data.length > 0) {
            setFormData(prev => ({ ...prev, tipo_novedad_id: tiposRes.data[0].id }))
          }
        })
        .catch((err) => {
          console.error("Error cargando datos:", err)
          setTiposNovedad([
            { id: 1, nombre: "comite de evaluacion" },
            { id: 2, nombre: "paro" },
            { id: 3, nombre: "actividad fuera" },
            { id: 4, nombre: "suspension" }
          ])
          setFichas([
            { id: 1, numero_ficha: "2995403", programa: "ADSO" },
            { id: 2, numero_ficha: "2887341", programa: "Calzado" }
          ])
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(formData)
      setFormData({ ficha_id: 0, tipo_novedad_id: tiposNovedad[0]?.id || 0, fecha_inicio: "", fecha_fin: "", observacion: "" })
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
          <h2 className="text-lg font-bold text-gray-900">Registrar novedad de ficha</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-sena mb-2" />
            <p className="text-sm">Cargando datos...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ficha <span className="text-red-500">*</span></label>
              <select
                value={formData.ficha_id}
                onChange={(e) => handleChange("ficha_id", Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
              >
                <option value={0}>Seleccionar ficha</option>
                {fichas.map((ficha) => (
                  <option key={ficha.id} value={ficha.id}>
                    {ficha.numero_ficha} - {ficha.programa}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de novedad <span className="text-red-500">*</span></label>
              <select
                value={formData.tipo_novedad_id}
                onChange={(e) => handleChange("tipo_novedad_id", Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
              >
                {tiposNovedad.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre.charAt(0).toUpperCase() + tipo.nombre.slice(1)}
                  </option>
                ))}
              </select>
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
                placeholder="Detalles adicionales sobre la novedad..."
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
                className="px-4 py-2.5 bg-sena hover:bg-sena/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Registrar novedad
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
