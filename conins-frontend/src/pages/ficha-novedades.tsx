import { useState, useEffect } from "react"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import CrearNovedadFichaModal from "@/components/fichas/CrearNovedadFichaModal"
import {
  Search,
  Plus,
  Loader2,
  AlertTriangle,
} from "lucide-react"

type FichaNovedad = {
  id: number
  ficha_id: number
  ficha_numero: string
  ficha_programa: string
  tipo_novedad: string
  fecha_inicio: string
  fecha_fin: string
  observacion: string
  created_at: string
}

const MOCK_NOVEDADES: FichaNovedad[] = [
  { id: 1, ficha_id: 1, ficha_numero: "2995403", ficha_programa: "ADSO", tipo_novedad: "comite de evaluacion", fecha_inicio: "2026-06-15", fecha_fin: "2026-06-15", observacion: "Comite de evaluacion final de etapa lectiva", created_at: "2026-06-10T08:00:00Z" },
  { id: 2, ficha_id: 2, ficha_numero: "2887341", ficha_programa: "Calzado", tipo_novedad: "paro", fecha_inicio: "2026-06-12", fecha_fin: "2026-06-13", observacion: "Paro de transportadores afecta asistencia", created_at: "2026-06-11T10:00:00Z" },
  { id: 3, ficha_id: 1, ficha_numero: "2995403", ficha_programa: "ADSO", tipo_novedad: "actividad fuera", fecha_inicio: "2026-06-20", fecha_fin: "2026-06-20", observacion: "Visita empresarial programada", created_at: "2026-06-09T14:00:00Z" },
]

export default function FichaNovedadesPage() {
  const { user, loading: authLoading } = useProtectedRoute()
  const { showToast } = useToast()
  const [novedades, setNovedades] = useState<FichaNovedad[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const [search, setSearch] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("todas")
  const [filtroFicha, setFiltroFicha] = useState("todas")

  useEffect(() => {
    cargarNovedades()
  }, [])

  const cargarNovedades = async () => {
    setLoading(true)
    try {
      const res = await api.fichaNovedades.getAll()
      setNovedades(res.data)
    } catch (err) {
      console.warn("Backend no disponible, usando datos mock:", err)
      setNovedades(MOCK_NOVEDADES)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (data: any) => {
    try {
      await api.fichaNovedades.create(data)
      showToast("Novedad de ficha registrada exitosamente", "success")
      setIsCreateModalOpen(false)
      cargarNovedades()
    } catch (err: any) {
      showToast(err.message || "Error al registrar novedad", "error")
    }
  }

  const listaFiltrada = novedades.filter((n) => {
    const texto = search.toLowerCase()
    const coincideBusqueda =
      n.ficha_numero.toLowerCase().includes(texto) ||
      n.ficha_programa.toLowerCase().includes(texto) ||
      n.observacion.toLowerCase().includes(texto)
    const coincideTipo = filtroTipo === "todas" || n.tipo_novedad === filtroTipo
    const coincideFicha = filtroFicha === "todas" || n.ficha_numero === filtroFicha
    return coincideBusqueda && coincideTipo && coincideFicha
  })

  const tiposUnicos = [...new Set(novedades.map(n => n.tipo_novedad))]
  const fichasUnicas = [...new Set(novedades.map(n => n.ficha_numero))]

  function formatNovedadLabel(tipo: string) {
    return tipo.charAt(0).toUpperCase() + tipo.slice(1)
  }

  function getNovedadBadgeColor(tipo: string) {
    switch (tipo) {
      case "comite de evaluacion":
        return "bg-blue-100 text-blue-800"
      case "paro":
        return "bg-red-100 text-red-800"
      case "actividad fuera":
        return "bg-green-100 text-green-800"
      case "suspension":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-sena" />
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novedades de Fichas</h1>
            <p className="text-gray-500 text-sm">Registro de novedades administrativas de fichas</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-sena hover:bg-sena/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Registrar novedad
          </button>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Total novedades</p>
            <p className="text-2xl font-bold text-gray-900">{novedades.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border-l-4 border-sena shadow-sm">
            <p className="text-sm text-gray-500">Fichas afectadas</p>
            <p className="text-2xl font-bold text-sena">{fichasUnicas.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border-l-4 border-blue-400 shadow-sm">
            <p className="text-sm text-gray-500">Tipos de novedad</p>
            <p className="text-2xl font-bold text-blue-600">{tiposUnicos.length}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ficha, programa u observacion..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 w-full md:flex md:flex-wrap md:w-auto">
            <select
              value={filtroFicha}
              onChange={(e) => setFiltroFicha(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todas">Ficha: Todas</option>
              {fichasUnicas.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todas">Tipo: Todos</option>
              {tiposUnicos.map((t) => (
                <option key={t} value={t}>{formatNovedadLabel(t)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-sena mb-2" />
              <p>Cargando novedades...</p>
            </div>
          ) : listaFiltrada.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No se encontraron novedades con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 md:px-6 md:py-4">No. Ficha</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Programa</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Tipo de novedad</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Fecha inicio</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Fecha fin</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Observacion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listaFiltrada.map((novedad) => (
                    <tr key={novedad.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-3 md:px-6 md:py-4 font-medium text-gray-900">{novedad.ficha_numero}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-700">{novedad.ficha_programa}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNovedadBadgeColor(novedad.tipo_novedad)}`}>
                          {formatNovedadLabel(novedad.tipo_novedad)}
                        </span>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">{formatDate(novedad.fecha_inicio)}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">{formatDate(novedad.fecha_fin)}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-600 max-w-xs truncate">{novedad.observacion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-3 py-3 md:px-6 md:py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-500">
              Mostrando {listaFiltrada.length} de {novedades.length}
            </span>
          </div>
        </div>
      </div>

      <CrearNovedadFichaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />
    </DashboardLayout>
  )
}
