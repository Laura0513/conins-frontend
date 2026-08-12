import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/AuthContext"
import {
  Loader2,
  Users,
  BookOpen,
  ClipboardList,
  AlertTriangle,
  Calendar,
  Bell,
  Building2,
  ArrowRight,
  Clock,
  Plus,
  FileUp,
  Search,
} from "lucide-react"

// --- Types ---
type CargaHoraria = {
  instructor_id: number
  instructor_nombre: string
  total_horas: number
  fichas_count: number
  competencias_count: number
  estado: "Normal" | "Sobrecarga" | "Bajo carga"
}

type Alerta = {
  id: number
  instructor_nombre: string
  tipo: string
  mensaje: string
  atendida: boolean
  created_at: string
}

type OcupacionAmbiente = {
  ambiente_nombre: string
  tipo: string
  capacidad: number
  horas_ocupadas: number
  horas_totales: number
  porcentaje: number
}

type HorarioItem = {
  id: number
  instructor_nombre?: string
  ficha_numero?: string
  competencia_nombre?: string
  ambiente_nombre?: string
  dia_semana?: string
  hora_inicio?: string
  hora_fin?: string
  jornada?: string
  activo?: boolean
}

type HorarioInstructor = {
  id: number
  ficha_numero: string
  competencia: string
  ambiente: string
  dias: string[] | string
  horas: string
  estado: string
  activo: boolean
}

// --- Helpers ---
const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

function getDiaHoy() {
  return DIAS_SEMANA[new Date().getDay()]
}

function getProgressColor(horas: number, limite: number) {
  if (horas > limite) return "bg-red-500"
  if (horas >= limite * 0.85) return "bg-yellow-500"
  return "bg-sena"
}

function getStatusBadge(estado: string) {
  switch (estado) {
    case "Sobrecarga":
      return "bg-red-100 text-red-700"
    case "Bajo carga":
      return "bg-yellow-100 text-yellow-700"
    default:
      return "bg-green-100 text-green-700"
  }
}

function getOcupacionColor(porcentaje: number) {
  if (porcentaje >= 90) return "bg-red-500"
  if (porcentaje >= 70) return "bg-yellow-500"
  return "bg-sena"
}

