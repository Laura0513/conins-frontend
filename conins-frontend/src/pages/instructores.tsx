import { useState, useEffect } from "react"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import CreateInstructorModal from "@/components/instructores/CreateInstructorModal"
import NovedadModal from "@/components/instructores/NovedadModal"
import DetailInstructorModal from "@/components/instructores/DetailInstructorModal"
import EditInstructorModal from "@/components/instructores/EditInstructorModal"
import {
  Search,
  Plus,
  Eye,
  Pencil,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from "lucide-react"

type Instructor = {
  id: number
  nombre: string
  email: string
  tipo_area: string
  activo: boolean
  roles: string
  horas_semana?: number
  tiene_novedad?: boolean
}

export default function InstructoresPage() {
  const { user, loading: authLoading } = useProtectedRoute()
  const { showToast } = useToast()
  const [instructores, setInstructores] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isNovedadModalOpen, setIsNovedadModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null)
  const [selectedInstructorId, setSelectedInstructorId] = useState<number | null>(null)
  const [selectedInstructorName, setSelectedInstructorName] = useState<string>("")

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} })

  const [search, setSearch] = useState("")
  const [paginaActual, setPaginaActual] = useState(1)
  const porPagina = 10

  const [filtroArea, setFiltroArea] = useState("todas")
  const [filtroEstado, setFiltroEstado] = useState("todos")

  const rol = user?.roles?.[0]?.trim() || ""
  const esSubdirector = rol === "Subdirector"
  const puedeEditar = !["Instructor", "Subdirector"].includes(rol)

  useEffect(() => {
    cargarInstructores()
  }, [])

  const cargarInstructores = async () => {
    setLoading(true)
    try {
      const res = await api.instructors.getAll()
      setInstructores(res.data)
    } catch (err) {
      console.error("Error cargando instructores:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInstructor = async (data: { nombre: string; email: string; tipo_area: string }) => {
    await api.instructors.create(data)
    showToast("Instructor registrado exitosamente", "success")
    setIsCreateModalOpen(false)
    cargarInstructores()
  }

  const handleNovedadSubmit = async (data: { tipo_novedad_id: number; fecha_inicio: string; fecha_regreso: string; observacion: string }) => {
    if (!selectedInstructorId) return

    setConfirmDialog({
      isOpen: true,
      title: "Confirmar novedad",
      message: `Estas seguro de que quieres registrar esta novedad para ${selectedInstructorName}? El instructor quedara excluido de asignaciones mientras la novedad este vigente.`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false })
        try {
          await api.instructors.registrarNovedad(selectedInstructorId, data)
          showToast("Novedad registrada exitosamente", "success")
          setIsNovedadModalOpen(false)
          cargarInstructores()
        } catch (err) {
          showToast("Error al registrar novedad.", "error")
        }
      },
    })
  }

  const openNovedadModal = (instructorId: number, instructorName: string) => {
    setSelectedInstructorId(instructorId)
    setSelectedInstructorName(instructorName)
    setIsNovedadModalOpen(true)
  }

  const openDetailModal = (instructor: Instructor) => {
    setSelectedInstructor(instructor)
    setIsDetailModalOpen(true)
  }

  const openEditModal = (instructor: Instructor) => {
    setSelectedInstructor(instructor)
    setIsEditModalOpen(true)
  }

  const handleEditInstructor = async (data: Partial<Instructor>) => {
    if (!selectedInstructor) return
    try {
      await api.instructors.update(selectedInstructor.id, data)
      showToast("Instructor actualizado exitosamente", "success")
      setIsEditModalOpen(false)
      cargarInstructores()
    } catch (err) {
      showToast("Error al actualizar instructor.", "error")
    }
  }

  const listaFiltrada = instructores.filter((inst) => {
    const texto = search.toLowerCase()
    const coincideBusqueda = inst.nombre.toLowerCase().includes(texto) || inst.email.toLowerCase().includes(texto)
    const coincideArea = filtroArea === "todas" || inst.tipo_area === filtroArea

    let coincideEstado = true
    if (filtroEstado === "activo") {
      coincideEstado = inst.activo && !inst.tiene_novedad
    } else if (filtroEstado === "con_novedad") {
      coincideEstado = !!inst.tiene_novedad
    } else if (filtroEstado === "inactivo") {
      coincideEstado = !inst.activo
    }

    return coincideBusqueda && coincideArea && coincideEstado
  })

  const totalPaginas = Math.ceil(listaFiltrada.length / porPagina)
  const listaPaginada = listaFiltrada.slice((paginaActual - 1) * porPagina, paginaActual * porPagina)

  // Resetear página al cambiar filtros
  useEffect(() => { setPaginaActual(1) }, [search, filtroArea, filtroEstado])

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
            <h1 className="text-2xl font-bold text-gray-900">Instructores</h1>
            <p className="text-gray-500 text-sm">Gestion de instructores del CDMC</p>
          </div>
          {puedeEditar && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-sena hover:bg-sena/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Registrar instructor
            </button>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar instructor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 w-full md:flex md:flex-wrap md:w-auto">
            <select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todas">Area: Todas</option>
              <option value="tecnica">Tecnica</option>
              <option value="transversal">Transversal</option>
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todos">Estado: Todos</option>
              <option value="activo">Activo</option>
              <option value="con_novedad">Con novedad</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-sena mb-2" />
              <p>Cargando instructores...</p>
            </div>
          ) : listaPaginada.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No se encontraron instructores con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 md:px-6 md:py-4">Nombre</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Correo</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Area</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Horas/sem</th>
                    <th className="px-3 py-3 md:px-6 md:py-4 text-center">Estado</th>
                    <th className="px-3 py-3 md:px-6 md:py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listaPaginada.map((inst) => (
                    <tr key={inst.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-3 md:px-6 md:py-4 font-medium text-gray-900">{inst.nombre}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">{inst.email}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-700 capitalize">{inst.tipo_area}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4">
                        {(() => {
                          const horas = inst.horas_semana ?? 0
                          const limite = 40
                          const porcentaje = Math.min((horas / limite) * 100, 100)
                          let colorBarra = "bg-sena"
                          let colorTexto = "text-sena"

                          if (horas > limite) {
                            colorBarra = "bg-red-500"
                            colorTexto = "text-red-600"
                          } else if (horas < 20) {
                            colorBarra = "bg-yellow-500"
                            colorTexto = "text-yellow-600"
                          }

                          return (
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-medium w-8 ${colorTexto}`}>{horas}h</span>
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${colorBarra}`}
                                  style={{ width: `${porcentaje}%` }}
                                />
                              </div>
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          inst.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {inst.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openDetailModal(inst)}
                            className="p-1.5 text-gray-400 hover:text-sena hover:bg-sena/10 rounded transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {puedeEditar && (
                            <>
                              <button
                                onClick={() => openEditModal(inst)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openNovedadModal(inst.id, inst.nombre)}
                                className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                title="Registrar novedad"
                              >
                                <CalendarX className="w-4 h-4" />
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

      <CreateInstructorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateInstructor}
      />

      <NovedadModal
        isOpen={isNovedadModalOpen}
        onClose={() => setIsNovedadModalOpen(false)}
        onSubmit={handleNovedadSubmit}
        instructorName={selectedInstructorName}
      />

      <DetailInstructorModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        instructor={selectedInstructor}
      />

      <EditInstructorModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        instructor={selectedInstructor}
        onSubmit={handleEditInstructor}
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
