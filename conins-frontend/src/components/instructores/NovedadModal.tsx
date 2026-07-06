import { useState, useEffect } from "react"
import { X, Loader2, AlertTriangle } from "lucide-react"
import { api } from "@/lib/api"

type TipoNovedad = {
  id: number
  nombre: string
  descripcion?: string
}

type NovedadData = {
  tipo_novedad_id: number
  fecha_inicio: string
  fecha_regreso: string
  observacion: string
}

type NovedadModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: NovedadData) => Promise<void>
  instructorName: string
}

export default function NovedadModal({ isOpen, onClose, onSubmit, instructorName }: NovedadModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tiposNovedad, setTiposNovedad] = useState<TipoNovedad[]>([])
  
  const [novedadData, setNovedadData] = useState<NovedadData>({
    tipo_novedad_id: 0,
    fecha_inicio: "",
    fecha_regreso: "",
    observacion: "",
  })

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      api.catalogo.getTiposNovedadInstructor()
        .then((res) => {
          setTiposNovedad(res.data || [])
          if (res.data && res.data.length > 0) {
            setNovedadData(prev => ({ ...prev, tipo_novedad_id: res.data[0].id }))
          }
        })
        .catch((err) => {
          console.error("Error cargando tipos de novedad:", err)
          // Fallback en caso de error
          setTiposNovedad([
            { id: 1, nombre: "licencia" },
            { id: 2, nombre: "incapacidad" },
            { id: 3, nombre: "comision" }
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
      await onSubmit(novedadData)
      setNovedadData({ tipo_novedad_id: tiposNovedad[0]?.id || 0, fecha_inicio: "", fecha_regreso: "", observacion: "" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Registrar novedad</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              El instructor quedara excluido de asignaciones mientras la novedad este vigente.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de novedad</label>
            {loading ? (
              <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-500 bg-gray-50 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando tipos...
              </div>
            ) : (
              <select
                value={novedadData.tipo_novedad_id}
                onChange={(e) => setNovedadData({ ...novedadData, tipo_novedad_id: Number(e.target.value) })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
              <input
                type="date"
                required
                value={novedadData.fecha_inicio}
                onChange={(e) => setNovedadData({ ...novedadData, fecha_inicio: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha est. de regreso</label>
              <input
                type="date"
                required
                value={novedadData.fecha_regreso}
                onChange={(e) => setNovedadData({ ...novedadData, fecha_regreso: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observacion</label>
            <textarea
              rows={3}
              value={novedadData.observacion}
              onChange={(e) => setNovedadData({ ...novedadData, observacion: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 resize-none"
              placeholder="Motivo o detalles adicionales..."
            />
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
              Registrar novedad
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
