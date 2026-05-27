import { useState, useEffect } from "react"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import CrearAsignacionModal from "@/components/asignaciones/CrearAsignacionModal"
import RegistrarProvisionalModal from "@/components/asignaciones/RegistrarProvisionalModal"
import DetailAsignacionModal from "@/components/asignaciones/DetailAsignacionModal"
import EditAsignacionModal from "@/components/asignaciones/EditAsignacionModal"
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Power,
  Star,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from "lucide-react"

type Asignacion = {
  id: number
  instructor_nombre: string
  ficha_numero: string
  competencia: string
  ambiente: string
  jornada: string
  es_lider: boolean
  tipo: "activa" | "provisional" | "historica"
}

const MOCK_ASIGNACIONES: Asignacion[] = [
  { id: 1, instructor_nombre: "Carlos Álvarez", ficha_numero: "2995403", competencia: "ADSO", ambiente: "Aula 203", jornada: "Mañana", es_lider: true, tipo: "activa" },
  { id: 2, instructor_nombre: "Andrés Pareja", ficha_numero: "2887341", competencia: "Contabilidad", ambiente: "Aula 207", jornada: "Mixta", es_lider: false, tipo: "activa" },
  { id: 3, instructor_nombre: "William Ramírez", ficha_numero: "3012456", competencia: "Logística", ambiente: "Taller T2", jornada: "Noche", es_lider: true, tipo: "activa" },
]

