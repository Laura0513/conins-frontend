import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

type TipoActividad = {
  id: number
  nombre: string
  requiere_ficha: boolean
  requiere_ambiente: boolean
  requiere_competencia: boolean
}

type Ficha = { id: number; numero_ficha: string; programa: string; programa_id: number }
type Ambiente = { id: number; nombre: string; tipo: string }
type Competencia = { id: number; nombre: string }

type CrearBloqueHorarioModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

export default function CrearBloqueHorarioModal({ isOpen, onClose, onSubmit }: CrearBloqueHorarioModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([])
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [ambientes, setAmbientes] = useState<Ambiente[]>([])
  const [competencias, setCompetencias] = useState<Competencia[]>([])

  const [formData, setFormData] = useState({
    tipo_actividad_id: "",
    ficha_id: "",
    ambiente_id: "",
    competencia_id: "",
    fecha: "",
    hora_inicio: "",
    hora_fin: "",
    observaciones: "",
  })

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      Promise.all([
        api.catalogo.getTiposActividad(),
        api.fichas.getAll(),
        api.ambientes.getAll(),
      ])
        .then(([tiposRes, fichasRes, ambRes]) => {
          setTiposActividad(tiposRes.data || [])
          setFichas(fichasRes.data || [])
          setAmbientes(ambRes.data || [])
          
          if (tiposRes.data && tiposRes.data.length > 0) {
            setFormData(prev => ({ ...prev, tipo_actividad_id: tiposRes.data[0].id.toString() }))
          }
        })
        .catch((err) => {
          console.error("Error cargando datos para horario:", err)
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen])

  if (!isOpen) return null

  const selectedTipo = tiposActividad.find(t => t.id.toString() === formData.tipo_actividad_id)
  const mostrarFicha = selectedTipo?.requiere_ficha
  const mostrarAmbiente = selectedTipo?.requiere_ambiente
  const mostrarCompetencia = selectedTipo?.requiere_competencia

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        ficha_id: mostrarFicha ? Number(formData.ficha_id) : null,
        ambiente_id: mostrarAmbiente ? Number(formData.ambiente_id) : null,
        competencia_id: mostrarCompetencia ? Number(formData.competencia_id) : null,
      })
      setFormData({
        tipo_actividad_id: tiposActividad[0]?.id.toString() || "",
        ficha_id: "",
        ambiente_id: "",
        competencia_id: "",
        fecha: "",
        hora_inicio: "",
        hora_fin: "",
        observaciones: "",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })

    // Cargar competencias al seleccionar ficha
    if (field === "ficha_id" && value) {
      const ficha = fichas.find(f => f.id.toString() === value)
      if (ficha && ficha.programa_id) {
        api.catalogo.getCompetenciasByPrograma(ficha.programa_id)
          .then(res => setCompetencias(res.data || []))
          .catch(() => setCompetencias([]))
      } else {
        setCompetencias([])
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Registrar bloque horario</h2>
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
          <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de actividad <span className="text-red-500">*</span></label>
              <select
                value={formData.tipo_actividad_id}
                onChange={(e) => handleChange("tipo_actividad_id", e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
              >
                {tiposActividad.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  required
                  value={formData.fecha}
                  onChange={(e) => handleChange("fecha", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio <span className="text-red-500">*</span></label>
                <input
                  type="time"
                  required
                  value={formData.hora_inicio}
                  onChange={(e) => handleChange("hora_inicio", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin <span className="text-red-500">*</span></label>
                <input
                  type="time"
                  required
                  value={formData.hora_fin}
                  onChange={(e) => handleChange("hora_fin", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                />
              </div>
            </div>

            {mostrarFicha && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo <span className="text-red-500">*</span></label>
                <select
                  value={formData.ficha_id}
                  onChange={(e) => handleChange("ficha_id", e.target.value)}
                  required={mostrarFicha}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                >
                  <option value="">Seleccionar grupo</option>
                  {fichas.map((f) => (
                    <option key={f.id} value={f.id}>{f.numero_ficha} - {f.programa}</option>
                  ))}
                </select>
              </div>
            )}

            {mostrarAmbiente && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente <span className="text-red-500">*</span></label>
                <select
                  value={formData.ambiente_id}
                  onChange={(e) => handleChange("ambiente_id", e.target.value)}
                  required={mostrarAmbiente}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                >
                  <option value="">Seleccionar ambiente</option>
                  {ambientes.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre} ({a.tipo})</option>
                  ))}
                </select>
              </div>
            )}

            {mostrarCompetencia && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Competencia <span className="text-red-500">*</span></label>
                <select
                  value={formData.competencia_id}
                  onChange={(e) => handleChange("competencia_id", e.target.value)}
                  required={mostrarCompetencia}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                >
                  <option value="">Seleccionar competencia</option>
                  {competencias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea
                rows={2}
                value={formData.observaciones}
                onChange={(e) => handleChange("observaciones", e.target.value)}
                placeholder="Notas adicionales..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 resize-none"
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
                Guardar bloque
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
