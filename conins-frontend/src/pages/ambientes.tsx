import { useState, useEffect } from "react"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import CrearAmbienteModal from "@/components/ambientes/CrearAmbienteModal"
import EditarAmbienteModal from "@/components/ambientes/EditarAmbienteModal"
import VerAgendaAmbienteModal from "@/components/ambientes/VerAgendaAmbienteModal"
import BloquearAmbienteModal from "@/components/ambientes/BloquearAmbienteModal"
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Lock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from "lucide-react"

type Ambiente = {
  id: number
  nombre: string
  tipo: string
  capacidad: number
  area_id: number | null
  activo: boolean
  ocupante_actual?: {
    instructor: string
    ficha: string
    competencia: string
  }
}


export default function AmbientesPage() {
  const { user, loading: authLoading } = useProtectedRoute()
  const { showToast } = useToast()
  const [ambientes, setAmbientes] = useState<Ambiente[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false)
  const [isBloqueoModalOpen, setIsBloqueoModalOpen] = useState(false)
  const [selectedAmbiente, setSelectedAmbiente] = useState<Ambiente | null>(null)

  const [search, setSearch] = useState("")
  const [paginaActual, setPaginaActual] = useState(1)
  const porPagina = 10
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [filtroEstado, setFiltroEstado] = useState("todos")

  const rol = user?.roles?.[0]?.trim() || ""
  const puedeEditar = !["Instructor", "Subdirector"].includes(rol)

  useEffect(() => {
    cargarAmbientes()
  }, [])

  const cargarAmbientes = async () => {
    setLoading(true)
    try {
      const res = await api.ambientes.getAll()
      setAmbientes(res.data || [])
    } catch (err) {
      console.warn("Error cargando ambientes:", err)
      setAmbientes([])
    } finally {
      setLoading(false)
    }
  }

  const listaFiltrada = ambientes.filter((amb) => {
    const texto = search.toLowerCase()
    const coincideBusqueda = amb.nombre.toLowerCase().includes(texto)
    const coincideTipo = filtroTipo === "todos" || amb.tipo === filtroTipo
    const coincideEstado = filtroEstado === "todos" || (filtroEstado === "activo" ? amb.activo : !amb.activo)
    return coincideBusqueda && coincideTipo && coincideEstado
  })

  const totalPaginas = Math.ceil(listaFiltrada.length / porPagina)
  const listaPaginada = listaFiltrada.slice((paginaActual - 1) * porPagina, paginaActual * porPagina)

  useEffect(() => { setPaginaActual(1) }, [search, filtroTipo, filtroEstado])

  const handleCreate = async (data: any) => {
    try {
      await api.ambientes.create(data)
      showToast("Ambiente registrado exitosamente", "success")
      setIsCreateModalOpen(false)
      cargarAmbientes()
    } catch (err: any) {
      showToast(err.message || "Error al registrar ambiente", "error")
    }
  }

  const openAgendaModal = (amb: Ambiente) => {
    setSelectedAmbiente(amb)
    setIsAgendaModalOpen(true)
  }

  const openEditModal = (amb: Ambiente) => {
    setSelectedAmbiente(amb)
    setIsEditModalOpen(true)
  }

  const openBloqueoModal = (amb: Ambiente) => {
    setSelectedAmbiente(amb)
    setIsBloqueoModalOpen(true)
  }

  const handleBloqueo = async (data: any) => {
    if (!selectedAmbiente) return
    try {
      await api.ambientes.bloquear(selectedAmbiente.id, data)
      showToast("Bloqueo registrado exitosamente", "success")
      setIsBloqueoModalOpen(false)
      cargarAmbientes()
    } catch (err: any) {
      showToast(err.message || "Error al registrar bloqueo", "error")
    }
  }

  const handleEdit = async (data: any) => {
    if (!selectedAmbiente) return
    try {
      await api.ambientes.update(selectedAmbiente.id, data)
      showToast("Ambiente actualizado exitosamente", "success")
      setIsEditModalOpen(false)
      cargarAmbientes()
    } catch (err: any) {
      showToast(err.message || "Error al actualizar ambiente", "error")
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Ambientes</h1>
            <p className="text-gray-500 text-sm">{puedeEditar ? "Aulas y talleres del CDMC" : "Mis ambientes asignados"}</p>
          </div>
          {puedeEditar && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-sena hover:bg-sena/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Registrar ambiente
            </button>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar ambiente..."
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
              <option value="todos">Tipo: Todos</option>
              <option value="Aula">Aula</option>
              <option value="Taller">Taller</option>
              <option value="Laboratorio">Laboratorio</option>
              <option value="Auditorio">Auditorio</option>
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todos">Estado: Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-sena mb-2" />
              <p>Cargando ambientes...</p>
            </div>
          ) : listaPaginada.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No se encontraron ambientes con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 md:px-6 md:py-4">Nombre</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Tipo</th>
                    <th className="px-3 py-3 md:px-6 md:py-4 text-center">Capacidad</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Estado</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Ocupante Actual</th>
                    {puedeEditar && <th className="px-3 py-3 md:px-6 md:py-4 text-center">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listaPaginada.map((amb) => (
                    <tr key={amb.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-3 md:px-6 md:py-4 font-medium text-gray-900">{amb.nombre}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">{amb.tipo}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-center text-gray-700">{amb.capacidad ? `${amb.capacidad} pax` : "—"}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          !amb.activo ? 'bg-red-100 text-red-800' :
                          amb.ocupante_actual ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {!amb.activo ? 'Inactivo' :
                           amb.ocupante_actual ? 'Ocupado' : 'Disponible'}
                        </span>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4">
                        {amb.ocupante_actual ? (
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{amb.ocupante_actual.instructor}</p>
                            <p className="text-xs text-gray-500">Grupo {amb.ocupante_actual.ficha} · {amb.ocupante_actual.competencia}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                        {puedeEditar ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openAgendaModal(amb)}
                              className="p-1.5 text-gray-400 hover:text-sena hover:bg-sena/10 rounded transition-colors"
                              title="Ver agenda"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openBloqueoModal(amb)}
                              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                              title="Registrar bloqueo"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(amb)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </div>
                        ) : rol === "Subdirector" ? (
                          <button
                            onClick={() => openAgendaModal(amb)}
                            className="p-1.5 text-gray-400 hover:text-sena hover:bg-sena/10 rounded transition-colors"
                            title="Ver agenda"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-3 py-3 md:px-6 md:py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-500">
              Mostrando {(paginaActual - 1) * porPagina + 1}–{Math.min(paginaActual * porPagina, listaFiltrada.length)} de {listaFiltrada.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className={`p-1 rounded border border-gray-300 bg-white ${paginaActual === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPaginaActual(p)}
                  className={`px-3 py-1 rounded text-sm font-medium ${p === paginaActual ? 'bg-sena text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                className={`p-1 rounded border border-gray-300 bg-white ${paginaActual === totalPaginas ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <CrearAmbienteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />

      <EditarAmbienteModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        ambiente={selectedAmbiente}
        onSubmit={handleEdit}
      />

      <VerAgendaAmbienteModal
        isOpen={isAgendaModalOpen}
        onClose={() => setIsAgendaModalOpen(false)}
        ambiente={selectedAmbiente}
      />

      <BloquearAmbienteModal
        isOpen={isBloqueoModalOpen}
        onClose={() => setIsBloqueoModalOpen(false)}
        ambiente={selectedAmbiente}
        onSubmit={handleBloqueo}
      />

    </DashboardLayout>
  )
}
