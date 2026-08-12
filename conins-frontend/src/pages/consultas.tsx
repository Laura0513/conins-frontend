import { useState, useEffect, useMemo } from "react"
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
  TrendingUp,
  ArrowUpRight,
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

// --- Chart Components ---

function BarChartHorizontal({
  data,
  maxValue,
}: {
  data: { label: string; value: number; color: string }[]
  maxValue: number
}) {
  const barHeight = 28
  const labelWidth = 140
  const chartWidth = 500
  const gap = 6
  const height = data.length * (barHeight + gap) + 10

  return (
    <svg
      viewBox={`0 0 ${labelWidth + chartWidth + 60} ${height}`}
      className="w-full"
      style={{ maxHeight: `${Math.min(height, 400)}px` }}
    >
      {data.map((d, i) => {
        const y = i * (barHeight + gap) + 5
        const barWidth = maxValue > 0 ? (d.value / maxValue) * chartWidth : 0
        return (
          <g key={i}>
            <text
              x={labelWidth - 8}
              y={y + barHeight / 2 + 4}
              textAnchor="end"
              className="text-[11px] fill-gray-600"
            >
              {d.label.length > 18 ? d.label.slice(0, 18) + "…" : d.label}
            </text>
            <rect
              x={labelWidth}
              y={y}
              width={Math.max(barWidth, 2)}
              height={barHeight}
              rx={4}
              fill={d.color}
              opacity={0.85}
            />
            <text
              x={labelWidth + barWidth + 8}
              y={y + barHeight / 2 + 4}
              className="text-[11px] font-semibold fill-gray-700"
            >
              {d.value.toFixed(0)}h
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function DonutChart({
  segments,
  centerLabel,
  centerValue,
  size = 160,
}: {
  segments: { value: number; color: string; label: string }[]
  centerLabel: string
  centerValue: string
  size?: number
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  const radius = size / 2 - 20
  const strokeWidth = 24
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        {segments.map((seg, i) => {
          const pct = total > 0 ? seg.value / total : 0
          const dashLength = pct * circumference
          const currentOffset = offset
          offset += dashLength
          if (pct === 0) return null
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-currentOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: "stroke-dasharray 0.5s ease" }}
            />
          )
        })}
        <text
          x={size / 2}
          y={size / 2 - 6}
          textAnchor="middle"
          className="text-2xl font-bold fill-gray-900"
        >
          {centerValue}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 14}
          textAnchor="middle"
          className="text-[11px] fill-gray-500"
        >
          {centerLabel}
        </text>
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: seg.color }}
            />
            {seg.label} ({seg.value})
          </div>
        ))}
      </div>
    </div>
  )
}

