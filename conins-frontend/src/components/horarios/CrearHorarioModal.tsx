import { useState, useEffect, useMemo } from "react"
import { X, Loader2, User, BookOpen, Hash, Info, Building2, Sun, ChevronDown, ChevronUp, GraduationCap } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"

type CrearHorarioModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  prefill?: { jornadaKey?: string; dia?: number }
}

type AsignacionRaw = {
  id: number
  instructor_nombre: string
  ficha_numero: string
  competencia: string
  competencia_id: number
  instructor_id: number
  ficha_id: number
  ambiente_id: number | null
  ambiente?: string
  jornada_id: number | null
  jornada?: string
  activo: boolean
  tipo?: string
}

type AsignacionAgrupada = {
  key: string
  instructor_id: number
  instructor_nombre: string
  ficha_id: number
  ficha_numero: string
  ambiente_id: number | null
  ambiente_nombre: string
  jornada_id: number | null
  jornada_nombre: string
  competencias: {
    asignacion_id: number
    competencia_id: number
    nombre: string
  }[]
}

type Rap = { rap_id: number; codigo: string; descripcion: string }

type Ambiente = {
  id: number
  nombre: string
}

type TipoActividad = {
  id: number
  nombre: string
  suma_carga_horaria: boolean
  requiere_ficha: boolean
  requiere_ambiente: boolean
  requiere_competencia: boolean
}

type InstructorBasico = {
  id: number
  nombre: string
}

type ProgramaBasico = {
  id: number
  codigo: string
  nombre: string
  tipo_formacion: string
}

const JORNADAS = [
  { id: 1, nombre: "Mañana" },
  { id: 2, nombre: "Mixta" },
  { id: 3, nombre: "Noche" },
  { id: 4, nombre: "Virtual" },
]

const DIAS_SEMANA = [
  { id: 1, nombre: "Lun" },
  { id: 2, nombre: "Mar" },
  { id: 3, nombre: "Mié" },
  { id: 4, nombre: "Jue" },
  { id: 5, nombre: "Vie" },
  { id: 6, nombre: "Sáb" },
]

