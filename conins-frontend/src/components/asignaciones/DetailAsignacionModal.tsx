import { useState, useEffect } from "react"
import { X, User, BookOpen, MapPin, Clock, Star, FileText, Calendar, Loader2, CheckCircle, AlertCircle, Plus, ChevronDown, ChevronUp } from "lucide-react"
import { formatJornada } from "@/lib/terminology"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"

type Asignacion = {
  id: number
  instructor_id?: number
  ficha_id?: number
  competencia_id?: number
  instructor_nombre: string
  ficha_numero: string
  competencia: string
  ambiente: string
  ambiente_id?: number | null
  jornada: string
  jornada_id?: number | null
  es_lider: boolean
  tipo: "activa" | "provisional" | "historica"
  autorizado_por?: string
  fecha_autorizacion?: string
  motivo?: string
}

type Rap = {
  rap_id: number
  codigo: string
  descripcion: string
}

type HorarioRap = {
  id: number
  dias: string[]
  horas: string
  hora_inicio?: string
  hora_fin?: string
  rap_id: number | null
  rap_codigo?: string | null
  rap_descripcion?: string | null
  estado?: string
}

type TipoActividad = {
  id: number
  nombre: string
}

type DetailAsignacionModalProps = {
  isOpen: boolean
  onClose: () => void
  asignacion: Asignacion | null
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

const DIAS_NOMBRES: Record<string, string> = {
  "1": "Lun", "2": "Mar", "3": "Mié", "4": "Jue", "5": "Vie", "6": "Sáb",
  "Lun": "Lun", "Mar": "Mar", "Mié": "Mié", "Jue": "Jue", "Vie": "Vie", "Sáb": "Sáb",
}

export default function DetailAsignacionModal({ isOpen, onClose, asignacion }: DetailAsignacionModalProps) {
  const { showToast } = useToast()
  const [raps, setRaps] = useState<Rap[]>([])
  const [horarios, setHorarios] = useState<HorarioRap[]>([])
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([])
  const [loading, setLoading] = useState(false)

  // Formulario de horario inline
  const [creandoParaRapId, setCreandoParaRapId] = useState<number | null>(null)
  const [creandoGeneral, setCreandoGeneral] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formHorario, setFormHorario] = useState({
    dias: [] as number[],
    hora_inicio: "",
    hora_fin: "",
    jornada_id: "",
    tipo_actividad_id: "",
  })

  const cargarDatos = () => {
    if (!asignacion) return
    setLoading(true)
    Promise.all([
      asignacion.competencia_id
        ? api.assignments.getRapsByCompetencia(asignacion.id, asignacion.competencia_id)
            .then((res) => setRaps(res.data || []))
            .catch(() => setRaps([]))
        : api.assignments.getRaps(asignacion.id)
            .then((res) => setRaps(res.data || []))
            .catch(() => setRaps([])),
      api.horarios.getAll()
        .then((res) => {
          const todos = res.data || []
          const deEsta = todos.filter((h: any) =>
            h.asignacion_id === asignacion.id ||
            (h.instructor_nombre === asignacion.instructor_nombre &&
             h.ficha_numero === asignacion.ficha_numero &&
             h.competencia === asignacion.competencia)
          )
          setHorarios(deEsta)
        })
        .catch(() => setHorarios([])),
      api.catalogo.getTiposActividad()
        .then((res) => setTiposActividad(res.data || []))
        .catch(() => setTiposActividad([])),
    ]).finally(() => setLoading(false))
  }

  useEffect(() => {
    if (isOpen && asignacion) {
      cargarDatos()
      resetForm()
    }
  }, [isOpen, asignacion])

  if (!isOpen || !asignacion) return null

  const resetForm = () => {
    setCreandoParaRapId(null)
    setCreandoGeneral(false)
    setFormHorario({
      dias: [],
      hora_inicio: "",
      hora_fin: "",
      jornada_id: asignacion?.jornada_id ? String(asignacion.jornada_id) : "",
      tipo_actividad_id: "",
    })
  }

  const abrirFormulario = (rapId: number | null) => {
    // Detectar jornada_id desde el nombre si no viene como ID
    let jornadaId = asignacion.jornada_id ? String(asignacion.jornada_id) : ""
    if (!jornadaId && asignacion.jornada) {
      const j = JORNADAS.find((j) => j.nombre.toLowerCase() === asignacion.jornada.toLowerCase())
      if (j) jornadaId = String(j.id)
    }

    setFormHorario({
      dias: [],
      hora_inicio: "",
      hora_fin: "",
      jornada_id: jornadaId,
      tipo_actividad_id: "",
    })
    if (rapId !== null) {
      setCreandoParaRapId(rapId)
      setCreandoGeneral(false)
    } else {
      setCreandoGeneral(true)
      setCreandoParaRapId(null)
    }
  }

  const toggleDia = (id: number) => {
    setFormHorario((prev) => ({
      ...prev,
      dias: prev.dias.includes(id) ? prev.dias.filter((d) => d !== id) : [...prev.dias, id],
    }))
  }

  const handleCrearHorario = async () => {
    if (formHorario.dias.length === 0 || !formHorario.hora_inicio || !formHorario.hora_fin || !formHorario.jornada_id) {
      showToast("Completa días, horas y jornada", "error")
      return
    }

    setSubmitting(true)
    try {
      const now = new Date()
      const day = now.getDay()
      const diff = day === 0 ? -6 : 1 - day
      const lunes = new Date(now)
      lunes.setDate(now.getDate() + diff)
      const semana = lunes.toISOString().split("T")[0]

      // Detectar ambiente_id
      let ambienteId = asignacion.ambiente_id
      if (!ambienteId && asignacion.ambiente) {
        // Intentar buscar por nombre
        try {
          const ambRes = await api.ambientes.getAll()
          const found = (ambRes.data || []).find((a: any) => a.nombre === asignacion.ambiente)
          if (found) ambienteId = found.id
        } catch {}
      }

      for (const dia of formHorario.dias) {
        const payload: any = {
          ficha_id: asignacion.ficha_id,
          instructor_id: asignacion.instructor_id,
          competencia_id: asignacion.competencia_id,
          dia_semana: dia,
          hora_inicio: formHorario.hora_inicio,
          hora_fin: formHorario.hora_fin,
          jornada_id: Number(formHorario.jornada_id),
          ambiente_id: ambienteId || null,
          tipo_actividad_id: formHorario.tipo_actividad_id ? Number(formHorario.tipo_actividad_id) : null,
          rap_id: creandoParaRapId || null,
          semana,
        }
        await api.horarios.create(payload)
      }

      showToast("Horario registrado exitosamente", "success")
      resetForm()
      cargarDatos()
    } catch (err: any) {
      showToast(err.message || "Error al registrar horario", "error")
    } finally {
      setSubmitting(false)
    }
  }

  // Cruzar RAPs con horarios
  const rapsConHorario = raps.map((rap) => {
    const horariosDeEsteRap = horarios.filter((h) => h.rap_id === rap.rap_id)
    return { ...rap, horarios: horariosDeEsteRap }
  })

  const horariosSinRap = horarios.filter((h) => !h.rap_id)

  const formatDias = (dias: string[]) => {
    if (!dias || dias.length === 0) return ""
    return dias.map((d) => DIAS_NOMBRES[d] || d).join(", ")
  }

  const formatHoras = (h: HorarioRap) => {
    if (h.hora_inicio && h.hora_fin) return `${h.hora_inicio} - ${h.hora_fin}`
    if (h.horas) return h.horas
    return ""
  }

  const mostrandoFormulario = creandoParaRapId !== null || creandoGeneral
  const esActiva = asignacion.tipo === "activa"

  // Formulario inline reutilizable
  const FormularioHorario = () => (
    <div className="mt-3 p-3 bg-white rounded-lg border border-sena/30 space-y-3">
      {/* Días */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Días <span className="text-red-500">*</span></label>
        <div className="flex flex-wrap gap-1.5">
          {DIAS_SEMANA.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => toggleDia(d.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
                formHorario.dias.includes(d.id)
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
          <label className="block text-xs font-medium text-gray-600 mb-1">Inicio <span className="text-red-500">*</span></label>
          <input
            type="time"
            value={formHorario.hora_inicio}
            onChange={(e) => setFormHorario({ ...formHorario, hora_inicio: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Fin <span className="text-red-500">*</span></label>
          <input
            type="time"
            value={formHorario.hora_fin}
            onChange={(e) => setFormHorario({ ...formHorario, hora_fin: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
          />
        </div>
      </div>

      {/* Jornada */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Jornada <span className="text-red-500">*</span></label>
        <div className="flex flex-wrap gap-1.5">
          {JORNADAS.map((j) => (
            <button
              key={j.id}
              type="button"
              onClick={() => setFormHorario({ ...formHorario, jornada_id: String(j.id) })}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors border ${
                Number(formHorario.jornada_id) === j.id
                  ? "bg-sena text-white border-sena"
                  : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {j.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Tipo actividad */}
      {tiposActividad.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de actividad</label>
          <select
            value={formHorario.tipo_actividad_id}
            onChange={(e) => setFormHorario({ ...formHorario, tipo_actividad_id: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
          >
            <option value="">Sin clasificar</option>
            {tiposActividad.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>
      )}

      {/* Botones */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={resetForm}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleCrearHorario}
          disabled={submitting}
          className="px-3 py-1.5 bg-sena hover:bg-sena/90 text-white rounded text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Guardar horario
        </button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Detalle de asignación</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-sena/10 flex items-center justify-center">
              <User className="w-6 h-6 text-sena" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{asignacion.instructor_nombre}</h3>
              <p className="text-sm text-gray-500">Grupo {asignacion.ficha_numero}</p>
            </div>
          </div>

          {/* Info general */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Competencia</p>
                <p className="text-sm text-gray-900">{asignacion.competencia}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Ambiente</p>
                <p className="text-sm text-gray-900">{asignacion.ambiente || "Sin asignar"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Jornada</p>
                <p className="text-sm text-gray-900">{formatJornada(asignacion.jornada)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Líder</p>
                <p className="text-sm text-gray-900">{asignacion.es_lider ? "Sí" : "No"}</p>
              </div>
            </div>
          </div>

          {/* RAPs y horarios */}
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4" />
              RAPs y sus horarios
            </h4>

            {loading ? (
              <div className="flex items-center justify-center py-4 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm">Cargando...</span>
              </div>
            ) : raps.length === 0 && horarios.length === 0 ? (
              <div>
                <p className="text-sm text-gray-400 py-2">No hay RAPs registrados para esta asignación.</p>
                {esActiva && (
                  <div className="mt-2">
                    {!creandoGeneral ? (
                      <button
                        onClick={() => abrirFormulario(null)}
                        className="flex items-center gap-1.5 text-xs font-medium text-sena hover:text-sena/80 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Crear horario general
                      </button>
                    ) : (
                      <FormularioHorario />
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {rapsConHorario.map((rap) => (
                  <div
                    key={rap.rap_id}
                    className={`p-3 rounded-lg border ${
                      rap.horarios.length > 0 ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {rap.horarios.length > 0 ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">
                          <span className="text-xs text-gray-500 mr-1">{rap.codigo}</span>
                          {rap.descripcion}
                        </p>
                        {rap.horarios.length > 0 ? (
                          <div className="mt-1 space-y-0.5">
                            {rap.horarios.map((h) => (
                              <p key={h.id} className="text-xs text-green-700">
                                {formatDias(h.dias)} · {formatHoras(h)}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs text-gray-400 mt-1">Sin horario asignado</p>
                            {esActiva && creandoParaRapId !== rap.rap_id && (
                              <button
                                onClick={() => abrirFormulario(rap.rap_id)}
                                disabled={mostrandoFormulario}
                                className="flex items-center gap-1 mt-1.5 text-xs font-medium text-sena hover:text-sena/80 transition-colors disabled:opacity-40"
                              >
                                <Plus className="w-3 h-3" />
                                Asignar horario
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Formulario inline para este RAP */}
                    {creandoParaRapId === rap.rap_id && <FormularioHorario />}
                  </div>
                ))}

                {/* Horarios generales */}
                {horariosSinRap.length > 0 && (
                  <>
                    <p className="text-xs text-gray-500 font-medium mt-3 pt-2 border-t border-gray-100">Horarios generales</p>
                    {horariosSinRap.map((h) => (
                      <div key={h.id} className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                          <p className="text-sm text-blue-800">
                            {formatDias(h.dias)} · {formatHoras(h)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Botón para crear horario general */}
                {esActiva && !mostrandoFormulario && (
                  <button
                    onClick={() => abrirFormulario(null)}
                    className="flex items-center gap-1.5 text-xs font-medium text-sena hover:text-sena/80 transition-colors mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Crear horario general
                  </button>
                )}
                {creandoGeneral && <FormularioHorario />}
              </div>
            )}
          </div>

          {/* Provisional */}
          {asignacion.tipo === "provisional" && (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-orange-600 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Información de provisionalidad
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Autorizado por</p>
                  <p className="text-gray-900">{asignacion.autorizado_por || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fecha</p>
                  <p className="text-gray-900">{asignacion.fecha_autorizacion || "-"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Motivo</p>
                <p className="text-gray-900 mt-1 bg-orange-50 p-3 rounded-lg text-sm">{asignacion.motivo || "-"}</p>
              </div>
            </div>
          )}

          {/* Estado */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              asignacion.tipo === "activa" ? "bg-green-100 text-green-800" : asignacion.tipo === "provisional" ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-800"
            }`}>
              {asignacion.tipo === "activa" ? "Activa" : asignacion.tipo === "provisional" ? "Provisional" : "Histórica"}
            </span>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
