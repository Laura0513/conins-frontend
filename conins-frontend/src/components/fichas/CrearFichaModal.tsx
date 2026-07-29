import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import FormField, { inputClass, selectClass } from "@/components/ui/FormField"

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
  const [touched, setTouched] = useState<Record<string, boolean>>({})
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
    fecha_inicio_productiva: "",
    fecha_fin_productiva: "",
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

  // Validaciones
  const errors: Record<string, string> = {}
  if (!formData.numero_ficha.trim()) errors.numero_ficha = "El número de grupo es obligatorio"
  else if (!/^\d{4,10}$/.test(formData.numero_ficha.trim())) errors.numero_ficha = "Solo números, entre 4 y 10 dígitos"
  if (!formData.programa_id) errors.programa_id = "Seleccione un programa"
  if (!formData.jornada_id) errors.jornada_id = "Seleccione una jornada"
  if (formData.fecha_inicio_lectiva && formData.fecha_fin_lectiva && formData.fecha_fin_lectiva < formData.fecha_inicio_lectiva)
    errors.fecha_fin_lectiva = "La fecha fin debe ser posterior al inicio"
  if (formData.fecha_inicio_productiva && formData.fecha_fin_productiva && formData.fecha_fin_productiva < formData.fecha_inicio_productiva)
    errors.fecha_fin_productiva = "La fecha fin debe ser posterior al inicio"

  const isValid = Object.keys(errors).length === 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ numero_ficha: true, programa_id: true, jornada_id: true })
    if (!isValid) return
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
        fecha_inicio_productiva: formData.fecha_inicio_productiva || undefined,
        fecha_fin_productiva: formData.fecha_fin_productiva || undefined,
        fecha_fin_ficha: formData.fecha_fin_ficha || undefined,
      }
      await onSubmit(payload)
      setFormData({
        numero_ficha: "", programa_id: "", jornada_id: "", etapa: "lectiva", lider_id: "",
        fecha_inicio_lectiva: "", fecha_fin_lectiva: "", fecha_inicio_productiva: "",
        fecha_fin_productiva: "", fecha_fin_ficha: "",
      })
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Registrar grupo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <FormField label="Número de grupo" required error={touched.numero_ficha ? errors.numero_ficha : undefined}>
            <input
              type="text"
              value={formData.numero_ficha}
              onChange={(e) => handleChange("numero_ficha", e.target.value)}
              onBlur={() => handleBlur("numero_ficha")}
              placeholder="2995403"
              className={inputClass(touched.numero_ficha && !!errors.numero_ficha)}
            />
          </FormField>

          <FormField label="Programa" required error={touched.programa_id ? errors.programa_id : undefined}>
            <select
              value={formData.programa_id}
              onChange={(e) => handleChange("programa_id", e.target.value)}
              onBlur={() => handleBlur("programa_id")}
              className={selectClass(touched.programa_id && !!errors.programa_id)}
            >
              <option value="">Seleccionar programa</option>
              {programas.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Líder de programa">
            <select
              value={formData.lider_id}
              onChange={(e) => handleChange("lider_id", e.target.value)}
              className={selectClass()}
            >
              <option value="">Sin asignar</option>
              {lideres.map((l) => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Jornada" required error={touched.jornada_id ? errors.jornada_id : undefined}>
            <div className="flex flex-wrap gap-4 pt-1">
              {JORNADAS.map((j) => (
                <label key={j.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="jornada"
                    value={j.id}
                    checked={Number(formData.jornada_id) === j.id}
                    onChange={(e) => { handleChange("jornada_id", e.target.value); setTouched({ ...touched, jornada_id: true }) }}
                    className="w-4 h-4 text-sena border-gray-300 focus:ring-sena"
                  />
                  <span className="text-sm text-gray-700">{j.nombre}</span>
                </label>
              ))}
            </div>
          </FormField>

          <FormField label="Etapa">
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio" name="etapa" value="lectiva"
                  checked={formData.etapa === "lectiva"}
                  onChange={(e) => handleChange("etapa", e.target.value)}
                  className="w-4 h-4 text-sena border-gray-300 focus:ring-sena"
                />
                <span className="text-sm text-gray-700">Lectiva</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio" name="etapa" value="productiva"
                  checked={formData.etapa === "productiva"}
                  onChange={(e) => handleChange("etapa", e.target.value)}
                  className="w-4 h-4 text-sena border-gray-300 focus:ring-sena"
                />
                <span className="text-sm text-gray-700">Productiva</span>
              </label>
            </div>
          </FormField>

          {/* Fechas lectiva */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Etapa lectiva</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Fecha inicio">
                <input
                  type="date"
                  value={formData.fecha_inicio_lectiva}
                  onChange={(e) => handleChange("fecha_inicio_lectiva", e.target.value)}
                  className={inputClass()}
                />
              </FormField>
              <FormField label="Fecha fin" error={errors.fecha_fin_lectiva}>
                <input
                  type="date"
                  value={formData.fecha_fin_lectiva}
                  onChange={(e) => handleChange("fecha_fin_lectiva", e.target.value)}
                  className={inputClass(!!errors.fecha_fin_lectiva)}
                />
              </FormField>
            </div>
          </div>

          {/* Fechas productiva */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Etapa productiva</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Fecha inicio">
                <input
                  type="date"
                  value={formData.fecha_inicio_productiva}
                  onChange={(e) => handleChange("fecha_inicio_productiva", e.target.value)}
                  className={inputClass()}
                />
              </FormField>
              <FormField label="Fecha fin" error={errors.fecha_fin_productiva}>
                <input
                  type="date"
                  value={formData.fecha_fin_productiva}
                  onChange={(e) => handleChange("fecha_fin_productiva", e.target.value)}
                  className={inputClass(!!errors.fecha_fin_productiva)}
                />
              </FormField>
            </div>
          </div>

          <FormField label="Fecha fin grupo">
            <input
              type="date"
              value={formData.fecha_fin_ficha}
              onChange={(e) => handleChange("fecha_fin_ficha", e.target.value)}
              className={inputClass()}
            />
          </FormField>

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
