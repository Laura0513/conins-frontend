import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

type Ficha = {
  id: number
  numero_ficha: string
  programa: string
  programa_id?: number
  jornada: string
  jornada_id?: number
  etapa: string
  modalidad: string
  instructores_count: number
  estado: string
  activo: boolean
  lider_id?: number | null
  ambiente_id?: number | null
  fecha_inicio_lectiva?: string | null
  fecha_fin_lectiva?: string | null
  fecha_inicio_productiva?: string | null
  fecha_fin_productiva?: string | null
  fecha_fin_ficha?: string | null
}

type EditFichaModalProps = {
  isOpen: boolean
  onClose: () => void
  ficha: Ficha | null
  onSubmit: (data: any) => Promise<void>
}

const JORNADAS = [
  { id: 1, nombre: "Mañana" },
  { id: 2, nombre: "Mixta" },
  { id: 3, nombre: "Noche" },
  { id: 4, nombre: "Virtual" },
]

export default function EditFichaModal({ isOpen, onClose, ficha, onSubmit }: EditFichaModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [programas, setProgramas] = useState<{ id: number; nombre: string }[]>([])
  const [lideres, setLideres] = useState<{ id: number; nombre: string }[]>([])
  const [ambientes, setAmbientes] = useState<{ id: number; nombre: string }[]>([])
  const [formData, setFormData] = useState({
    numero_ficha: "",
    programa_id: "",
    jornada_id: "",
    etapa: "lectiva",
    lider_id: "",
    ambiente_id: "",
    fecha_inicio_lectiva: "",
    fecha_fin_lectiva: "",
    fecha_inicio_productiva: "",
    fecha_fin_productiva: "",
    fecha_fin_ficha: "",
  })

  const formatDateForInput = (d: string | null | undefined) => {
    if (!d) return ""
    return d.substring(0, 10)
  }

  useEffect(() => {
    if (isOpen && ficha) {
      // Cargar catálogos
      Promise.allSettled([
        api.programs.getAll(),
        api.users.getAll(),
        api.ambientes.getAll(),
      ]).then(([programsRes, usersRes, ambientesRes]) => {
        if (programsRes.status === "fulfilled") setProgramas(programsRes.value.data || [])
        if (usersRes.status === "fulfilled") {
          const lideresList = (usersRes.value.data || []).filter(
            (u: any) => u.rol === "Instructor"
          )
          setLideres(lideresList)
        }
        if (ambientesRes.status === "fulfilled") setAmbientes(ambientesRes.value.data || [])
      })

      // Poblar form con datos de la ficha
      setFormData({
        numero_ficha: ficha.numero_ficha || "",
        programa_id: String(ficha.programa_id || ""),
        jornada_id: String(ficha.jornada_id || ""),
        etapa: ficha.etapa || "lectiva",
        lider_id: String(ficha.lider_id || ""),
        ambiente_id: String(ficha.ambiente_id || ""),
        fecha_inicio_lectiva: formatDateForInput(ficha.fecha_inicio_lectiva),
        fecha_fin_lectiva: formatDateForInput(ficha.fecha_fin_lectiva),
        fecha_inicio_productiva: formatDateForInput(ficha.fecha_inicio_productiva),
        fecha_fin_productiva: formatDateForInput(ficha.fecha_fin_productiva),
        fecha_fin_ficha: formatDateForInput(ficha.fecha_fin_ficha),
      })
    }
  }, [isOpen, ficha])

  if (!isOpen || !ficha) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        numero_ficha: formData.numero_ficha,
        programa_id: Number(formData.programa_id) || undefined,
        jornada_id: Number(formData.jornada_id) || undefined,
        etapa: formData.etapa,
        lider_id: Number(formData.lider_id) || null,
        ambiente_id: Number(formData.ambiente_id) || null,
        fecha_inicio_lectiva: formData.fecha_inicio_lectiva || undefined,
        fecha_fin_lectiva: formData.fecha_fin_lectiva || undefined,
        fecha_inicio_productiva: formData.fecha_inicio_productiva || undefined,
        fecha_fin_productiva: formData.fecha_fin_productiva || undefined,
        fecha_fin_ficha: formData.fecha_fin_ficha || undefined,
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Editar ficha {ficha.numero_ficha}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numero de ficha</label>
            <input
              type="text"
              required
              value={formData.numero_ficha}
              onChange={(e) => handleChange("numero_ficha", e.target.value)}
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

          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente</label>
              <select
                value={formData.ambiente_id}
                onChange={(e) => handleChange("ambiente_id", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
              >
                <option value="">Sin asignar</option>
                {ambientes.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jornada</label>
            <div className="flex flex-wrap gap-4">
              {JORNADAS.map((j) => (
                <label key={j.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="jornada_edit"
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
                  name="etapa_edit"
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
                  name="etapa_edit"
                  value="productiva"
                  checked={formData.etapa === "productiva"}
                  onChange={(e) => handleChange("etapa", e.target.value)}
                  className="w-4 h-4 text-sena border-gray-300 focus:ring-sena"
                />
                <span className="text-sm text-gray-700">Productiva</span>
              </label>
            </div>
          </div>

          {/* Fechas lectiva */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Etapa lectiva</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fecha inicio</label>
                <input
                  type="date"
                  value={formData.fecha_inicio_lectiva}
                  onChange={(e) => handleChange("fecha_inicio_lectiva", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fecha fin</label>
                <input
                  type="date"
                  value={formData.fecha_fin_lectiva}
                  onChange={(e) => handleChange("fecha_fin_lectiva", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                />
              </div>
            </div>
          </div>

          {/* Fechas productiva */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Etapa productiva</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fecha inicio</label>
                <input
                  type="date"
                  value={formData.fecha_inicio_productiva}
                  onChange={(e) => handleChange("fecha_inicio_productiva", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fecha fin</label>
                <input
                  type="date"
                  value={formData.fecha_fin_productiva}
                  onChange={(e) => handleChange("fecha_fin_productiva", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                />
              </div>
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
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
