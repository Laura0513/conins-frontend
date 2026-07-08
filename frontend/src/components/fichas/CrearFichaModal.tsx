import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

type CrearFichaModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

type Programa = { id: number; nombre: string }
type Lider = { id: number; nombre: string }

const JORNADAS = [
  { id: 1, nombre: "Mañana" },
  { id: 2, nombre: "Mixta" },
  { id: 3, nombre: "Noche" },
  { id: 4, nombre: "Virtual" },
]

export default function CrearFichaModal({ isOpen, onClose, onSubmit }: CrearFichaModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [programas, setProgramas] = useState<Programa[]>([])
  const [lideres, setLideres] = useState<Lider[]>([])
  const [formData, setFormData] = useState({
    numero_ficha: "",
    programa_id: "",
    jornada_id: "",
    etapa: "lectiva",
    lider_id: "",
    fecha_inicio_lectiva: "",
    fecha_fin_lectiva: "",
    fecha_fin_ficha: "",
  })

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        api.programs.getAll(),
        api.users.getAll(),
      ])
        .then(([programsRes, usersRes]) => {
          setProgramas(programsRes.data || [])
          const lideresList = (usersRes.data || []).filter(
            (u: any) => u.rol === "Instructor"
          )
          setLideres(lideresList)
        })
        .catch(() => {
          setProgramas([])
          setLideres([])
        })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        numero_ficha: formData.numero_ficha,
        programa_id: Number(formData.programa_id),
        jornada_id: Number(formData.jornada_id),
        etapa: formData.etapa,
        lider_id: Number(formData.lider_id) || null,
        fecha_inicio_lectiva: formData.fecha_inicio_lectiva || undefined,
        fecha_fin_lectiva: formData.fecha_fin_lectiva || undefined,
        fecha_fin_ficha: formData.fecha_fin_ficha || undefined,
      }
      await onSubmit(payload)
      setFormData({
        numero_ficha: "",
        programa_id: "",
        jornada_id: "",
        etapa: "lectiva",
        lider_id: "",
        fecha_inicio_lectiva: "",
        fecha_fin_lectiva: "",
        fecha_fin_ficha: "",
      })
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
          <h2 className="text-lg font-bold text-gray-900">Registrar ficha</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de ficha</label>
            <input
              type="text"
              required
              value={formData.numero_ficha}
              onChange={(e) => handleChange("numero_ficha", e.target.value)}
              placeholder="2995403"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Programa</label>
            <select
              required
              value={formData.programa_id}
              onChange={(e) => handleChange("programa_id", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="">Seleccionar programa</option>
              {programas.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lider de programa</label>
            <select
              value={formData.lider_id}
              onChange={(e) => handleChange("lider_id", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="">Sin asignar</option>
              {lideres.map((l) => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jornada</label>
            <div className="flex flex-wrap gap-4">
              {JORNADAS.map((j) => (
                <label key={j.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="jornada"
                    value={j.id}
                    checked={Number(formData.jornada_id) === j.id}
                    onChange={(e) => handleChange("jornada_id", e.target.value)}
                    className="w-4 h-4 text-sena border-gray-300 focus:ring-sena"
                  />
                  <span className="text-sm text-gray-700">{j.nombre}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Etapa</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="etapa"
                  value="lectiva"
                  checked={formData.etapa === "lectiva"}
                  onChange={(e) => handleChange("etapa", e.target.value)}
                  className="w-4 h-4 text-sena border-gray-300 focus:ring-sena"
                />
                <span className="text-sm text-gray-700">Lectiva</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="etapa"
                  value="productiva"
                  checked={formData.etapa === "productiva"}
                  onChange={(e) => handleChange("etapa", e.target.value)}
                  className="w-4 h-4 text-sena border-gray-300 focus:ring-sena"
                />
                <span className="text-sm text-gray-700">Productiva</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio lectiva</label>
              <input
                type="date"
                value={formData.fecha_inicio_lectiva}
                onChange={(e) => handleChange("fecha_inicio_lectiva", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin lectiva</label>
              <input
                type="date"
                value={formData.fecha_fin_lectiva}
                onChange={(e) => handleChange("fecha_fin_lectiva", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin ficha</label>
            <input
              type="date"
              value={formData.fecha_fin_ficha}
              onChange={(e) => handleChange("fecha_fin_ficha", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
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
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
