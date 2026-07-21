import { useState, useEffect } from "react"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import CrearCompetenciaModal from "@/components/competencias/CrearCompetenciaModal"
import EditarCompetenciaModal from "@/components/competencias/EditarCompetenciaModal"
import VerRapsModal from "@/components/competencias/VerRapsModal"
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
  Layers,
} from "lucide-react"

type Competencia = {
  id: number
  codigo: string
  nombre: string
  programa_id: number
  programa_nombre: string
  raps_count: number
  activo: boolean
}

type Programa = {
  id: number
  nombre: string
}

export default function GestionCompetenciasPage() {
  const { user, loading: authLoading } = useProtectedRoute()
  const { showToast } = useToast()
  const [competencias, setCompetencias] = useState<Competencia[]>([])
  const [programas, setProgramas] = useState<Programa[]>([])
  const [loading, setLoading] = useState(true)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isRapsModalOpen, setIsRapsModalOpen] = useState(false)
  const [selectedCompetencia, setSelectedCompetencia] = useState<Competencia | null>(null)

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} })

  const [search, setSearch] = useState("")
  const [paginaActual, setPaginaActual] = useState(1)
  const porPagina = 10
  const [filtroPrograma, setFiltroPrograma] = useState("todos")
  const [filtroEstado, setFiltroEstado] = useState("todos")

  const rol = user?.roles?.[0]?.trim() || ""
  const puedeEditar = !["Instructor", "Subdirector"].includes(rol)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [compRes, progRes] = await Promise.all([
        api.competencias.getAll(),
        api.programs.getAll(),
      ])
      setCompetencias(compRes.data || [])
      setProgramas(progRes.data || [])
    } catch (err) {
      console.warn("Error cargando datos:", err)
      setCompetencias([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (data: any) => {
    try {
      await api.competencias.create(data)
      showToast("Competencia registrada exitosamente", "success")
      setIsCreateModalOpen(false)
      cargarDatos()
    } catch (err: any) {
      showToast(err.message || "Error al registrar competencia", "error")
    }
  }

  const handleEdit = async (data: any) => {
    if (!selectedCompetencia) return
    try {
      await api.competencias.update(selectedCompetencia.id, data)
      showToast("Competencia actualizada exitosamente", "success")
      setIsEditModalOpen(false)
      cargarDatos()
    } catch (err: any) {
      showToast(err.message || "Error al actualizar competencia", "error")
    }
  }

  const handleToggleEstado = (comp: Competencia) => {
    const accion = comp.activo ? "desactivar" : "activar"
    setConfirmDialog({
      isOpen: true,
      title: `${comp.activo ? "Desactivar" : "Activar"} competencia`,
      message: `¿Estás seguro de que quieres ${accion} la competencia "${comp.nombre}"?${
        comp.activo ? " Los RAPs asociados también se desactivarán." : ""
      }`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false })
        try {
          await api.competencias.toggleEstado(comp.id)
          showToast(`Competencia ${accion === "desactivar" ? "desactivada" : "activada"} exitosamente`, "success")
          cargarDatos()
        } catch (err: any) {
          showToast(err.message || `Error al ${accion} competencia`, "error")
        }
      },
    })
  }

  const openEditModal = (comp: Competencia) => {
    setSelectedCompetencia(comp)
    setIsEditModalOpen(true)
  }

  const openRapsModal = (comp: Competencia) => {
    setSelectedCompetencia(comp)
    setIsRapsModalOpen(true)
  }

  const listaFiltrada = competencias.filter((comp) => {
    const texto = search.toLowerCase()
    const coincideBusqueda =
      comp.nombre.toLowerCase().includes(texto) ||
      comp.codigo.toLowerCase().includes(texto) ||
      (comp.programa_nombre || "").toLowerCase().includes(texto)
    const coincidePrograma =
      filtroPrograma === "todos" || String(comp.programa_id) === filtroPrograma
    const coincideEstado =
      filtroEstado === "todos" || (filtroEstado === "activo" ? comp.activo : !comp.activo)
    return coincideBusqueda && coincidePrograma && coincideEstado
  })

  const totalPaginas = Math.ceil(listaFiltrada.length / porPagina)
  const listaPaginada = listaFiltrada.slice(
    (paginaActual - 1) * porPagina,
    paginaActual * porPagina
  )

  useEffect(() => {
    setPaginaActual(1)
  }, [search, filtroPrograma, filtroEstado])

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
            <h1 className="text-2xl font-bold text-gray-900">Competencias y RAPs</h1>
            <p className="text-gray-500 text-sm">
              {puedeEditar
                ? "Gestión del catálogo de competencias y resultados de aprendizaje"
                : "Catálogo de competencias y resultados de aprendizaje"}
            </p>
          </div>
          {puedeEditar && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-sena hover:bg-sena/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Registrar competencia
            </button>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código, nombre o programa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 w-full md:flex md:flex-wrap md:w-auto">
            <select
              value={filtroPrograma}
              onChange={(e) => setFiltroPrograma(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todos">Programa: Todos</option>
              {programas.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.nombre}
                </option>
              ))}
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
              <p>Cargando competencias...</p>
            </div>
          ) : listaPaginada.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Layers className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No se encontraron competencias con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 md:px-6 md:py-4">Código</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Competencia</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Programa</th>
                    <th className="px-3 py-3 md:px-6 md:py-4 text-center">RAPs</th>
                    <th className="px-3 py-3 md:px-6 md:py-4 text-center">Estado</th>
                    <th className="px-3 py-3 md:px-6 md:py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listaPaginada.map((comp) => (
                    <tr key={comp.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-3 md:px-6 md:py-4 font-mono text-xs text-gray-600">
                        {comp.codigo}
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 font-medium text-gray-900">
                        {comp.nombre}
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">
                        {comp.programa_nombre}
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                        <button
                          onClick={() => openRapsModal(comp)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          {comp.raps_count ?? 0} RAPs
                        </button>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            comp.activo
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {comp.activo ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openRapsModal(comp)}
                            className="p-1.5 text-gray-400 hover:text-sena hover:bg-sena/10 rounded transition-colors"
                            title="Ver RAPs"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {puedeEditar && (
                            <>
                              <button
                                onClick={() => openEditModal(comp)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleEstado(comp)}
                                className={`p-1.5 rounded transition-colors ${
                                  comp.activo
                                    ? "text-gray-400 hover:text-red-600 hover:bg-red-50"
                                    : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                                }`}
                                title={comp.activo ? "Desactivar" : "Activar"}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {listaFiltrada.length > 0 && (
            <div className="px-3 py-3 md:px-6 md:py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <span className="text-sm text-gray-500">
                Mostrando {(paginaActual - 1) * porPagina + 1}–
                {Math.min(paginaActual * porPagina, listaFiltrada.length)} de{" "}
                {listaFiltrada.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className={`p-1 rounded border border-gray-300 bg-white ${
                    paginaActual === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPaginaActual(p)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      p === paginaActual
                        ? "bg-sena text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className={`p-1 rounded border border-gray-300 bg-white ${
                    paginaActual === totalPaginas
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CrearCompetenciaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        programas={programas}
      />

      <EditarCompetenciaModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        competencia={selectedCompetencia}
        onSubmit={handleEdit}
        programas={programas}
      />

      <VerRapsModal
        isOpen={isRapsModalOpen}
        onClose={() => setIsRapsModalOpen(false)}
        competencia={selectedCompetencia}
        puedeEditar={puedeEditar}
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
