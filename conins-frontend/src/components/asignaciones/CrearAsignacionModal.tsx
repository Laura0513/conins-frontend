import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

type CrearAsignacionModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

type Instructor = { id: number; nombre: string }
type Ficha = { id: number; numero_ficha: string; programa: string; programa_id?: number }
type Competencia = { id: number; nombre: string }

export default function CrearAsignacionModal({ isOpen, onClose, onSubmit }: CrearAsignacionModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [instructores, setInstructores] = useState<Instructor[]>([])
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [competencias, setCompetencias] = useState<Competencia[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null)
  const [formData, setFormData] = useState({
    instructor_id: "",
    ficha_id: "",
    competencia_ids: [] as number[],
    es_lider_ficha: false,
  })

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      Promise.all([
        api.instructors.getAll().then((res) => setInstructores(res.data || [])).catch(() => setInstructores([])),
        api.fichas.getAll().then((res) => setFichas(res.data || [])).catch(() => setFichas([])),
      ]).finally(() => setLoading(false))
    }
  }, [isOpen])

  useEffect(() => {
    if (formData.ficha_id) {
      const ficha = fichas.find((f) => f.id === Number(formData.ficha_id))
      if (ficha && ficha.programa_id) {
        setSelectedFicha(ficha)
        api.catalogo.getCompetenciasByPrograma(ficha.programa_id)
          .then((res) => {
            setCompetencias(res.data || [])
            setFormData({ ...formData, competencia_ids: [] })
          })
          .catch(() => setCompetencias([]))
      } else if (ficha && !ficha.programa_id) {
        setSelectedFicha(ficha)
        setCompetencias([])
      }
    } else {
      setSelectedFicha(null)
      setCompetencias([])
    }
  }, [formData.ficha_id, fichas])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        instructor_id: Number(formData.instructor_id),
        ficha_id: Number(formData.ficha_id),
        competencia_ids: formData.competencia_ids,
        es_lider_ficha: formData.es_lider_ficha,
      }
      await onSubmit(payload)
      setFormData({
        instructor_id: "",
        ficha_id: "",
        competencia_ids: [],
        es_lider_ficha: false,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const toggleCompetencia = (id: number) => {
    const nuevos = formData.competencia_ids.includes(id)
      ? formData.competencia_ids.filter((c) => c !== id)
      : [...formData.competencia_ids, id]
    setFormData({ ...formData, competencia_ids: nuevos })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Asignar competencia</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Cargando datos...
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructor <span className="text-red-500">*</span></label>
                <select
                  required
                  value={formData.instructor_id}
                  onChange={(e) => handleChange("instructor_id", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                >
                  <option value="">Seleccionar instructor</option>
                  {instructores.map((i) => (
                    <option key={i.id} value={i.id}>{i.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ficha <span className="text-red-500">*</span></label>
                <select
                  required
                  value={formData.ficha_id}
                  onChange={(e) => handleChange("ficha_id", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                >
                  <option value="">Seleccionar ficha</option>
                  {fichas.map((f) => (
                    <option key={f.id} value={f.id}>{f.numero_ficha} — {f.programa}</option>
                  ))}
                </select>
              </div>

              {selectedFicha && competencias.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Competencias <span className="text-red-500">*</span></label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {competencias.map((c) => (
                      <label key={c.id} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.competencia_ids.includes(c.id)}
                          onChange={() => toggleCompetencia(c.id)}
                          className="w-4 h-4 text-sena border-gray-300 rounded focus:ring-sena"
                        />
                        <span className="text-sm text-gray-700">{c.nombre}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Selecciona una o más competencias del programa.</p>
                </div>
              )}

              {selectedFicha && competencias.length === 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  El programa "{selectedFicha.programa}" no tiene competencias registradas aún.
                </div>
              )}

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
                  <span className="text-sm font-medium text-gray-700">¿Es líder de esta ficha?</span>
                  <p className="text-xs text-gray-500">Función administrativa. No modifica permisos.</p>
                </div>
              </div>
            </>
          )}

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
              disabled={submitting || loading || formData.competencia_ids.length === 0}
              className="px-4 py-2.5 bg-sena hover:bg-sena/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Asignar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
