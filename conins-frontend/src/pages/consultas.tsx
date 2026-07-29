import { useState, useEffect } from "react"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import { useToast } from "@/lib/ToastContext"
import { exportarCargaHorariaPDF, exportarHorarioFichaPDF, exportarOcupacionPDF } from "@/lib/exportPDF"
import { TableSkeleton, PageSkeleton } from "@/components/ui/Skeleton"
import EmptyState from "@/components/ui/EmptyState"
import {
  Search,
  FileDown,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Building2,
  Calendar,
  BarChart3,
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

type HorarioFicha = {
  ficha_numero: string
  programa: string
  lunes: string | null
  martes: string | null
  miercoles: string | null
  jueves: string | null
  viernes: string | null
  sabado: string | null
}

type OcupacionAmbiente = {
  ambiente_nombre: string
  tipo: string
  capacidad: number
  horas_ocupadas: number
  horas_totales: number
  porcentaje: number
}

// --- Component ---
export default function ConsultasPage() {
  const { user, loading: authLoading } = useProtectedRoute()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<"carga" | "ficha" | "ocupacion">("carga")

  const [carga, setCarga] = useState<CargaHoraria[]>([])
  const [horariosFicha, setHorariosFicha] = useState<HorarioFicha[]>([])
  const [ocupacion, setOcupacion] = useState<OcupacionAmbiente[]>([])

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroFicha, setFiltroFicha] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [resCarga, resHorarios, resOcupacion] = await Promise.all([
        api.consultas.getCargaHoraria(),
        api.consultas.getHorariosPorFicha(),
        api.consultas.getOcupacionAmbientes(),
      ])
      setCarga(resCarga.data || [])
      setHorariosFicha(resHorarios.data || [])
      setOcupacion(resOcupacion.data || [])
    } catch (err) {
      console.warn("Error cargando reportes:", err)
      showToast("Error al cargar reportes del backend", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    try {
      if (activeTab === "carga") {
        exportarCargaHorariaPDF(carga)
      } else if (activeTab === "ficha") {
        exportarHorarioFichaPDF(horariosFicha)
      } else if (activeTab === "ocupacion") {
        exportarOcupacionPDF(ocupacion)
      }
      showToast("PDF generado exitosamente", "success")
    } catch {
      showToast("Error al generar PDF", "error")
    }
  }

  // Filtros
  const cargaFiltrada = carga.filter((c) => {
    const coincideBusqueda = c.instructor_nombre.toLowerCase().includes(search.toLowerCase())
    const coincideEstado = filtroEstado === "todos" || c.estado === filtroEstado
    return coincideBusqueda && coincideEstado
  })

  const fichasFiltradas = horariosFicha.filter((h) =>
    h.ficha_numero.includes(filtroFicha) || h.programa.toLowerCase().includes(filtroFicha.toLowerCase())
  )

  // Stats
  const totalHoras = carga.reduce((sum, c) => sum + Number(c.total_horas), 0)
  const enSobrecarga = carga.filter((c) => c.estado === "Sobrecarga").length
  const promedioOcupacion =
    ocupacion.length > 0
      ? Math.round(ocupacion.reduce((sum, o) => sum + Number(o.porcentaje), 0) / ocupacion.length)
      : 0

  if (authLoading || !user) return <PageSkeleton />

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 print:p-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes y Estadisticas</h1>
            <p className="text-gray-500 text-sm">Vistas consolidadas para gestion academica</p>
          </div>
          <button
            onClick={handleExport}
            disabled={loading}
            className="bg-sena hover:bg-sena/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            Descargar PDF
          </button>
        </div>

        {/* Tarjetas resumen */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-sena/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-sena" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Instructores</p>
                <p className="text-lg font-bold text-gray-900">{carga.length}</p>
                <p className="text-xs text-gray-400">{totalHoras.toFixed(0)}h totales</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${enSobrecarga > 0 ? "bg-red-50" : "bg-green-50"}`}>
                {enSobrecarga > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">En sobrecarga</p>
                <p className={`text-lg font-bold ${enSobrecarga > 0 ? "text-red-600" : "text-green-600"}`}>
                  {enSobrecarga}
                </p>
                <p className="text-xs text-gray-400">de {carga.length} instructores</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-sena/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-sena" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Ocupacion promedio</p>
                <p className="text-lg font-bold text-gray-900">{promedioOcupacion}%</p>
                <p className="text-xs text-gray-400">{ocupacion.length} ambientes</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 print:hidden">
          {[
            { id: "carga", label: "Carga Horaria", icon: Users },
            { id: "ficha", label: "Horario por Grupo", icon: Calendar },
            { id: "ocupacion", label: "Ocupacion Ambientes", icon: Building2 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-sena text-sena"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : (
          <>
            {/* Tab: Carga Horaria */}
            {activeTab === "carga" && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between print:hidden">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por instructor..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                    />
                  </div>
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sena/50"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="Normal">Normal</option>
                    <option value="Sobrecarga">Sobrecarga</option>
                    <option value="Bajo carga">Bajo carga</option>
                  </select>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {cargaFiltrada.length === 0 ? (
                    <EmptyState icon={BarChart3} title="Sin resultados" description="No se encontraron resultados con los filtros seleccionados." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-3 md:px-6 md:py-4">Instructor</th>
                            <th className="px-3 py-3 md:px-6 md:py-4 text-center">Horas</th>
                            <th className="px-3 py-3 md:px-6 md:py-4 text-center">Progreso</th>
                            <th className="px-3 py-3 md:px-6 md:py-4 text-center">Grupos</th>
                            <th className="px-3 py-3 md:px-6 md:py-4 text-center">Competencias</th>
                            <th className="px-3 py-3 md:px-6 md:py-4 text-center">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {cargaFiltrada.map((c) => (
                            <tr key={c.instructor_id} className="hover:bg-gray-50/50">
                              <td className="px-3 py-3 md:px-6 md:py-4 font-medium text-gray-900">
                                {c.instructor_nombre}
                              </td>
                              <td className="px-3 py-3 md:px-6 md:py-4 text-center font-semibold text-gray-700">
                                {Number(c.total_horas).toFixed(0)}h
                              </td>
                              <td className="px-3 py-3 md:px-6 md:py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all ${
                                        Number(c.total_horas) > 40
                                          ? "bg-red-500"
                                          : Number(c.total_horas) >= 34
                                            ? "bg-yellow-500"
                                            : "bg-sena"
                                      }`}
                                      style={{
                                        width: `${Math.min((Number(c.total_horas) / 40) * 100, 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-400 w-8 text-right">
                                    {Math.round((Number(c.total_horas) / 40) * 100)}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-3 md:px-6 md:py-4 text-center text-gray-600">
                                {c.fichas_count}
                              </td>
                              <td className="px-3 py-3 md:px-6 md:py-4 text-center text-gray-600">
                                {c.competencias_count}
                              </td>
                              <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                    c.estado === "Sobrecarga"
                                      ? "bg-red-100 text-red-700"
                                      : c.estado === "Bajo carga"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-green-100 text-green-700"
                                  }`}
                                >
                                  {c.estado === "Sobrecarga" ? (
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                  ) : c.estado === "Bajo carga" ? (
                                    <Clock className="w-3.5 h-3.5" />
                                  ) : (
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  )}
                                  {c.estado}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="px-3 py-3 md:px-6 md:py-4 border-t border-gray-200 bg-gray-50 flex justify-between text-sm text-gray-500">
                    <span>
                      Mostrando {cargaFiltrada.length} de {carga.length} instructores
                    </span>
                    <span>
                      Horas totales: {cargaFiltrada.reduce((sum, c) => sum + Number(c.total_horas), 0).toFixed(0)}h
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Horario por Ficha */}
            {activeTab === "ficha" && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm print:hidden">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por grupo o programa..."
                      value={filtroFicha}
                      onChange={(e) => setFiltroFicha(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {fichasFiltradas.length === 0 ? (
                    <EmptyState icon={Calendar} title="Sin horarios" description="No se encontraron grupos con horarios activos." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-3 md:px-6 md:py-4">Grupo</th>
                            <th className="px-3 py-3 md:px-6 md:py-4">Programa</th>
                            <th className="px-3 py-3 md:px-6 md:py-4 text-center">Lun</th>
                            <th className="px-3 py-3 md:px-6 md:py-4 text-center">Mar</th>
                            <th className="px-3 py-3 md:px-6 md:py-4 text-center">Mie</th>
                            <th className="px-3 py-3 md:px-6 md:py-4 text-center">Jue</th>
                            <th className="px-3 py-3 md:px-6 md:py-4 text-center">Vie</th>
                            <th className="px-3 py-3 md:px-6 md:py-4 text-center">Sab</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {fichasFiltradas.map((h) => (
                            <tr key={h.ficha_numero} className="hover:bg-gray-50/50">
                              <td className="px-3 py-3 md:px-6 md:py-4 font-medium text-sena">
                                {h.ficha_numero}
                              </td>
                              <td className="px-3 py-3 md:px-6 md:py-4 text-gray-600">
                                {h.programa}
                              </td>
                              {[h.lunes, h.martes, h.miercoles, h.jueves, h.viernes, h.sabado].map(
                                (dia, i) => (
                                  <td
                                    key={i}
                                    className={`px-3 py-3 md:px-6 md:py-4 text-center text-xs ${
                                      dia ? "text-gray-700" : "text-gray-300"
                                    }`}
                                  >
                                    {dia || "—"}
                                  </td>
                                )
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="px-3 py-3 md:px-6 md:py-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
                    Mostrando {fichasFiltradas.length} de {horariosFicha.length} grupos
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Ocupación Ambientes */}
            {activeTab === "ocupacion" && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {ocupacion.length === 0 ? (
                    <EmptyState icon={Building2} title="Sin datos" description="No hay datos de ocupacion disponibles." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-3 md:px-6 md:py-4">Ambiente</th>
                            <th className="px-3 py-3 md:px-6 md:py-4 text-center">Tipo</th>
                            <th className="px-3 py-3 md:px-6 md:py-4 text-center">Capacidad</th>
                            <th className="px-3 py-3 md:px-6 md:py-4 text-center">Horas</th>
                            <th className="px-3 py-3 md:px-6 md:py-4 text-center">Ocupacion</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {ocupacion.map((o) => (
                            <tr key={o.ambiente_nombre} className="hover:bg-gray-50/50">
                              <td className="px-3 py-3 md:px-6 md:py-4 font-medium text-gray-900">
                                {o.ambiente_nombre}
                              </td>
                              <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                                  {o.tipo}
                                </span>
                              </td>
                              <td className="px-3 py-3 md:px-6 md:py-4 text-center text-gray-600">
                                {o.capacidad ?? "—"}
                              </td>
                              <td className="px-3 py-3 md:px-6 md:py-4 text-center text-gray-600">
                                {Number(o.horas_ocupadas).toFixed(0)}h / {o.horas_totales}h
                              </td>
                              <td className="px-3 py-3 md:px-6 md:py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                      className={`h-2 rounded-full transition-all ${
                                        Number(o.porcentaje) > 80
                                          ? "bg-red-500"
                                          : Number(o.porcentaje) > 50
                                            ? "bg-yellow-500"
                                            : "bg-sena"
                                      }`}
                                      style={{ width: `${Math.min(Number(o.porcentaje), 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-gray-600 w-10 text-right">
                                    {Number(o.porcentaje).toFixed(0)}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="px-3 py-3 md:px-6 md:py-4 border-t border-gray-200 bg-gray-50 flex justify-between text-sm text-gray-500">
                    <span>{ocupacion.length} ambientes</span>
                    <span>Ocupacion promedio: {promedioOcupacion}%</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
