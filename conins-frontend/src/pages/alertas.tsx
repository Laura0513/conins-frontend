import { useState, useEffect } from "react"
import { useDebounce } from "@/lib/useDebounce"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import { TableSkeleton, PageSkeleton } from "@/components/ui/Skeleton"
import EmptyState from "@/components/ui/EmptyState"
import {
  Search,
  Bell,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react"

type Alerta = {
  id: number
  instructor_id: number
  instructor_nombre: string
  tipo: string
  mensaje: string
  semana: string
  total_horas: number
  atendida: boolean
  created_at: string
}


function getAlertIcon(tipo: string) {
  switch (tipo) {
    case "HORAS_EXCEDIDAS":
      return <AlertCircle className="w-5 h-5 text-red-500" />
    case "AMBIENTE_OCUPADO":
      return <AlertTriangle className="w-5 h-5 text-orange-500" />
    case "ASIGNACION_PROVISIONAL":
      return <Clock className="w-5 h-5 text-yellow-500" />
    default:
      return <Bell className="w-5 h-5 text-gray-400" />
  }
}

function getAlertBadge(tipo: string) {
  switch (tipo) {
    case "HORAS_EXCEDIDAS":
      return "bg-red-100 text-red-800"
    case "AMBIENTE_OCUPADO":
      return "bg-orange-100 text-orange-800"
    case "ASIGNACION_PROVISIONAL":
      return "bg-yellow-100 text-yellow-800"
    case "HORAS_INSUFICIENTES":
      return "bg-blue-100 text-blue-800"
    case "INSTRUCTOR_PLANTA_JORNADA_NOCTURNA":
      return "bg-purple-100 text-purple-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function getAlertLabel(tipo: string) {
  switch (tipo) {
    case "HORAS_EXCEDIDAS":
      return "Horas excedidas"
    case "AMBIENTE_OCUPADO":
      return "Ambiente ocupado"
    case "ASIGNACION_PROVISIONAL":
      return "Asignación provisional"
    case "HORAS_INSUFICIENTES":
      return "Horas insuficientes"
    case "INSTRUCTOR_PLANTA_JORNADA_NOCTURNA":
      return "Jornada nocturna"
    default:
      return tipo
  }
}

function formatTimeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return "Hace menos de 1 hora"
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays === 1) return "Ayer"
  return `Hace ${diffDays} días`
}

export default function AlertasPage() {
  const { user, loading: authLoading } = useProtectedRoute()
  const { showToast } = useToast()
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search)
  const [filtroTipo, setFiltroTipo] = useState("todas")
  const [filtroEstado, setFiltroEstado] = useState("todas")
  const [activeTab, setActiveTab] = useState<"pendientes" | "historial">("pendientes")

  const rol = user?.roles?.[0]?.trim() || ""
  const esAdmin = rol !== "Instructor"

  useEffect(() => {
    cargarAlertas()
  }, [])

  const cargarAlertas = async () => {
    setLoading(true)
    try {
      const res = await api.alertas.getAll()
      setAlertas(res.data || [])
    } catch (err) {
      console.warn("Error cargando alertas:", err)
      setAlertas([])
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: "pendientes", label: "Pendientes", count: alertas.filter(a => !a.atendida).length },
    { id: "historial", label: "Historial", count: alertas.filter(a => a.atendida).length },
  ]

  const handleMarcarAtendida = async (alerta: Alerta) => {
    try {
      await api.alertas.marcarAtendida(alerta.id)
      showToast("Alerta marcada como atendida", "success")
      cargarAlertas()
    } catch (err) {
      setAlertas((prev) =>
        prev.map((a) => (a.id === alerta.id ? { ...a, atendida: true } : a))
      )
      showToast("Alerta marcada como atendida", "success")
    }
  }

  const listaFiltrada = alertas.filter((a) => {
    const coincideTab = activeTab === "pendientes" ? !a.atendida : a.atendida
    const texto = debouncedSearch.toLowerCase()
    const coincideBusqueda =
      a.mensaje.toLowerCase().includes(texto) ||
      a.instructor_nombre.toLowerCase().includes(texto)
    const coincideTipo = filtroTipo === "todas" || a.tipo === filtroTipo
    const coincideEstado =
      filtroEstado === "todas" ||
      (filtroEstado === "pendiente" && !a.atendida) ||
      (filtroEstado === "atendida" && a.atendida)
    return coincideTab && coincideBusqueda && coincideTipo && coincideEstado
  })

  const pendientes = alertas.filter((a) => !a.atendida).length
  const atendidas = alertas.filter((a) => a.atendida).length

  if (authLoading || !user) return <PageSkeleton />

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
            <p className="text-gray-500 text-sm">{esAdmin ? "Gestion de alertas del sistema" : "Tus notificaciones y alertas"}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{alertas.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border-l-4 border-yellow-400 shadow-sm">
            <p className="text-sm text-gray-500">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{pendientes}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border-l-4 border-green-400 shadow-sm">
            <p className="text-sm text-gray-500">Atendidas</p>
            <p className="text-2xl font-bold text-green-600">{atendidas}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar alerta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 w-full md:flex md:flex-wrap md:w-auto">
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todas">Tipo: Todas</option>
              <option value="HORAS_EXCEDIDAS">Horas excedidas</option>
              <option value="AMBIENTE_OCUPADO">Ambiente ocupado</option>
              <option value="ASIGNACION_PROVISIONAL">Asignación provisional</option>
              <option value="HORAS_INSUFICIENTES">Horas insuficientes</option>
              <option value="INSTRUCTOR_PLANTA_JORNADA_NOCTURNA">Jornada nocturna</option>
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todas">Estado: Todas</option>
              <option value="pendiente">Pendiente</option>
              <option value="atendida">Atendida</option>
            </select>
          </div>
        </div>

        {/* Lista de alertas */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <TableSkeleton rows={5} columns={3} />
          ) : listaFiltrada.length === 0 ? (
            <EmptyState icon={Bell} title="Sin alertas" description="No se encontraron alertas con los filtros seleccionados." />
          ) : (
            <div className="divide-y divide-gray-100">
              {listaFiltrada.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`p-6 transition-colors ${
                    alerta.atendida ? "bg-gray-50/50" : "bg-white hover:bg-gray-50/80"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      alerta.atendida ? "bg-gray-100" : "bg-red-50"
                    }`}>
                      {getAlertIcon(alerta.tipo)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <p className={`text-sm ${alerta.atendida ? "text-gray-500" : "text-gray-700"}`}>
                          {alerta.mensaje}
                        </p>
                        <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getAlertBadge(alerta.tipo)}`}>
                          {getAlertLabel(alerta.tipo)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                        <span>{alerta.instructor_nombre}</span>
                        <span>·</span>
                        <span>Semana del {new Date(alerta.semana).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</span>
                        <span>·</span>
                        <span>{alerta.total_horas}h</span>
                        <span>·</span>
                        <span>{formatTimeAgo(alerta.created_at)}</span>
                      </div>
                    </div>

                    {!alerta.atendida && (
                      <button
                        onClick={() => handleMarcarAtendida(alerta)}
                        className="shrink-0 p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Marcar como atendida"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-500">
              Mostrando {listaFiltrada.length} de {alertas.length}
            </span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
