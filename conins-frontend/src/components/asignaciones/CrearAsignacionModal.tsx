import { useState, useEffect } from "react"
import {
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  User,
  BookOpen,
  Building2,
  Sun,
  Layers,
  Check,
  Clock,
  Calendar,
} from "lucide-react"
import { api } from "@/lib/api"
import { formatJornada } from "@/lib/terminology"
import { useToast } from "@/lib/ToastContext"

type CrearAsignacionModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

type Instructor = { id: number; nombre: string }
type Ficha = {
  id: number
  numero_ficha: string
  programa: string
  programa_id?: number
  jornada?: string
  jornada_id?: number | null
  ambiente_id?: number | null
}
type Ambiente = { id: number; nombre: string }
type Competencia = { id: number; nombre: string; codigo?: string }
type Rap = { rap_id?: number; id?: number; codigo: string; descripcion: string; activo: boolean }
type TipoActividad = { id: number; nombre: string }

const DIAS_SEMANA = [
  { id: 1, nombre: "Lun" },
  { id: 2, nombre: "Mar" },
  { id: 3, nombre: "Mié" },
  { id: 4, nombre: "Jue" },
  { id: 5, nombre: "Vie" },
  { id: 6, nombre: "Sáb" },
]

const STEPS = [
  { label: "Instructor y Grupo", icon: User },
  { label: "Competencias y RAPs", icon: Layers },
  { label: "Resumen", icon: Check },
]