export default function CrearHorarioModal({ isOpen, onClose, onSubmit, prefill }: CrearHorarioModalProps) {
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [asignacionesRaw, setAsignacionesRaw] = useState<AsignacionRaw[]>([])
  const [ambientes, setAmbientes] = useState<Ambiente[]>([])
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([])
  const [loading, setLoading] = useState(false)
  const [rapsDisponibles, setRapsDisponibles] = useState<Rap[]>([])
  const [loadingRaps, setLoadingRaps] = useState(false)
  const [showCompetencias, setShowCompetencias] = useState(false)

  // Modo complementaria
  const [modoComplementaria, setModoComplementaria] = useState(false)
  const [instructores, setInstructores] = useState<InstructorBasico[]>([])
  const [programas, setProgramas] = useState<ProgramaBasico[]>([])

  // Form data para modo normal
  const [formData, setFormData] = useState({
    grupo_key: "",
    competencia_id: "",
    dias: [] as number[],
    hora_inicio: "",
    hora_fin: "",
    jornada_id: "",
    ambiente_id: "",
    tipo_actividad_id: "",
    rap_id: "",
  })

  // Form data para modo complementaria
  const [formCompl, setFormCompl] = useState({
    instructor_id: "",
    programa_id: "",
    modalidad: "presencial" as "presencial" | "virtual",
    observaciones: "",
    dias: [] as number[],
    hora_inicio: "",
    hora_fin: "",
    jornada_id: "",
    ambiente_id: "",
    fecha_inicio: "",
    fecha_fin: "",
  })

  // Agrupar asignaciones por instructor+grupo (solo activas)
  const asignacionesAgrupadas = useMemo(() => {
    const activas = asignacionesRaw.filter((a) => a.activo === true || a.activo === 1 as any)
    const grupos: Record<string, AsignacionAgrupada> = {}

    for (const a of activas) {
      const key = `${a.instructor_id}-${a.ficha_id}`
      if (!grupos[key]) {
        const jornadaNombre = a.jornada || JORNADAS.find((j) => j.id === a.jornada_id)?.nombre || ""
        grupos[key] = {
          key,
          instructor_id: a.instructor_id,
          instructor_nombre: a.instructor_nombre,
          ficha_id: a.ficha_id,
          ficha_numero: a.ficha_numero,
          ambiente_id: a.ambiente_id,
          ambiente_nombre: a.ambiente || "",
          jornada_id: a.jornada_id,
          jornada_nombre: jornadaNombre,
          competencias: [],
        }
      }
      // Evitar duplicados de competencia
      if (!grupos[key].competencias.some((c) => c.competencia_id === a.competencia_id)) {
        grupos[key].competencias.push({
          asignacion_id: a.id,
          competencia_id: a.competencia_id,
          nombre: a.competencia,
        })
      }
    }

    return Object.values(grupos)
  }, [asignacionesRaw])

  const selectedGrupo = asignacionesAgrupadas.find((g) => g.key === formData.grupo_key) || null

  // Programas complementarios filtrados
  const programasComplementarios = useMemo(() => {
    return programas
  }, [programas])

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      Promise.all([
        api.assignments.getAll().then((res) => setAsignacionesRaw(res.data || [])).catch(() => setAsignacionesRaw([])),
        api.ambientes.getAll().then((res) => setAmbientes(res.data || [])).catch(() => setAmbientes([])),
        api.catalogo.getTiposActividad().then((res) => setTiposActividad(res.data || [])).catch(() => setTiposActividad([])),
        api.instructors.getAll().then((res) => setInstructores(res.data || [])).catch(() => setInstructores([])),
        api.programs.getAll().then((res) => setProgramas(res.data || [])).catch(() => setProgramas([])),
      ]).finally(() => setLoading(false))

      // Reset
      setModoComplementaria(false)
      setFormData({
        grupo_key: "",
        competencia_id: "",
        dias: [],
        hora_inicio: "",
        hora_fin: "",
        jornada_id: "",
        ambiente_id: "",
        tipo_actividad_id: "",
        rap_id: "",
      })
      setFormCompl({
        instructor_id: "",
        programa_id: "",
        modalidad: "presencial",
        observaciones: "",
        dias: [],
        hora_inicio: "",
        hora_fin: "",
        jornada_id: "",
        ambiente_id: "",
        fecha_inicio: "",
        fecha_fin: "",
      })
      setRapsDisponibles([])
      setShowCompetencias(false)

      // Pre-fill from grid click
      if (prefill) {
        const jornadaMap: Record<string, string> = { manana: "1", mixta: "2", noche: "3" }
        const jId = prefill.jornadaKey ? jornadaMap[prefill.jornadaKey] || "" : ""
        const dias = prefill.dia ? [prefill.dia] : []
        setFormData((prev) => ({ ...prev, jornada_id: jId, dias }))
        setFormCompl((prev) => ({ ...prev, jornada_id: jId, dias }))
      }
    }
  }, [isOpen])

  // Auto-llenar jornada y ambiente cuando se selecciona un grupo
  useEffect(() => {
    if (formData.grupo_key && selectedGrupo) {
      setFormData((prev) => ({
        ...prev,
        jornada_id: selectedGrupo.jornada_id ? String(selectedGrupo.jornada_id) : prev.jornada_id,
        ambiente_id: selectedGrupo.ambiente_id ? String(selectedGrupo.ambiente_id) : prev.ambiente_id,
        competencia_id: "",
        rap_id: "",
      }))
      setRapsDisponibles([])
      setShowCompetencias(true)
    }
  }, [formData.grupo_key])

  // Cargar RAPs cuando se selecciona una competencia
  useEffect(() => {
    if (formData.competencia_id && selectedGrupo) {
      const comp = selectedGrupo.competencias.find((c) => c.competencia_id === Number(formData.competencia_id))
      if (comp) {
        setLoadingRaps(true)
        api.assignments.getRapsByCompetencia(comp.asignacion_id, comp.competencia_id)
          .then((res) => setRapsDisponibles(res.data || []))
          .catch(() => setRapsDisponibles([]))
          .finally(() => setLoadingRaps(false))
      }
    } else {
      setRapsDisponibles([])
    }
    setFormData((prev) => ({ ...prev, rap_id: "" }))
  }, [formData.competencia_id])

  if (!isOpen) return null

  // --- Submit normal ---
  const handleSubmitNormal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGrupo) return
    setSubmitting(true)
    try {
      const finalAmbienteId = formData.ambiente_id ? Number(formData.ambiente_id) : selectedGrupo.ambiente_id

      if (!finalAmbienteId) {
        showToast("Este grupo no tiene un ambiente asignado. Por favor selecciona uno manualmente.", "error")
        setSubmitting(false)
        return
      }

      const compSeleccionada = formData.competencia_id
        ? selectedGrupo.competencias.find((c) => c.competencia_id === Number(formData.competencia_id))
        : selectedGrupo.competencias[0]

      const payload = {
        ficha_id: selectedGrupo.ficha_id,
        instructor_id: selectedGrupo.instructor_id,
        competencia_id: compSeleccionada?.competencia_id || selectedGrupo.competencias[0].competencia_id,
        dias: formData.dias,
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin,
        jornada_id: Number(formData.jornada_id),
        ambiente_id: finalAmbienteId,
        tipo_actividad_id: formData.tipo_actividad_id ? Number(formData.tipo_actividad_id) : null,
        rap_id: formData.rap_id ? Number(formData.rap_id) : null,
      }
      await onSubmit(payload)
      setFormData({
        grupo_key: "",
        competencia_id: "",
        dias: [],
        hora_inicio: "",
        hora_fin: "",
        jornada_id: "",
        ambiente_id: "",
        tipo_actividad_id: "",
        rap_id: "",
      })
      setRapsDisponibles([])
    } catch (err: any) {
      showToast(err.message || "Error al registrar horario", "error")
    } finally {
      setSubmitting(false)
    }
  }

  // --- Submit complementaria ---
  const handleSubmitComplementaria = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCompl.instructor_id || !formCompl.programa_id) {
      showToast("Selecciona instructor y programa", "error")
      return
    }
    if (formCompl.dias.length === 0) {
      showToast("Selecciona al menos un día", "error")
      return
    }
    if (!formCompl.jornada_id) {
      showToast("Selecciona una jornada", "error")
      return
    }
    if (!formCompl.fecha_inicio) {
      showToast("Selecciona una fecha de inicio", "error")
      return
    }
    if (formCompl.fecha_fin && formCompl.fecha_fin < formCompl.fecha_inicio) {
      showToast("La fecha fin debe ser igual o posterior a la fecha de inicio", "error")
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        es_complementaria: true,
        instructor_id: Number(formCompl.instructor_id),
        programa_id: Number(formCompl.programa_id),
        modalidad: formCompl.modalidad,
        observaciones: formCompl.observaciones || undefined,
        fecha_inicio: formCompl.fecha_inicio,
        fecha_fin: formCompl.fecha_fin || null,
        dias: formCompl.dias,
        hora_inicio: formCompl.hora_inicio,
        hora_fin: formCompl.hora_fin,
        jornada_id: Number(formCompl.jornada_id),
        ambiente_id: formCompl.ambiente_id ? Number(formCompl.ambiente_id) : undefined,
      }
      await onSubmit(payload)
      setFormCompl({
        instructor_id: "",
        programa_id: "",
        modalidad: "presencial",
        observaciones: "",
        dias: [],
        hora_inicio: "",
        hora_fin: "",
        jornada_id: "",
        ambiente_id: "",
        fecha_inicio: "",
        fecha_fin: "",
      })
    } catch (err: any) {
      showToast(err.message || "Error al registrar horario", "error")
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleChangeCompl = (field: string, value: any) => {
    setFormCompl({ ...formCompl, [field]: value })
  }

  const toggleDia = (id: number) => {
    if (modoComplementaria) {
      const nuevosDias = formCompl.dias.includes(id)
        ? formCompl.dias.filter((d) => d !== id)
        : [...formCompl.dias, id]
      setFormCompl({ ...formCompl, dias: nuevosDias })
    } else {
      const nuevosDias = formData.dias.includes(id)
        ? formData.dias.filter((d) => d !== id)
        : [...formData.dias, id]
      setFormData({ ...formData, dias: nuevosDias })
    }
  }

  const diasSeleccionados = modoComplementaria ? formCompl.dias : formData.dias
  const jornadaSeleccionada = modoComplementaria ? formCompl.jornada_id : formData.jornada_id

  const canSubmitNormal = selectedGrupo && formData.dias.length > 0 && formData.jornada_id && formData.hora_inicio && formData.hora_fin
  const canSubmitCompl = formCompl.instructor_id && formCompl.programa_id && formCompl.dias.length > 0 && formCompl.jornada_id && formCompl.hora_inicio && formCompl.hora_fin

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Registrar horario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={modoComplementaria ? handleSubmitComplementaria : handleSubmitNormal} className="p-4 md:p-6 space-y-5 overflow-y-auto flex-1">

          {/* Toggle modo */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setModoComplementaria(false)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                !modoComplementaria
                  ? "bg-sena text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Formación regular
            </button>
            <button
              type="button"
              onClick={() => setModoComplementaria(true)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                modoComplementaria
                  ? "bg-sena text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              F. Complementaria
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Cargando datos...
            </div>
          ) : modoComplementaria ? (
            /* ===== MODO COMPLEMENTARIA ===== */
            <>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-start gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-emerald-700">
                    La formación complementaria no está atada a un grupo ni a competencias/RAPs. Se vincula a un programa complementario y suma a la carga horaria del instructor.
                  </p>
                </div>
              </div>

              {/* Instructor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructor <span className="text-red-500">*</span></label>
                <select
                  required
                  value={formCompl.instructor_id}
                  onChange={(e) => handleChangeCompl("instructor_id", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                >
                  <option value="">Seleccionar instructor</option>
                  {instructores.map((i) => (
                    <option key={i.id} value={i.id}>{i.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Programa complementario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Programa complementario <span className="text-red-500">*</span></label>
                <select
                  required
                  value={formCompl.programa_id}
                  onChange={(e) => handleChangeCompl("programa_id", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                >
                  <option value="">Seleccionar programa</option>
                  {programasComplementarios.map((p) => (
                    <option key={p.id} value={p.id}>{p.codigo} — {p.nombre}</option>
                  ))}
                </select>
                {programasComplementarios.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">No hay programas de tipo complementario registrados.</p>
                )}
              </div>

              {/* Modalidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Modalidad <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  {(["presencial", "virtual"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleChangeCompl("modalidad", m)}
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                        formCompl.modalidad === m
                          ? "bg-sena text-white border-sena"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {m === "presencial" ? "Presencial" : "Virtual"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fechas de vigencia */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/50 space-y-3">
                <span className="text-sm font-semibold text-gray-700">Vigencia</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fecha inicio <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={formCompl.fecha_inicio}
                      onChange={(e) => handleChangeCompl("fecha_inicio", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fecha fin</label>
                    <input
                      type="date"
                      value={formCompl.fecha_fin}
                      min={formCompl.fecha_inicio || undefined}
                      onChange={(e) => handleChangeCompl("fecha_fin", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">Vacío en fecha fin = una sola semana.</p>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea
                  value={formCompl.observaciones}
                  onChange={(e) => handleChangeCompl("observaciones", e.target.value)}
                  rows={2}
                  placeholder="Ej: Refuerzo de inglés"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 resize-none"
                />
              </div>

              {/* --- Datos del horario (compartidos) --- */}
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos del horario</p>

                {/* Días */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Días de la semana <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {DIAS_SEMANA.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleDia(d.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                          diasSeleccionados.includes(d.id)
                            ? "bg-gray-800 text-white border-gray-800"
                            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {d.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Jornada */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jornada <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {JORNADAS.map((j) => (
                      <button
                        key={j.id}
                        type="button"
                        onClick={() => handleChangeCompl("jornada_id", String(j.id))}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                          Number(jornadaSeleccionada) === j.id
                            ? "bg-sena text-white border-sena"
                            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {j.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horas */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio <span className="text-red-500">*</span></label>
                    <input
                      type="time"
                      required
                      value={formCompl.hora_inicio}
                      onChange={(e) => handleChangeCompl("hora_inicio", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin <span className="text-red-500">*</span></label>
                    <input
                      type="time"
                      required
                      value={formCompl.hora_fin}
                      onChange={(e) => handleChangeCompl("hora_fin", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                    />
                  </div>
                </div>

                {/* Ambiente (opcional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente <span className="text-xs text-gray-400">(opcional)</span></label>
                  <select
                    value={formCompl.ambiente_id}
                    onChange={(e) => handleChangeCompl("ambiente_id", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                  >
                    <option value="">Sin asignar</option>
                    {ambientes.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ) : asignacionesAgrupadas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No hay asignaciones activas disponibles.</p>
              <p className="text-xs mt-1">Crea una asignación primero para poder registrar horarios.</p>
            </div>
          ) : (
            /* ===== MODO NORMAL ===== */
            <>
              {/* Selector de asignación agrupada */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asignación <span className="text-red-500">*</span></label>
                <select
                  required
                  value={formData.grupo_key}
                  onChange={(e) => handleChange("grupo_key", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                >
                  <option value="">Seleccionar asignación</option>
                  {asignacionesAgrupadas.map((g) => (
                    <option key={g.key} value={g.key}>
                      {g.instructor_nombre} — Grupo {g.ficha_numero} ({g.competencias.length} comp.)
                    </option>
                  ))}
                </select>
              </div>

              {/* Resumen completo de la asignación */}
              {selectedGrupo && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-medium">{selectedGrupo.instructor_nombre}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Hash className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>Grupo {selectedGrupo.ficha_numero}</span>
                  </div>
                  {selectedGrupo.jornada_nombre && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Sun className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>{selectedGrupo.jornada_nombre}</span>
                    </div>
                  )}
                  {selectedGrupo.ambiente_nombre && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>{selectedGrupo.ambiente_nombre}</span>
                    </div>
                  )}

                  {/* Competencias de esta asignación */}
                  <div className="pt-2 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowCompetencias(!showCompetencias)}
                      className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-sena transition-colors w-full"
                    >
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <span>{selectedGrupo.competencias.length} competencia{selectedGrupo.competencias.length > 1 ? "s" : ""} asignada{selectedGrupo.competencias.length > 1 ? "s" : ""}</span>
                      {showCompetencias ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                    </button>
                    {showCompetencias && (
                      <ul className="mt-2 space-y-1.5">
                        {selectedGrupo.competencias.map((c) => (
                          <li key={c.competencia_id} className="text-xs text-gray-600 pl-6 py-1 bg-white rounded border border-gray-100">
                            {c.nombre}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex items-start gap-2 pt-2 border-t border-gray-200">
                    <Info className="w-3.5 h-3.5 text-sena mt-0.5 shrink-0" />
                    <span className="text-xs text-sena">Datos pre-llenados desde la asignación. Solo completa el horario abajo.</span>
                  </div>
                </div>
              )}

              {selectedGrupo && (
                <>
                  {/* Competencia específica para este bloque */}
                  {selectedGrupo.competencias.length > 1 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Competencia para este bloque</label>
                      <select
                        value={formData.competencia_id}
                        onChange={(e) => handleChange("competencia_id", e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                      >
                        <option value="">Todas las competencias</option>
                        {selectedGrupo.competencias.map((c) => (
                          <option key={c.competencia_id} value={c.competencia_id}>{c.nombre}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Si este bloque es para una competencia específica, selecciónala.</p>
                    </div>
                  )}

                  {/* RAP (solo si hay competencia seleccionada y tiene RAPs) */}
                  {formData.competencia_id && rapsDisponibles.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">RAP a dictar</label>
                      <select
                        value={formData.rap_id}
                        onChange={(e) => handleChange("rap_id", e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                      >
                        <option value="">Sin especificar</option>
                        {rapsDisponibles.map((r) => (
                          <option key={r.rap_id} value={r.rap_id}>
                            {r.codigo} — {r.descripcion}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {loadingRaps && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Loader2 className="w-3 h-3 animate-spin" /> Cargando RAPs...
                    </div>
                  )}

                  {/* --- DATOS DEL HORARIO --- */}
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos del horario</p>

                    {/* Días */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Días de la semana <span className="text-red-500">*</span></label>
                      <div className="flex flex-wrap gap-2">
                        {DIAS_SEMANA.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => toggleDia(d.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                              diasSeleccionados.includes(d.id)
                                ? "bg-gray-800 text-white border-gray-800"
                                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {d.nombre}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Jornada */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jornada <span className="text-red-500">*</span>
                        {selectedGrupo.jornada_id && <span className="text-xs text-sena ml-2">(de la asignación)</span>}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {JORNADAS.map((j) => (
                          <button
                            key={j.id}
                            type="button"
                            onClick={() => handleChange("jornada_id", String(j.id))}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                              Number(jornadaSeleccionada) === j.id
                                ? "bg-sena text-white border-sena"
                                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {j.nombre}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Horas */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
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

                    {/* Ambiente */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ambiente
                        {selectedGrupo.ambiente_id && <span className="text-xs text-sena ml-2">(de la asignación)</span>}
                      </label>
                      <select
                        value={formData.ambiente_id}
                        onChange={(e) => handleChange("ambiente_id", e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                      >
                        <option value="">Sin asignar (usa el del grupo)</option>
                        {ambientes.map((a) => (
                          <option key={a.id} value={a.id}>{a.nombre}</option>
                        ))}
                      </select>
                    </div>

                    {/* Tipo de actividad */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de actividad</label>
                      <select
                        value={formData.tipo_actividad_id}
                        onChange={(e) => handleChange("tipo_actividad_id", e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                      >
                        <option value="">Sin clasificar</option>
                        {tiposActividad.map((t) => (
                          <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Clasifica el tipo de actividad para el cálculo de carga horaria.</p>
                    </div>
                  </div>
                </>
              )}
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
              disabled={submitting || loading || (modoComplementaria ? !canSubmitCompl : !canSubmitNormal)}
              className={`px-4 py-2.5 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2 ${
                modoComplementaria ? "bg-sena hover:bg-sena/90" : "bg-sena hover:bg-sena/90"
              }`}
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
