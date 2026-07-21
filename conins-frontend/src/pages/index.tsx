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

  // Instructor stats
  const [misHorarios, setMisHorarios] = useState<HorarioInstructor[]>([])
  const [misFichasCount, setMisFichasCount] = useState(0)
  const [notifCount, setNotifCount] = useState(0)

  const [dataLoading, setDataLoading] = useState(true)

  const rol = user?.roles?.[0]?.trim() || "admin"
  const esAdmin = rol !== "Instructor"

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
    ]).then(([instRes, fichasRes, asigRes, alertasRes, cargaRes]) => {
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
        // Mostrar las 5 más recientes
        setAlertas(todas.slice(0, 5))
      }
      if (cargaRes.status === "fulfilled") {
        setCargaHoraria(cargaRes.value.data || [])
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inicio</h1>
          <p className="text-gray-500 text-sm">Resumen general del CDMC</p>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-sena/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-sena" />
              </div>
              <p className="text-sm text-gray-500">Instructores activos</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {dataLoading ? "..." : instructorCount}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-sena/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-sena" />
              </div>
              <p className="text-sm text-gray-500">Grupos activos</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {dataLoading ? "..." : fichasCount}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-sena/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-sena" />
              </div>
              <p className="text-sm text-gray-500">Asignaciones vigentes</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {dataLoading ? "..." : asignacionesCount}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border-l-4 border-yellow-400 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-sm text-gray-500">Alertas pendientes</p>
            </div>
            <p className="text-3xl font-bold text-yellow-600">
              {dataLoading ? "..." : alertasPendientes}
            </p>
          </div>
        </div>

        {/* Contenido inferior: Tabla + Alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tabla de carga horaria */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Carga horaria semanal</h2>

            {dataLoading ? (
              <div className="py-8 flex items-center justify-center text-gray-400">
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
                    {cargaHoraria.map((row) => (
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

          {/* Alertas recientes */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Alertas recientes</h2>
              <button
                onClick={() => router.push("/alertas")}
                className="text-sena text-sm font-medium hover:underline"
              >
                Ver todas
              </button>
            </div>

            {dataLoading ? (
              <div className="py-8 flex items-center justify-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : alertas.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                No hay alertas registradas.
              </p>
            ) : (
              <div className="space-y-4">
                {alertas.map((alerta) => (
                  <div
                    key={alerta.id}
                    className={`p-4 rounded-lg border ${
                      alerta.atendida
                        ? "bg-gray-50 border-gray-200 opacity-60"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-gray-700 flex-1">{alerta.mensaje}</p>
                      <span
                        className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${getAlertBadgeColor(alerta.tipo)}`}
                      >
                        {alerta.tipo.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {alerta.created_at ? tiempoRelativo(alerta.created_at) : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