export default function CrearAsignacionModal({ isOpen, onClose, onSubmit }: CrearAsignacionModalProps) {
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(0)
  const [habilitandoCompId, setHabilitandoCompId] = useState<number | null>(null)

  // Data
  const [instructores, setInstructores] = useState<Instructor[]>([])
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [ambientes, setAmbientes] = useState<Ambiente[]>([])
  const [competenciasPrograma, setCompetenciasPrograma] = useState<Competencia[]>([])
  const [competenciasInstructor, setCompetenciasInstructor] = useState<number[]>([])
  const [loadingComps, setLoadingComps] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([])

  // Competencias que el instructor puede dictar Y pertenecen al programa
  const competencias = competenciasPrograma.filter(
    (c) => competenciasInstructor.includes(c.id)
  )
  const competenciasNoHabilitadas = competenciasPrograma.filter(
    (c) => !competenciasInstructor.includes(c.id)
  )

  // RAPs
  const [rapsDisponibles, setRapsDisponibles] = useState<Record<number, Rap[]>>({})
  const [rapsSeleccionados, setRapsSeleccionados] = useState<Record<number, number[]>>({})
  const [loadingRaps, setLoadingRaps] = useState<Record<number, boolean>>({})
  const [expandedComps, setExpandedComps] = useState<Record<number, boolean>>({})

  // Form
  const [formData, setFormData] = useState({
    instructor_id: "",
    ficha_id: "",
    ambiente_id: "",
    jornada_id: "",
    competencia_ids: [] as number[],
    es_lider_ficha: false,
    // Horario
    horario_dias: [] as number[],
    horario_inicio: "",
    horario_fin: "",
    horario_tipo_actividad_id: "",
  })

  // Derived
  const selectedFicha = fichas.find((f) => f.id === Number(formData.ficha_id)) || null
  const selectedInstructor = instructores.find((i) => i.id === Number(formData.instructor_id)) || null
  const selectedAmbiente = ambientes.find((a) => a.id === Number(formData.ambiente_id)) || null
  const JORNADAS = [
    { id: "1", nombre: "Mañana" },
    { id: "2", nombre: "Mixta" },
    { id: "3", nombre: "Noche" },
    { id: "4", nombre: "Virtual" },
  ]
  const selectedJornada = JORNADAS.find((j) => j.id === formData.jornada_id) || null

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      setStep(0)
      Promise.all([
        api.instructors.getAll().then((res) => setInstructores(res.data || [])).catch(() => setInstructores([])),
        api.fichas.getAll().then((res) => setFichas(res.data || [])).catch(() => setFichas([])),
        api.ambientes.getAll().then((res) => setAmbientes(res.data || [])).catch(() => setAmbientes([])),
        api.catalogo.getTiposActividad().then((res) => setTiposActividad(res.data || [])).catch(() => setTiposActividad([])),
      ]).finally(() => setLoading(false))

      // Reset form
      setFormData({ instructor_id: "", ficha_id: "", ambiente_id: "", jornada_id: "", competencia_ids: [], es_lider_ficha: false, horario_dias: [], horario_inicio: "", horario_fin: "", horario_tipo_actividad_id: "" })
      setCompetenciasPrograma([])
      setCompetenciasInstructor([])
      setRapsDisponibles({})
      setRapsSeleccionados({})
      setExpandedComps({})
    }
  }, [isOpen])

  // Load instructor competencias when instructor changes
  useEffect(() => {
    if (formData.instructor_id) {
      api.instructors.getCompetencias(Number(formData.instructor_id))
        .then((res) => {
          const ids = (res.data || []).map((c: any) => c.competencia_id || c.id)
          setCompetenciasInstructor(ids)
        })
        .catch(() => setCompetenciasInstructor([]))
    } else {
      setCompetenciasInstructor([])
    }
    // Reset selections when instructor changes
    setFormData((prev) => ({ ...prev, competencia_ids: [] }))
    setRapsDisponibles({})
    setRapsSeleccionados({})
    setExpandedComps({})
  }, [formData.instructor_id])

  // Load competencias del programa when ficha changes
  useEffect(() => {
    if (formData.ficha_id) {
      const ficha = fichas.find((f) => f.id === Number(formData.ficha_id))
      if (ficha?.programa_id) {
        setLoadingComps(true)
        api.catalogo.getCompetenciasByPrograma(ficha.programa_id)
          .then((res) => {
            setCompetenciasPrograma(res.data || [])
            setFormData((prev) => ({ ...prev, competencia_ids: [] }))
            setRapsDisponibles({})
            setRapsSeleccionados({})
            setExpandedComps({})
          })
          .catch(() => setCompetenciasPrograma([]))
          .finally(() => setLoadingComps(false))

        // Pre-fill ambiente and jornada from ficha
        setFormData((prev) => ({
          ...prev,
          ambiente_id: ficha.ambiente_id ? String(ficha.ambiente_id) : "",
          jornada_id: ficha.jornada_id ? String(ficha.jornada_id) : "",
        }))
      } else {
        setCompetenciasPrograma([])
      }
    } else {
      setCompetenciasPrograma([])
      setRapsDisponibles({})
      setRapsSeleccionados({})
    }
  }, [formData.ficha_id, fichas])

  // RAP helpers
  const cargarRaps = async (competenciaId: number) => {
    if (rapsDisponibles[competenciaId]) return
    setLoadingRaps((prev) => ({ ...prev, [competenciaId]: true }))
    try {
      const res = await api.competencias.getRaps(competenciaId)
      const raps = (res.data || []).filter((r: Rap) => r.activo)
      setRapsDisponibles((prev) => ({ ...prev, [competenciaId]: raps }))
    } catch {
      setRapsDisponibles((prev) => ({ ...prev, [competenciaId]: [] }))
    } finally {
      setLoadingRaps((prev) => ({ ...prev, [competenciaId]: false }))
    }
  }

  const toggleCompetencia = (id: number) => {
    const yaIncluida = formData.competencia_ids.includes(id)
    if (yaIncluida) {
      setFormData((prev) => ({
        ...prev,
        competencia_ids: prev.competencia_ids.filter((c) => c !== id),
      }))
      setRapsSeleccionados((prev) => { const n = { ...prev }; delete n[id]; return n })
      setExpandedComps((prev) => ({ ...prev, [id]: false }))
    } else {
      setFormData((prev) => ({
        ...prev,
        competencia_ids: [...prev.competencia_ids, id],
      }))
      cargarRaps(id)
      setExpandedComps((prev) => ({ ...prev, [id]: true }))
    }
  }

  const toggleRap = (competenciaId: number, rapId: number) => {
    setRapsSeleccionados((prev) => {
      const actuales = prev[competenciaId] || []
      const nuevos = actuales.includes(rapId)
        ? actuales.filter((r) => r !== rapId)
        : [...actuales, rapId]
      return { ...prev, [competenciaId]: nuevos }
    })
  }

  const toggleExpandComp = (compId: number) => {
    setExpandedComps((prev) => ({ ...prev, [compId]: !prev[compId] }))
    if (!rapsDisponibles[compId]) cargarRaps(compId)
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Habilitar competencia al instructor desde el wizard
  const habilitarCompetencia = async (competenciaId: number) => {
    if (!formData.instructor_id) return
    setHabilitandoCompId(competenciaId)
    try {
      await api.instructors.addCompetencia(Number(formData.instructor_id), { competencia_id: competenciaId })
      setCompetenciasInstructor((prev) => [...prev, competenciaId])
      showToast("Competencia habilitada para el instructor", "success")
    } catch (err: any) {
      showToast(err.message || "Error al habilitar competencia", "error")
    } finally {
      setHabilitandoCompId(null)
    }
  }

  // Validation per step
  const canAdvance = () => {
    if (step === 0) return !!formData.instructor_id && !!formData.ficha_id
    if (step === 1) return formData.competencia_ids.length > 0
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const tieneHorario = formData.horario_dias.length > 0 && formData.horario_inicio && formData.horario_fin
      const payload = {
        instructor_id: Number(formData.instructor_id),
        ficha_id: Number(formData.ficha_id),
        competencia_ids: formData.competencia_ids,
        es_lider_ficha: formData.es_lider_ficha,
        rapsSeleccionados,
        // Datos de horario (opcionales)
        ...(tieneHorario ? {
          horario: {
            dias: formData.horario_dias,
            hora_inicio: formData.horario_inicio,
            hora_fin: formData.horario_fin,
            jornada_id: Number(formData.jornada_id),
            ambiente_id: formData.ambiente_id ? Number(formData.ambiente_id) : null,
            tipo_actividad_id: formData.horario_tipo_actividad_id ? Number(formData.horario_tipo_actividad_id) : null,
          },
        } : {}),
      }
      await onSubmit(payload)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  // Count total RAPs selected
  const totalRaps = Object.values(rapsSeleccionados).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Nueva asignación</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => {
              const StepIcon = s.icon
              const isActive = i === step
              const isDone = i < step
              return (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        isDone
                          ? "bg-sena text-white"
                          : isActive
                          ? "bg-sena/10 text-sena border-2 border-sena"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isDone ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <span
                      className={`text-xs font-medium hidden sm:block ${
                        isActive ? "text-sena" : isDone ? "text-gray-700" : "text-gray-400"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-px flex-1 mx-2 ${i < step ? "bg-sena" : "bg-gray-200"}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Cargando datos...
            </div>
          ) : (
            <>
              {/* ─── PASO 1: Instructor + Grupo + Ambiente ─── */}
              {step === 0 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructor <span className="text-red-500">*</span>
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grupo <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.ficha_id}
                      onChange={(e) => handleChange("ficha_id", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                    >
                      <option value="">Seleccionar grupo</option>
                      {fichas.map((f) => (
                        <option key={f.id} value={f.id}>{f.numero_ficha} — {f.programa}</option>
                      ))}
                    </select>
                  </div>

                  {selectedFicha && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{selectedFicha.programa}</span>
                      </div>
                    </div>
                  )}

                  {selectedFicha && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jornada <span className="text-red-500">*</span></label>
                      <div className="flex flex-wrap gap-2">
                        {JORNADAS.map((j) => (
                          <button
                            key={j.id}
                            type="button"
                            onClick={() => handleChange("jornada_id", j.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                              formData.jornada_id === j.id
                                ? "bg-sena text-white border-sena"
                                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {j.nombre}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Horario — aparece al elegir jornada */}
                  {formData.jornada_id && selectedFicha && (
                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/50 space-y-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-sena" />
                        <span className="text-sm font-semibold text-gray-700">Horario</span>
                        <span className="text-xs text-gray-400">(opcional)</span>
                      </div>

                      {/* Días */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Días de la semana</label>
                        <div className="flex flex-wrap gap-1.5">
                          {DIAS_SEMANA.map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => {
                                const nuevosDias = formData.horario_dias.includes(d.id)
                                  ? formData.horario_dias.filter((x) => x !== d.id)
                                  : [...formData.horario_dias, d.id]
                                handleChange("horario_dias", nuevosDias)
                              }}
                              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
                                formData.horario_dias.includes(d.id)
                                  ? "bg-gray-800 text-white border-gray-800"
                                  : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {d.nombre}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Horas */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Hora inicio</label>
                          <input
                            type="time"
                            value={formData.horario_inicio}
                            onChange={(e) => handleChange("horario_inicio", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Hora fin</label>
                          <input
                            type="time"
                            value={formData.horario_fin}
                            onChange={(e) => handleChange("horario_fin", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                          />
                        </div>
                      </div>

                      {/* Tipo actividad */}
                      {tiposActividad.length > 0 && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de actividad</label>
                          <select
                            value={formData.horario_tipo_actividad_id}
                            onChange={(e) => handleChange("horario_tipo_actividad_id", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                          >
                            <option value="">Sin clasificar</option>
                            {tiposActividad.map((t) => (
                              <option key={t.id} value={t.id}>{t.nombre}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedFicha && (
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
                      <p className="text-xs text-gray-500 mt-1">Pre-seleccionado del grupo. Puedes cambiarlo si es necesario.</p>
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
                      <span className="text-sm font-medium text-gray-700">¿Es líder de este grupo?</span>
                      <p className="text-xs text-gray-500">Función administrativa.</p>
                    </div>
                  </div>
                </>
              )}

              {/* ─── PASO 2: Competencias y RAPs ─── */}
              {step === 1 && (
                <>
                  {/* Context card */}
                  <div className="p-3 bg-sena/5 rounded-lg border border-sena/20 flex items-center gap-3">
                    <User className="w-5 h-5 text-sena shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">{selectedInstructor?.nombre}</span>
                      <span className="text-gray-500"> → Grupo </span>
                      <span className="font-medium text-gray-900">{selectedFicha?.numero_ficha}</span>
                      {selectedAmbiente && (
                        <span className="text-gray-500"> · {selectedAmbiente.nombre}</span>
                      )}
                    </div>
                  </div>

                  {loadingComps ? (
                    <div className="flex items-center justify-center py-4 text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Cargando competencias...
                    </div>
                  ) : competencias.length > 0 ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Competencias habilitadas <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-1 max-h-72 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {competencias.map((c) => {
                          const isSelected = formData.competencia_ids.includes(c.id)
                          const isExpanded = expandedComps[c.id]
                          const raps = rapsDisponibles[c.id] || []
                          const isLoadingRaps = loadingRaps[c.id]
                          const selectedRapCount = (rapsSeleccionados[c.id] || []).length

                          return (
                            <div key={c.id} className="rounded-lg border border-gray-100">
                              <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleCompetencia(c.id)}
                                  className="w-4 h-4 text-sena border-gray-300 rounded focus:ring-sena"
                                />
                                <span className="text-sm text-gray-700 flex-1">{c.nombre}</span>
                                {isSelected && (
                                  <div className="flex items-center gap-2">
                                    {selectedRapCount > 0 && (
                                      <span className="text-xs bg-sena/10 text-sena px-2 py-0.5 rounded-full">
                                        {selectedRapCount} RAP{selectedRapCount > 1 ? "s" : ""}
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => toggleExpandComp(c.id)}
                                      className="p-1 text-gray-400 hover:text-gray-600"
                                    >
                                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                  </div>
                                )}
                              </div>

                              {isSelected && isExpanded && (
                                <div className="pl-9 pr-3 pb-3 space-y-1">
                                  {isLoadingRaps ? (
                                    <div className="flex items-center gap-2 text-gray-400 text-xs py-1">
                                      <Loader2 className="w-3 h-3 animate-spin" /> Cargando RAPs...
                                    </div>
                                  ) : raps.length > 0 ? (
                                    raps.map((rap) => {
                                      const rapId = rap.rap_id || rap.id || 0
                                      return (
                                        <label key={rapId} className="flex items-start gap-2 cursor-pointer p-1.5 rounded hover:bg-blue-50/50">
                                          <input
                                            type="checkbox"
                                            checked={(rapsSeleccionados[c.id] || []).includes(rapId)}
                                            onChange={() => toggleRap(c.id, rapId)}
                                            className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                                          />
                                          <div>
                                            <span className="text-xs font-mono text-gray-500">{rap.codigo}</span>
                                            <p className="text-xs text-gray-600">{rap.descripcion}</p>
                                          </div>
                                        </label>
                                      )
                                    })
                                  ) : (
                                    <p className="text-xs text-gray-400 py-1">Sin RAPs disponibles</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Competencias que el instructor tiene habilitadas y pertenecen al programa.
                      </p>
                    </div>
                  ) : competenciasPrograma.length === 0 ? (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                      El programa &ldquo;{selectedFicha?.programa}&rdquo; no tiene competencias registradas.
                    </div>
                  ) : null}

                  {/* Competencias del programa que el instructor NO tiene habilitadas */}
                  {competenciasNoHabilitadas.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Habilitar más competencias para {selectedInstructor?.nombre}
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        Estas competencias pertenecen al programa pero el instructor no las tiene habilitadas. Habilítalas aquí para poder asignarlas.
                      </p>
                      <div className="space-y-1 max-h-48 overflow-y-auto border border-amber-200 bg-amber-50/50 rounded-lg p-3">
                        {competenciasNoHabilitadas.map((c) => (
                          <div key={c.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white">
                            <span className="text-sm text-gray-700 flex-1">{c.nombre}</span>
                            <button
                              type="button"
                              onClick={() => habilitarCompetencia(c.id)}
                              disabled={habilitandoCompId === c.id}
                              className="ml-2 shrink-0 px-3 py-1 bg-sena text-white text-xs font-medium rounded-lg hover:bg-sena/90 disabled:opacity-50 flex items-center gap-1"
                            >
                              {habilitandoCompId === c.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              Habilitar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ─── PASO 3: Resumen ─── */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">Revisa los datos antes de confirmar:</p>

                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                    {/* Instructor */}
                    <div className="flex items-center gap-3 p-3 bg-white">
                      <User className="w-5 h-5 text-sena shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Instructor</p>
                        <p className="text-sm font-medium text-gray-900">{selectedInstructor?.nombre}</p>
                      </div>
                    </div>

                    {/* Grupo */}
                    <div className="flex items-center gap-3 p-3 bg-white">
                      <BookOpen className="w-5 h-5 text-sena shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Grupo</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedFicha?.numero_ficha} — {selectedFicha?.programa}
                        </p>
                      </div>
                    </div>

                    {/* Jornada */}
                    {selectedJornada && (
                      <div className="flex items-center gap-3 p-3 bg-white">
                        <Sun className="w-5 h-5 text-sena shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Jornada</p>
                          <p className="text-sm font-medium text-gray-900">{selectedJornada.nombre}</p>
                        </div>
                      </div>
                    )}

                    {/* Ambiente */}
                    <div className="flex items-center gap-3 p-3 bg-white">
                      <Building2 className="w-5 h-5 text-sena shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Ambiente</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedAmbiente?.nombre || "Sin asignar"}
                        </p>
                      </div>
                    </div>

                    {/* Competencias */}
                    <div className="p-3 bg-white">
                      <div className="flex items-center gap-3 mb-2">
                        <Layers className="w-5 h-5 text-sena shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Competencias y RAPs</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formData.competencia_ids.length} competencia{formData.competencia_ids.length > 1 ? "s" : ""}
                            {totalRaps > 0 && ` · ${totalRaps} RAP${totalRaps > 1 ? "s" : ""}`}
                          </p>
                        </div>
                      </div>
                      <div className="ml-8 space-y-1.5">
                        {formData.competencia_ids.map((cId) => {
                          const comp = competencias.find((c) => c.id === cId)
                          const rapCount = (rapsSeleccionados[cId] || []).length
                          return (
                            <div key={cId} className="text-xs text-gray-600 flex items-start gap-1.5">
                              <span className="text-sena mt-0.5">•</span>
                              <span>
                                {comp?.nombre}
                                {rapCount > 0 && (
                                  <span className="text-gray-400 ml-1">({rapCount} RAP{rapCount > 1 ? "s" : ""})</span>
                                )}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Horario */}
                    {formData.horario_dias.length > 0 && formData.horario_inicio && formData.horario_fin ? (
                      <div className="flex items-center gap-3 p-3 bg-white">
                        <Clock className="w-5 h-5 text-sena shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Horario</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formData.horario_dias.map((d) => DIAS_SEMANA.find((ds) => ds.id === d)?.nombre).join(", ")} · {formData.horario_inicio} - {formData.horario_fin}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-gray-50">
                        <Clock className="w-5 h-5 text-gray-300 shrink-0" />
                        <p className="text-sm text-gray-400">Sin horario — se puede asignar después</p>
                      </div>
                    )}

                    {/* Líder */}
                    {formData.es_lider_ficha && (
                      <div className="flex items-center gap-3 p-3 bg-sena/5">
                        <Check className="w-5 h-5 text-sena shrink-0" />
                        <p className="text-sm text-sena font-medium">Asignado como líder del grupo</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with navigation */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={step === 0 ? onClose : () => setStep(step - 1)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            {step === 0 ? (
              "Cancelar"
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                Atrás
              </>
            )}
          </button>

          {step < 2 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance()}
              className="px-4 py-2.5 bg-sena hover:bg-sena/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2.5 bg-sena hover:bg-sena/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Confirmar asignación
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
