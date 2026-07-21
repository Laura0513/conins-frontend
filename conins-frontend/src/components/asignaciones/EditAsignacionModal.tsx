import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

type Asignacion = {
  id: number
  instructor_id: number
  ficha_id: number
  competencia_id: number
  instructor_nombre: string
  ficha_numero: string
  competencia: string
  ambiente: string
  jornada: string
  es_lider: boolean
  es_provisional: boolean
  activo: boolean
}

type Competencia = { id: number; nombre: string }
type Ambiente = { id: number; nombre: string }

type EditAsignacionModalProps = {
  isOpen: boolean
  onClose: () => void
  asignacion: Asignacion | null
  onSubmit: (data: any) => Promise<void>
}

export default function EditAsignacionModal({ isOpen, onClose, asignacion, onSubmit }: EditAsignacionModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [competencias, setCompetencias] = useState<Competencia[]>([])
  const [ambientes, setAmbientes] = useState<Ambiente[]>([])
  const [formData, setFormData] = useState({
    competencia_id: "",
    ambiente_excepcion_id: "",
    es_lider_ficha: false,
  })

  useEffect(() => {
    if (isOpen && asignacion) {
      setFormData({
        competencia_id: String(asignacion.competencia_id),
        ambiente_excepcion_id: "",
        es_lider_ficha: asignacion.es_lider,
      })
      
      // Cargar competencias del programa de la ficha
      api.catalogo.getCompetenciasByPrograma(asignacion.ficha_id)
        .then((res) => setCompetencias(res.data || []))
        .catch(() => setCompetencias([]))

      api.ambientes.getAll()
        .then((res) => setAmbientes(res.data || []))
        .catch(() => setAmbientes([]))
    }
  }, [isOpen, asignacion])

  if (!isOpen || !asignacion) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        competencia_id: Number(formData.competencia_id),
        ambiente_excepcion_id: formData.ambiente_excepcion_id ? Number(formData.ambiente_excepcion_id) : null,
        es_lider_ficha: formData.es_lider_ficha,
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Editar asignación</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5">
          <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sena/10 flex items-center justify-center">
              <span className="text-xs font-bold text-sena">{asignacion.instructor_nombre.charAt(0)}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{asignacion.instructor_nombre}</p>
              <p className="text-xs text-gray-500">Grupo {asignacion.ficha_numero}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Competencia</label>
            <select
              required
              value={formData.competencia_id}
              onChange={(e) => handleChange("competencia_id", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              {competencias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente (Excepción)</label>
            <select
              value={formData.ambiente_excepcion_id}
              onChange={(e) => handleChange("ambiente_excepcion_id", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="">Usar ambiente del grupo</option>
              {ambientes.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Deja en blanco para usar el aula asignada al grupo.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleChange("es_lider_ficha", !formData.es_lider_ficha)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.es_lider_ficha ? "bg-sena" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.es_lider_ficha ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <div>
              <span className="text-sm font-medium text-gray-700">¿Es líder de este grupo?</span>
              <p className="text-xs text-gray-500">Función administrativa. No modifica permisos.</p>
            </div>
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
