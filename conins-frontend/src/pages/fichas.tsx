import { useState, useEffect } from "react"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import CrearFichaModal from "@/components/fichas/CrearFichaModal"
import DetailFichaModal from "@/components/fichas/DetailFichaModal"
import EditFichaModal from "@/components/fichas/EditFichaModal"
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Power,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from "lucide-react"

type Ficha = {
  id: number
  numero_ficha: string
  programa: string
  jornada: string
  etapa: string
  modalidad: string
  instructores_count: number
  estado: string
  activo: boolean
}

const MOCK_FICHAS: Ficha[] = [
  { id: 1, numero_ficha: "2995403", programa: "ADSO", jornada: "Manana", etapa: "lectiva", modalidad: "Presencial", instructores_count: 4, estado: "Activa", activo: true },
  { id: 2, numero_ficha: "2887341", programa: "Calzado", jornada: "Mixta", etapa: "productiva", modalidad: "Presencial", instructores_count: 2, estado: "Activa", activo: true },
  { id: 3, numero_ficha: "3012456", programa: "Diseno", jornada: "Noche", etapa: "lectiva", modalidad: "Presencial", instructores_count: 3, estado: "Activa", activo: true },
  { id: 4, numero_ficha: "2760123", programa: "HUI FORMACION", jornada: "Virtual", etapa: "lectiva", modalidad: "Virtual", instructores_count: 0, estado: "Activa", activo: true },
]

export default function FichasPage() {
  const { user, loading: authLoading } = useProtectedRoute()
  const { showToast } = useToast()
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null)

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} })

  const [search, setSearch] = useState("")
  const [filtroPrograma, setFiltroPrograma] = useState("todos")
  const [filtroJornada, setFiltroJornada] = useState("todas")
  const [filtroEtapa, setFiltroEtapa] = useState("todas")
  const [filtroModalidad, setFiltroModalidad] = useState("todas")

  useEffect(() => {
    cargarFichas()
  }, [])

  const cargarFichas = async () => {
    setLoading(true)
    try {
      const res = await api.fichas.getAll()
      setFichas(res.data)
    } catch (err) {
      console.warn("Backend no disponible, usando datos mock:", err)
      setFichas(MOCK_FICHAS)
    } finally {
      setLoading(false)
    }
  }

  const listaFiltrada = fichas.filter((ficha) => {
    const texto = search.toLowerCase()
    const coincideBusqueda =
      ficha.numero_ficha.toLowerCase().includes(texto) ||
      ficha.programa.toLowerCase().includes(texto)
    const coincidePrograma = filtroPrograma === "todos" || ficha.programa === filtroPrograma
    const coincideJornada = filtroJornada === "todas" || ficha.jornada === filtroJornada
    const coincideEtapa = filtroEtapa === "todas" || ficha.etapa === filtroEtapa
    const coincideModalidad = filtroModalidad === "todas" || ficha.modalidad === filtroModalidad
    return coincideBusqueda && coincidePrograma && coincideJornada && coincideEtapa && coincideModalidad
  })

  const openDetailModal = (ficha: Ficha) => {
    setSelectedFicha(ficha)
    setIsDetailModalOpen(true)
  }

  const openEditModal = (ficha: Ficha) => {
    setSelectedFicha(ficha)
    setIsEditModalOpen(true)
  }

  const handleFinalizarFicha = (ficha: Ficha) => {
    setConfirmDialog({
      isOpen: true,
      title: "Finalizar ficha",
      message: `¿Estas seguro de finalizar la ficha ${ficha.numero_ficha}? No se podran hacer nuevas asignaciones.`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false })
        try {
          // await api.fichas.finalizar(ficha.id)
          showToast(`Ficha ${ficha.numero_ficha} finalizada`, "success")
          cargarFichas()
        } catch (err) {
          showToast("Error al finalizar ficha", "error")
        }
      },
    })
  }

  const handleEditFicha = async (data: Partial<Ficha>) => {
    if (!selectedFicha) return
    // await api.fichas.update(selectedFicha.id, data)
    showToast("Ficha actualizada exitosamente", "success")
    setIsEditModalOpen(false)
    cargarFichas()
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
            <h1 className="text-2xl font-bold text-gray-900">Fichas</h1>
            <p className="text-gray-500 text-sm">Gestion de fichas de formacion</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-sena hover:bg-sena/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Registrar ficha
          </button>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Numero o programa..."
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
            </select>

            <select
              value={filtroJornada}
              onChange={(e) => setFiltroJornada(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todas">Jornada: Todas</option>
              <option value="Manana">Manana</option>
              <option value="Tarde">Tarde</option>
              <option value="Noche">Noche</option>
              <option value="Mixta">Mixta</option>
            </select>

            <select
              value={filtroEtapa}
              onChange={(e) => setFiltroEtapa(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todas">Etapa: Todas</option>
              <option value="lectiva">Lectiva</option>
              <option value="productiva">Productiva</option>
            </select>

            <select
              value={filtroModalidad}
              onChange={(e) => setFiltroModalidad(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todas">Modalidad: Todas</option>
              <option value="Presencial">Presencial</option>
              <option value="Virtual">Virtual</option>
              <option value="A distancia">A distancia</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-sena mb-2" />
              <p>Cargando fichas...</p>
            </div>
          ) : listaFiltrada.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No se encontraron fichas con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">No. Ficha</th>
                    <th className="px-6 py-4">Programa</th>
                    <th className="px-6 py-4">Jornada</th>
                    <th className="px-6 py-4">Etapa</th>
                    <th className="px-6 py-4">Modalidad</th>
                    <th className="px-6 py-4 text-center">Instructores</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listaFiltrada.map((ficha) => (
                    <tr key={ficha.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{ficha.numero_ficha}</td>
                      <td className="px-6 py-4 text-gray-700">{ficha.programa}</td>
                      <td className="px-6 py-4 text-gray-500">{ficha.jornada}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ficha.etapa === 'lectiva' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {ficha.etapa === 'lectiva' ? 'Lectiva' : 'Productiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ficha.modalidad === 'Presencial' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {ficha.modalidad}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">{ficha.instructores_count}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ficha.estado === 'Activa' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {ficha.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openDetailModal(ficha)}
                            className="p-1.5 text-gray-400 hover:text-sena hover:bg-sena/10 rounded transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(ficha)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleFinalizarFicha(ficha)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Finalizar ficha"
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
              Mostrando {listaFiltrada.length} de {fichas.length}
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

      <CrearFichaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (data) => {
          try {
            // await api.fichas.create(data)
            showToast("Ficha registrada exitosamente", "success")
            setIsCreateModalOpen(false)
            cargarFichas()
          } catch (err) {
            showToast("Error al crear ficha", "error")
          }
        }}
      />

      <DetailFichaModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        ficha={selectedFicha}
      />

      <EditFichaModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        ficha={selectedFicha}
        onSubmit={handleEditFicha}
      />

      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
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
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  )
}