function getAlertBadgeColor(tipo: string) {
  switch (tipo) {
    case "CARGA_HORARIA":
      return "bg-yellow-100 text-yellow-800"
    case "AMBIENTE_OCUPADO":
      return "bg-orange-100 text-orange-800"
    case "CONFLICTO":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function tiempoRelativo(fecha: string) {
  const ahora = Date.now()
  const creado = new Date(fecha).getTime()
  const diff = ahora - creado
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs} h`
  const dias = Math.floor(hrs / 24)
  if (dias === 1) return "Ayer"
  return `Hace ${dias} dias`
}

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  // Admin stats
  const [instructorCount, setInstructorCount] = useState(0)
  const [fichasCount, setFichasCount] = useState(0)
  const [asignacionesCount, setAsignacionesCount] = useState(0)
  const [alertasPendientes, setAlertasPendientes] = useState(0)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [cargaHoraria, setCargaHoraria] = useState<CargaHoraria[]>([])
  const [ocupacion, setOcupacion] = useState<OcupacionAmbiente[]>([])
  const [horariosHoy, setHorariosHoy] = useState<HorarioItem[]>([])

  // Instructor stats
  const [misHorarios, setMisHorarios] = useState<HorarioInstructor[]>([])
  const [misFichasCount, setMisFichasCount] = useState(0)
  const [notifCount, setNotifCount] = useState(0)

  const [dataLoading, setDataLoading] = useState(true)

  const rol = user?.roles?.[0]?.trim() || "admin"
  const esAdmin = rol !== "Instructor"
  const puedeCrear = ["Coordinadora Academica", "Asistente Coordinacion"].includes(rol)

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth")
    }
  }, [user, loading, router])

  // Cargar datos admin
  useEffect(() => {
    if (!user || !esAdmin) return

    setDataLoading(true)

    Promise.allSettled([
      api.instructors.getAll(),
      api.fichas.getAll(),
      api.assignments.getAll(),
      api.alertas.getAll(),
      api.consultas.getCargaHoraria(),
      api.consultas.getOcupacionAmbientes(),
      api.horarios.getAll(),
    ]).then(([instRes, fichasRes, asigRes, alertasRes, cargaRes, ocupRes, horariosRes]) => {
      if (instRes.status === "fulfilled") {
        const activos = (instRes.value.data || []).filter((i: any) => i.activo !== false)
        setInstructorCount(activos.length)
      }
      if (fichasRes.status === "fulfilled") {
        const activas = (fichasRes.value.data || []).filter((f: any) => f.activo !== false)
        setFichasCount(activas.length)
      }
      if (asigRes.status === "fulfilled") {
        const activas = (asigRes.value.data || []).filter((a: any) => a.activo !== false)
        setAsignacionesCount(activas.length)
      }
      if (alertasRes.status === "fulfilled") {
        const todas = alertasRes.value.data || []
        const noAtendidas = todas.filter((a: Alerta) => !a.atendida)
        setAlertasPendientes(noAtendidas.length)
        setAlertas(todas.slice(0, 5))
      }
      if (cargaRes.status === "fulfilled") {
        setCargaHoraria(cargaRes.value.data || [])
      }
      if (ocupRes.status === "fulfilled") {
        const datos = (ocupRes.value.data || []) as OcupacionAmbiente[]
        setOcupacion(datos.sort((a, b) => b.porcentaje - a.porcentaje).slice(0, 5))
      }
      if (horariosRes.status === "fulfilled") {
        const todos = (horariosRes.value.data || []) as HorarioItem[]
        const diaHoy = getDiaHoy()
        const hoy = todos.filter(
          (h) => h.activo !== false && h.dia_semana === diaHoy
        )
        setHorariosHoy(hoy)
      }

      setDataLoading(false)
    })
  }, [user, esAdmin])

  // Cargar datos instructor
  useEffect(() => {
    if (!user || esAdmin) return

    setDataLoading(true)

    Promise.allSettled([
      api.horarios.getAll(),
      api.fichas.getAll(),
      api.notificaciones.getNoLeidasCount(),
    ]).then(([horariosRes, fichasRes, notifRes]) => {
      if (horariosRes.status === "fulfilled") {
        const activos = (horariosRes.value.data || []).filter((h: any) => h.activo)
        setMisHorarios(activos)
      }
      if (fichasRes.status === "fulfilled") {
        setMisFichasCount((fichasRes.value.data || []).length)
      }
      if (notifRes.status === "fulfilled") {
        setNotifCount(notifRes.value.data?.count ?? 0)
      }

      setDataLoading(false)
    })
  }, [user, esAdmin])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-sena" />
          <p>Verificando sesion...</p>
        </div>
      </div>
    )
  }

  // ========================
  // VISTA INSTRUCTOR
  // ========================
  if (!esAdmin) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {user.nombre}</h1>
            <p className="text-gray-500 text-sm">Resumen de tu actividad academica</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-sena/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-sena" />
                </div>
                <p className="text-sm text-gray-500">Mis horarios activos</p>
              </div>
              <p className="text-3xl font-bold text-sena">
                {dataLoading ? "..." : misHorarios.length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-sena/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-sena" />
                </div>
                <p className="text-sm text-gray-500">Grupos asignados</p>
              </div>
              <p className="text-3xl font-bold text-sena">
                {dataLoading ? "..." : misFichasCount}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border-l-4 border-yellow-400 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-sm text-gray-500">Notificaciones sin leer</p>
              </div>
              <p className="text-3xl font-bold text-yellow-600">
                {dataLoading ? "..." : notifCount}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Mis horarios de esta semana</h2>

            {dataLoading ? (
              <div className="py-8 flex items-center justify-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : misHorarios.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                No tienes horarios activos esta semana.
              </p>
            ) : (
              <div className="space-y-3">
                {misHorarios.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        Grupo {h.ficha_numero} — {h.competencia}
                      </p>
                      <p className="text-sm text-gray-500">
                        {h.ambiente} · {Array.isArray(h.dias) ? h.dias.join(", ") : h.dias}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-sena whitespace-nowrap">
                      {h.horas}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // ========================
  // VISTA ADMIN
  // ========================
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inicio</h1>
            <p className="text-gray-500 text-sm">Resumen general del CDMC</p>
          </div>
          <p className="text-sm text-gray-400">
            {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => router.push("/instructores")}
            className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-sena/30 transition-colors text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-sena/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-sena" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-sena transition-colors" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{dataLoading ? "..." : instructorCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Instructores activos</p>
          </button>

          <button
            onClick={() => router.push("/fichas")}
            className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-sena/30 transition-colors text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-sena transition-colors" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{dataLoading ? "..." : fichasCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Grupos activos</p>
          </button>

          <button
            onClick={() => router.push("/asignaciones")}
            className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-sena/30 transition-colors text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-purple-600" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-sena transition-colors" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{dataLoading ? "..." : asignacionesCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Asignaciones vigentes</p>
          </button>

          <button
            onClick={() => router.push("/alertas")}
            className="bg-white p-5 rounded-xl border-l-4 border-yellow-400 shadow-sm hover:bg-yellow-50/50 transition-colors text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-yellow-600 transition-colors" />
            </div>
            <p className="text-2xl font-bold text-yellow-600">{dataLoading ? "..." : alertasPendientes}</p>
            <p className="text-xs text-gray-500 mt-0.5">Alertas pendientes</p>
          </button>
        </div>

        {/* Accesos rápidos */}
        {puedeCrear && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push("/asignaciones")}
              className="flex items-center gap-2 px-4 py-2 bg-sena text-white rounded-lg text-sm font-medium hover:bg-sena/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva asignación
            </button>
            <button
              onClick={() => router.push("/importar")}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <FileUp className="w-4 h-4" />
              Importar Excel
            </button>
            <button
              onClick={() => router.push("/consultas")}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Search className="w-4 h-4" />
              Reportes
            </button>
          </div>
        )}

        {/* Horarios de hoy */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-sena" />
              <h2 className="text-base font-bold text-gray-900">Horarios de hoy — {getDiaHoy()}</h2>
            </div>
            <span className="text-sm text-gray-400">
              {dataLoading ? "..." : `${horariosHoy.length} clases`}
            </span>
          </div>
          <div className="p-6">
            {dataLoading ? (
              <div className="py-6 flex items-center justify-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : horariosHoy.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No hay clases programadas para hoy.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                      <th className="text-left py-2 font-medium">Hora</th>
                      <th className="text-left py-2 font-medium">Instructor</th>
                      <th className="text-left py-2 font-medium">Grupo</th>
                      <th className="text-left py-2 font-medium">Competencia</th>
                      <th className="text-left py-2 font-medium">Ambiente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horariosHoy
                      .sort((a, b) => (a.hora_inicio || "").localeCompare(b.hora_inicio || ""))
                      .slice(0, 10)
                      .map((h) => (
                        <tr key={h.id} className="border-b border-gray-50 last:border-0">
                          <td className="py-2.5 font-mono text-xs text-sena font-medium whitespace-nowrap">
                            {h.hora_inicio?.slice(0, 5)} - {h.hora_fin?.slice(0, 5)}
                          </td>
                          <td className="py-2.5 text-gray-900">{h.instructor_nombre || "—"}</td>
                          <td className="py-2.5 text-gray-700">{h.ficha_numero || "—"}</td>
                          <td className="py-2.5 text-gray-600 max-w-[200px] truncate">{h.competencia_nombre || "—"}</td>
                          <td className="py-2.5 text-gray-600">{h.ambiente_nombre || "—"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {horariosHoy.length > 10 && (
                  <button
                    onClick={() => router.push("/horarios")}
                    className="mt-3 text-sm text-sena font-medium hover:underline"
                  >
                    Ver los {horariosHoy.length} horarios →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contenido inferior: Carga horaria + Ocupación + Alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tabla de carga horaria */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Carga horaria semanal</h2>
              <button
                onClick={() => router.push("/consultas")}
                className="text-sm text-sena font-medium hover:underline"
              >
                Ver reporte completo
              </button>
            </div>
            <div className="p-6">
              {dataLoading ? (
                <div className="py-6 flex items-center justify-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : cargaHoraria.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No hay datos de carga horaria disponibles.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500">
                        <th className="text-left py-3 font-medium">Instructor</th>
                        <th className="text-center py-3 font-medium">Horas</th>
                        <th className="text-center py-3 font-medium">Limite</th>
                        <th className="text-center py-3 font-medium">Progreso</th>
                        <th className="text-center py-3 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cargaHoraria.slice(0, 8).map((row) => (
                        <tr
                          key={row.instructor_id}
                          className="border-b border-gray-100 last:border-0"
                        >
                          <td className="py-3 font-medium text-gray-900">
                            {row.instructor_nombre}
                          </td>
                          <td className="py-3 text-center text-gray-700">
                            {Number(row.total_horas).toFixed(0)}
                          </td>
                          <td className="py-3 text-center text-gray-500">40</td>
                          <td className="py-3">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full ${getProgressColor(Number(row.total_horas), 40)}`}
                                style={{
                                  width: `${Math.min((Number(row.total_horas) / 40) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(row.estado)}`}
                            >
                              {row.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Alertas recientes */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Alertas recientes</h2>
              <button
                onClick={() => router.push("/alertas")}
                className="text-sm text-sena font-medium hover:underline"
              >
                Ver todas
              </button>
            </div>
            <div className="p-4">
              {dataLoading ? (
                <div className="py-6 flex items-center justify-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : alertas.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No hay alertas registradas.
                </p>
              ) : (
                <div className="space-y-3">
                  {alertas.map((alerta) => (
                    <div
                      key={alerta.id}
                      className={`p-3 rounded-lg border ${
                        alerta.atendida
                          ? "bg-gray-50 border-gray-200 opacity-60"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-gray-700 flex-1 line-clamp-2">{alerta.mensaje}</p>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getAlertBadgeColor(alerta.tipo)}`}
                        >
                          {alerta.tipo.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {alerta.created_at ? tiempoRelativo(alerta.created_at) : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ocupación de ambientes */}
        {ocupacion.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sena" />
                <h2 className="text-base font-bold text-gray-900">Ambientes más ocupados</h2>
              </div>
              <button
                onClick={() => router.push("/consultas")}
                className="text-sm text-sena font-medium hover:underline"
              >
                Ver todos
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {ocupacion.map((amb) => (
                  <div key={amb.ambiente_nombre} className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-2">
                      <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15.9" fill="none"
                          stroke={amb.porcentaje >= 90 ? "#ef4444" : amb.porcentaje >= 70 ? "#eab308" : "#39A900"}
                          strokeWidth="3"
                          strokeDasharray={`${amb.porcentaje} ${100 - amb.porcentaje}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900">
                        {Math.round(amb.porcentaje)}%
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-900 truncate">{amb.ambiente_nombre}</p>
                    <p className="text-[10px] text-gray-400">{amb.tipo}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