export default function AsignacionesPage() {
  const { user, loading: authLoading } = useProtectedRoute()
  const { showToast } = useToast()
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isProvisionalModalOpen, setIsProvisionalModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedAsignacion, setSelectedAsignacion] = useState<Asignacion | null>(null)
  const [activeTab, setActiveTab] = useState<"activa" | "provisional" | "historica">("activa")

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} })

  const [search, setSearch] = useState("")
  const [filtroPrograma, setFiltroPrograma] = useState("todos")
  const [filtroCoordinacion, setFiltroCoordinacion] = useState("todos")

  useEffect(() => {
    cargarAsignaciones()
  }, [])

  const cargarAsignaciones = async () => {
    setLoading(true)
    try {
      const res = await api.assignments.getAll()
      setAsignaciones(res.data)
    } catch (err) {
      console.warn("Backend no disponible, usando datos mock:", err)
      setAsignaciones(MOCK_ASIGNACIONES)
    } finally {
      setLoading(false)
    }
  }

  const listaFiltrada = asignaciones.filter((asig) => {
    const coincideTab = asig.tipo === activeTab
    const texto = search.toLowerCase()
    const coincideBusqueda =
      asig.instructor_nombre.toLowerCase().includes(texto) ||
      asig.ficha_numero.toLowerCase().includes(texto) ||
      asig.competencia.toLowerCase().includes(texto)
    
    const coincidePrograma = filtroPrograma === "todos" || asig.competencia === filtroPrograma
    const coincideCoordinacion = filtroCoordinacion === "todos" || true // Mock logic
    
    return coincideTab && coincideBusqueda && coincidePrograma && coincideCoordinacion
  })

  const handleCreate = async (data: any) => {
    try {
      // await api.assignments.create(data)
      showToast("Asignación registrada exitosamente", "success")
      setIsCreateModalOpen(false)
      cargarAsignaciones()
    } catch (err) {
      showToast("Error al registrar asignación", "error")
    }
  }

  const handleProvisional = async (data: any) => {
    try {
      // await api.assignments.createProvisional(data)
      showToast("Asignación provisional registrada", "success")
      setIsProvisionalModalOpen(false)
      cargarAsignaciones()
    } catch (err) {
      showToast("Error al registrar provisional", "error")
    }
  }

  const openDetailModal = (asig: Asignacion) => {
    setSelectedAsignacion(asig)
    setIsDetailModalOpen(true)
  }

  const openEditModal = (asig: Asignacion) => {
    setSelectedAsignacion(asig)
    setIsEditModalOpen(true)
  }

  const handleEditAsignacion = async (data: Partial<Asignacion>) => {
    if (!selectedAsignacion) return
    // await api.assignments.update(selectedAsignacion.id, data)
    showToast("Asignación actualizada exitosamente", "success")
    setIsEditModalOpen(false)
    cargarAsignaciones()
  }

  const handleDesactivar = (asig: Asignacion) => {
    setConfirmDialog({
      isOpen: true,
      title: "Desactivar asignación",
      message: `¿Estas seguro de desactivar la asignación de ${asig.instructor_nombre} en la ficha ${asig.ficha_numero}? Pasará a estado histórico.`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false })
        try {
          // await api.assignments.deactivate(asig.id)
          showToast("Asignación desactivada", "success")
          cargarAsignaciones()
        } catch (err) {
          showToast("Error al desactivar", "error")
        }
      },
    })
  }

  const tabs = [
    { id: "activa", label: "Activas", count: asignaciones.filter(a => a.tipo === "activa").length },
    { id: "provisional", label: "Provisionales", count: asignaciones.filter(a => a.tipo === "provisional").length },
    { id: "historica", label: "Históricas", count: asignaciones.filter(a => a.tipo === "historica").length },
  ]

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

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asignaciones</h1>
          <p className="text-gray-500 text-sm">Asignaciones de competencias e instructores</p>
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
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filtros y Botones */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
              />
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <select
                value={filtroPrograma}
                onChange={(e) => setFiltroPrograma(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
              >
                <option value="todos">Programa: Todos</option>
                <option value="ADSO">ADSO</option>
                <option value="Contabilidad">Contabilidad</option>
                <option value="Logística">Logística</option>
              </select>

              <select
                value={filtroCoordinacion}
                onChange={(e) => setFiltroCoordinacion(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
              >
                <option value="todos">Coordinación: Todas</option>
                <option value="tecnica">Técnica</option>
                <option value="transversal">Transversal</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsProvisionalModalOpen(true)}
              className="px-4 py-2.5 border border-sena text-sena rounded-lg text-sm font-medium hover:bg-sena/5 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Asignación provisional
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-sena hover:bg-sena/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Asignar competencia
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-sena mb-2" />
              <p>Cargando asignaciones...</p>
            </div>
          ) : listaFiltrada.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No se encontraron asignaciones con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Instructor</th>
                    <th className="px-6 py-4">Ficha</th>
                    <th className="px-6 py-4">Competencia</th>
                    <th className="px-6 py-4">Ambiente</th>
                    <th className="px-6 py-4">Jornada</th>
                    <th className="px-6 py-4 text-center">Líder</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listaFiltrada.map((asig) => (
                    <tr key={asig.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{asig.instructor_nombre}</td>
                      <td className="px-6 py-4 text-gray-700">{asig.ficha_numero}</td>
                      <td className="px-6 py-4 text-gray-500">{asig.competencia}</td>
                      <td className="px-6 py-4 text-gray-500">{asig.ambiente}</td>
                      <td className="px-6 py-4 text-gray-500">{asig.jornada}</td>
                      <td className="px-6 py-4 text-center">
                        {asig.es_lider && (
                          <Star className="w-5 h-5 text-sena fill-sena mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openDetailModal(asig)}
                            className="p-1.5 text-gray-400 hover:text-sena hover:bg-sena/10 rounded transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(asig)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDesactivar(asig)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Desactivar"
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-500">
              Mostrando {listaFiltrada.length} de {asignaciones.length}
            </span>
            <div className="flex items-center gap-2">
              <button className="p-1 rounded border border-gray-300 bg-white text-gray-400 cursor-not-allowed" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="px-3 py-1 rounded bg-sena text-white text-sm font-medium">1</button>
              <button className="p-1 rounded border border-gray-300 bg-white text-gray-400 cursor-not-allowed" disabled>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <CrearAsignacionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />

      <RegistrarProvisionalModal
        isOpen={isProvisionalModalOpen}
        onClose={() => setIsProvisionalModalOpen(false)}
        onSubmit={handleProvisional}
      />

      <DetailAsignacionModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        asignacion={selectedAsignacion}
      />

      <EditAsignacionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        asignacion={selectedAsignacion}
        onSubmit={handleEditAsignacion}
      />

      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{confirmDialog.title}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">{confirmDialog.message}</p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  )
}