function OcupacionBarChart({ data }: { data: OcupacionAmbiente[] }) {
  const barWidth = 40
  const gap = 12
  const chartHeight = 180
  const labelHeight = 60
  const width = data.length * (barWidth + gap) + gap + 40
  const maxPct = 100

  return (
    <svg
      viewBox={`0 0 ${Math.max(width, 300)} ${chartHeight + labelHeight + 30}`}
      className="w-full"
      style={{ maxHeight: "280px" }}
    >
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map((pct) => {
        const y = chartHeight - (pct / maxPct) * chartHeight + 10
        return (
          <g key={pct}>
            <line
              x1={35}
              y1={y}
              x2={width}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth={1}
              strokeDasharray={pct > 0 ? "4 4" : "0"}
            />
            <text x={30} y={y + 4} textAnchor="end" className="text-[10px] fill-gray-400">
              {pct}%
            </text>
          </g>
        )
      })}

      {data.map((o, i) => {
        const x = i * (barWidth + gap) + gap + 35
        const pct = Math.min(Number(o.porcentaje), 100)
        const barH = (pct / maxPct) * chartHeight
        const y = chartHeight - barH + 10
        const color =
          pct > 80 ? "#ef4444" : pct > 50 ? "#f59e0b" : "#39A900"

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={4}
              fill={color}
              opacity={0.85}
            />
            <text
              x={x + barWidth / 2}
              y={y - 6}
              textAnchor="middle"
              className="text-[10px] font-semibold fill-gray-700"
            >
              {pct.toFixed(0)}%
            </text>
            <text
              x={x + barWidth / 2}
              y={chartHeight + 24}
              textAnchor="middle"
              className="text-[9px] fill-gray-500"
              transform={`rotate(-35 ${x + barWidth / 2} ${chartHeight + 24})`}
            >
              {o.ambiente_nombre.length > 12
                ? o.ambiente_nombre.slice(0, 12) + "…"
                : o.ambiente_nombre}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function FichaHeatmap({ data }: { data: HorarioFicha[] }) {
  const dias = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
  const keys: (keyof HorarioFicha)[] = [
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
  ]

  const conteo = dias.map((_, i) => {
    return data.filter((h) => h[keys[i]] != null && h[keys[i]] !== "").length
  })
  const maxCount = Math.max(...conteo, 1)

  return (
    <div className="flex items-end gap-3 justify-center">
      {dias.map((dia, i) => {
        const pct = conteo[i] / maxCount
        const height = Math.max(pct * 120, 8)
        const opacity = 0.3 + pct * 0.7
        return (
          <div key={dia} className="flex flex-col items-center gap-1">
            <span className="text-xs font-semibold text-gray-700">{conteo[i]}</span>
            <div
              className="rounded-t-md transition-all"
              style={{
                width: "36px",
                height: `${height}px`,
                backgroundColor: "#39A900",
                opacity,
              }}
            />
            <span className="text-[10px] text-gray-500 font-medium">{dia}</span>
          </div>
        )
      })}
    </div>
  )
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
  const enBajoCarga = carga.filter((c) => c.estado === "Bajo carga").length
  const enNormal = carga.filter((c) => c.estado === "Normal").length
  const promedioHoras = carga.length > 0 ? totalHoras / carga.length : 0
  const promedioOcupacion =
    ocupacion.length > 0
      ? Math.round(ocupacion.reduce((sum, o) => sum + Number(o.porcentaje), 0) / ocupacion.length)
      : 0

  // Chart data
  const topInstructores = useMemo(() => {
    return [...cargaFiltrada]
      .sort((a, b) => Number(b.total_horas) - Number(a.total_horas))
      .slice(0, 10)
      .map((c) => ({
        label: c.instructor_nombre,
        value: Number(c.total_horas),
        color:
          c.estado === "Sobrecarga"
            ? "#ef4444"
            : c.estado === "Bajo carga"
              ? "#f59e0b"
              : "#39A900",
      }))
  }, [cargaFiltrada])

  const ocupacionTop = useMemo(() => {
    return [...ocupacion]
      .sort((a, b) => Number(b.porcentaje) - Number(a.porcentaje))
      .slice(0, 10)
  }, [ocupacion])

  const ambientesPorEstado = useMemo(() => {
    const critico = ocupacion.filter((o) => Number(o.porcentaje) > 80).length
    const medio = ocupacion.filter(
      (o) => Number(o.porcentaje) > 50 && Number(o.porcentaje) <= 80
    ).length
    const disponible = ocupacion.filter((o) => Number(o.porcentaje) <= 50).length
    return { critico, medio, disponible }
  }, [ocupacion])

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-sena/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-sena" />
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{carga.length}</p>
              <p className="text-xs text-gray-500 mt-1">Instructores registrados</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <TrendingUp className="w-3 h-3" />
                  {promedioHoras.toFixed(1)}h prom
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalHoras.toFixed(0)}h</p>
              <p className="text-xs text-gray-500 mt-1">Horas totales asignadas</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${enSobrecarga > 0 ? "bg-red-50" : "bg-green-50"}`}>
                  {enSobrecarga > 0 ? (
                    <ArrowUpRight className="w-5 h-5 text-red-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
                {enSobrecarga > 0 && (
                  <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">Alerta</span>
                )}
              </div>
              <p className={`text-2xl font-bold ${enSobrecarga > 0 ? "text-red-600" : "text-green-600"}`}>
                {enSobrecarga}
              </p>
              <p className="text-xs text-gray-500 mt-1">Instructores en sobrecarga</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-sena/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-sena" />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  promedioOcupacion > 80
                    ? "text-red-600 bg-red-50"
                    : promedioOcupacion > 50
                      ? "text-yellow-600 bg-yellow-50"
                      : "text-green-600 bg-green-50"
                }`}>
                  {promedioOcupacion > 80 ? "Alta" : promedioOcupacion > 50 ? "Media" : "Baja"}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{promedioOcupacion}%</p>
              <p className="text-xs text-gray-500 mt-1">Ocupacion promedio ({ocupacion.length} ambientes)</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 print:hidden overflow-x-auto">
          {[
            { id: "carga", label: "Carga Horaria", icon: Users },
            { id: "ficha", label: "Horario por Grupo", icon: Calendar },
            { id: "ocupacion", label: "Ocupacion Ambientes", icon: Building2 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
                {/* Charts Row */}
                {carga.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:hidden">
                    {/* Bar Chart - Top instructores */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        Top instructores por carga horaria
                      </h3>
                      <p className="text-xs text-gray-400 mb-4">
                        {cargaFiltrada.length > 10
                          ? "Mostrando los 10 con mayor carga"
                          : `${cargaFiltrada.length} instructores`}
                      </p>
                      <BarChartHorizontal data={topInstructores} maxValue={50} />
                    </div>

                    {/* Donut Chart - Distribución por estado */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-center">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        Distribucion por estado
                      </h3>
                      <p className="text-xs text-gray-400 mb-4">Clasificacion de instructores</p>
                      <DonutChart
                        segments={[
                          { value: enNormal, color: "#22c55e", label: "Normal" },
                          { value: enSobrecarga, color: "#ef4444", label: "Sobrecarga" },
                          { value: enBajoCarga, color: "#f59e0b", label: "Bajo carga" },
                        ]}
                        centerLabel="instructores"
                        centerValue={String(carga.length)}
                        size={170}
                      />
                    </div>
                  </div>
                )}

                {/* Filters */}
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

                {/* Table */}
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
                {/* Heatmap visual */}
                {horariosFicha.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 print:hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Grupos con clase por dia
                        </h3>
                        <p className="text-xs text-gray-400">
                          Cantidad de grupos que tienen horario asignado cada dia
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{horariosFicha.length}</p>
                        <p className="text-xs text-gray-500">grupos activos</p>
                      </div>
                    </div>
                    <FichaHeatmap data={horariosFicha} />
                  </div>
                )}

                {/* Search */}
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

                {/* Table */}
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
                {/* Charts Row */}
                {ocupacion.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:hidden">
                    {/* Bar Chart */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        Ocupacion por ambiente
                      </h3>
                      <p className="text-xs text-gray-400 mb-4">
                        {ocupacion.length > 10
                          ? "Top 10 ambientes por ocupacion"
                          : `${ocupacion.length} ambientes`}
                      </p>
                      <OcupacionBarChart data={ocupacionTop} />
                    </div>

                    {/* Donut - Distribution */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-center">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        Estado de ambientes
                      </h3>
                      <p className="text-xs text-gray-400 mb-4">Por nivel de ocupacion</p>
                      <DonutChart
                        segments={[
                          { value: ambientesPorEstado.disponible, color: "#22c55e", label: "Disponible (≤50%)" },
                          { value: ambientesPorEstado.medio, color: "#f59e0b", label: "Medio (51-80%)" },
                          { value: ambientesPorEstado.critico, color: "#ef4444", label: "Critico (>80%)" },
                        ]}
                        centerLabel="ambientes"
                        centerValue={String(ocupacion.length)}
                        size={170}
                      />
                    </div>
                  </div>
                )}

                {/* Table */}
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
