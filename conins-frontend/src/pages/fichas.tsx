import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import { formatJornada } from "@/lib/terminology"
import CrearFichaModal from "@/components/fichas/CrearFichaModal"
import DetailFichaModal from "@/components/fichas/DetailFichaModal"
import EditFichaModal from "@/components/fichas/EditFichaModal"
import RapSeguimientoModal from "@/components/fichas/RapSeguimientoModal"
import NovedadFichaModal from "@/components/fichas/NovedadFichaModal"
import DetailInstructorModal from "@/components/instructores/DetailInstructorModal"
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
  ClipboardList,
  FileWarning,
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
  instructor_nombre?: string
}


export default function FichasPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useProtectedRoute()
  const { showToast } = useToast()
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isRapModalOpen, setIsRapModalOpen] = useState(false)
  const [isNovedadModalOpen, setIsNovedadModalOpen] = useState(false)
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null)
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false)
  const [selectedInstructor, setSelectedInstructor] = useState<any>(null)
  const [asignacionesPorFicha, setAsignacionesPorFicha] = useState<Record<number, { instructor_id: number; instructor_nombre: string }[]>>({})

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
  const [programas, setProgramas] = useState<{ id: number; nombre: string }[]>([])
  const [filtroJornada, setFiltroJornada] = useState("todas")
  const [filtroEtapa, setFiltroEtapa] = useState("todas")
  const [filtroModalidad, setFiltroModalidad] = useState("todas")

  const rol = user?.roles?.[0]?.trim() || ""
  const puedeEditar = !["Instructor", "Subdirector"].includes(rol)

  useEffect(() => {
    cargarFichas()
    cargarProgramas()
  }, [])

  const cargarProgramas = async () => {
    try {
      const res = await api.programs.getAll()
      setProgramas(res.data)
    } catch (err) {
      console.warn("Backend no disponible para programas:", err)
    }
  }

  const cargarFichas = async () => {
    setLoading(true)
    try {
      const [fichaRes, asigRes] = await Promise.all([
        api.fichas.getAll(),
        api.assignments.getAll(),
      ])
      setFichas(fichaRes.data || [])

      // Agrupar instructores por ficha (solo activas, sin duplicar nombre)
      const mapa: Record<number, { instructor_id: number; instructor_nombre: string }[]> = {}
      for (const a of (asigRes.data || [])) {
        if (!a.activo) continue
        if (!mapa[a.ficha_id]) mapa[a.ficha_id] = []
        const yaExiste = mapa[a.ficha_id].some((i: any) => i.instructor_id === a.instructor_id)
        if (!yaExiste) {
          mapa[a.ficha_id].push({ instructor_id: a.instructor_id, instructor_nombre: a.instructor_nombre })
        }
      }
      setAsignacionesPorFicha(mapa)
    } catch (err) {
      console.warn("Error cargando fichas:", err)
      setFichas([])
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

  const totalPaginas = Math.ceil(listaFiltrada.length / porPagina)
  const listaPaginada = listaFiltrada.slice((paginaActual - 1) * porPagina, paginaActual * porPagina)

  useEffect(() => { setPaginaActual(1) }, [search, filtroPrograma, filtroJornada, filtroEtapa, filtroModalidad])

  const openDetailModal = (ficha: Ficha) => {
    setSelectedFicha(ficha)
    setIsDetailModalOpen(true)
  }

  const openEditModal = (ficha: Ficha) => {
    setSelectedFicha(ficha)
    setIsEditModalOpen(true)
  }

  const openRapModal = (ficha: Ficha) => {
    setSelectedFicha(ficha)
    setIsRapModalOpen(true)
  }

  const openNovedadModal = (ficha: Ficha) => {
    setSelectedFicha(ficha)
    setIsNovedadModalOpen(true)
  }

  const handleFinalizarFicha = (ficha: Ficha) => {
    setConfirmDialog({
      isOpen: true,
      title: "Finalizar grupo",
      message: `¿Estás seguro de finalizar el grupo ${ficha.numero_ficha}? No se podrán hacer nuevas asignaciones.`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false })
        try {
          await api.fichas.finalizar(ficha.id)
          showToast(`Grupo ${ficha.numero_ficha} finalizado`, "success")
          cargarFichas()
        } catch (err: any) {
          showToast(err.message || "Error al finalizar grupo", "error")
        }
      },
    })
  }

  const handleEditFicha = async (data: Partial<Ficha>) => {
    if (!selectedFicha) return
    try {
      await api.fichas.update(selectedFicha.id, data)
      showToast("Grupo actualizado exitosamente", "success")
      setIsEditModalOpen(false)
      cargarFichas()
    } catch (err: any) {
      showToast(err.message || "Error al actualizar grupo", "error")
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
            <h1 className="text-2xl font-bold text-gray-900">Grupos</h1>
            <p className="text-gray-500 text-sm">{puedeEditar ? "Gestión de grupos de formación" : "Mis grupos asignados"}</p>
          </div>
          {puedeEditar && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-sena hover:bg-sena/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Registrar grupo
            </button>
          )}
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

          <div className="grid grid-cols-2 gap-3 w-full md:flex md:flex-wrap md:w-auto">
            <select
              value={filtroPrograma}
              onChange={(e) => setFiltroPrograma(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todos">Programa: Todos</option>
              {programas.map((p) => (
                <option key={p.id} value={p.nombre}>{p.nombre}</option>
              ))}
            </select>

            <select
              value={filtroJornada}
              onChange={(e) => setFiltroJornada(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todas">Jornada: Todas</option>
              <option value="manana">Mañana</option>
              <option value="mixta">Mixta</option>
              <option value="noche">Noche</option>
              <option value="virtual">Virtual</option>
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
              <p>Cargando grupos...</p>
            </div>
          ) : listaPaginada.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No se encontraron grupos con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 md:px-6 md:py-4">No. Grupo</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Programa</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Jornada</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Etapa</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Modalidad</th>
                    <th className="px-3 py-3 md:px-6 md:py-4 text-center">Instructores</th>
                    <th className="px-3 py-3 md:px-6 md:py-4 text-center">Estado</th>
                    {puedeEditar && <th className="px-3 py-3 md:px-6 md:py-4 text-center">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listaPaginada.map((ficha) => (
                    <tr key={ficha.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-3 md:px-6 md:py-4 font-medium text-gray-900">
                        <button
                          onClick={() => openDetailModal(ficha)}
                          className="text-left hover:text-sena hover:underline transition-colors"
                          title="Ver detalle del grupo"
                        >
                          {ficha.numero_ficha}
                        </button>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-700">
                        <button
                          onClick={() => router.push("/gestion-competencias")}
                          className="text-left hover:text-sena hover:underline transition-colors"
                          title="Ver competencias del programa"
                        >
                          {ficha.programa}
                        </button>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">{formatJornada(ficha.jornada)}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ficha.etapa === 'lectiva' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {ficha.etapa === 'lectiva' ? 'Lectiva' : 'Productiva'}
                        </span>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ficha.modalidad === 'Presencial' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {ficha.modalidad}
                        </span>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-700">
                        {(asignacionesPorFicha[ficha.id] || []).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {(asignacionesPorFicha[ficha.id] || []).map((inst) => (
                              <button
                                key={inst.instructor_id}
                                onClick={async () => {
                                  try {
                                    const res = await api.instructors.getById(inst.instructor_id)
                                    setSelectedInstructor(res.data)
                                  } catch {
                                    setSelectedInstructor({ id: inst.instructor_id, nombre: inst.instructor_nombre, email: "", tipo_area: "", activo: true, roles: "Instructor" })
                                  }
                                  setIsInstructorModalOpen(true)
                                }}
                                className="text-xs px-2 py-1 bg-sena/10 text-sena rounded-full hover:bg-sena/20 hover:underline transition-colors"
                                title="Ver detalle del instructor"
                              >
                                {inst.instructor_nombre.split(" ").slice(0, 2).join(" ")}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ficha.estado === 'Activa' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {ficha.estado}
                        </span>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                        {puedeEditar ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openDetailModal(ficha)}
                              className="p-1.5 text-gray-400 hover:text-sena hover:bg-sena/10 rounded transition-colors"
                              title="Ver detalle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openRapModal(ficha)}
                              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                              title="Seguimiento RAPs"
                            >
                              <ClipboardList className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openNovedadModal(ficha)}
                              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                              title="Novedades"
                            >
                              <FileWarning className="w-4 h-4" />
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
                              title="Finalizar grupo"
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openDetailModal(ficha)}
                              className="p-1.5 text-gray-400 hover:text-sena hover:bg-sena/10 rounded transition-colors"
                              title="Ver detalle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openRapModal(ficha)}
                              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                              title="Seguimiento RAPs"
                            >
                              <ClipboardList className="w-4 h-4" />
                            </button>
                          </div>
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

      <CrearFichaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (data) => {
          try {
            await api.fichas.create(data)
            showToast("Grupo registrado exitosamente", "success")
            setIsCreateModalOpen(false)
            cargarFichas()
          } catch (err: any) {
            showToast(err.message || "Error al crear grupo", "error")
          }
        }}
      />

      <DetailFichaModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        ficha={selectedFicha}
        onInstructorClick={async (instructorId, nombre) => {
          try {
            const res = await api.instructors.getById(instructorId)
            setSelectedInstructor(res.data)
          } catch {
            setSelectedInstructor({ id: instructorId, nombre, email: "", tipo_area: "", activo: true, roles: "Instructor" })
          }
          setIsInstructorModalOpen(true)
        }}
      />

      <EditFichaModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        ficha={selectedFicha}
        onSubmit={handleEditFicha}
      />

      <RapSeguimientoModal
        isOpen={isRapModalOpen}
        onClose={() => setIsRapModalOpen(false)}
        fichaId={selectedFicha?.id ?? null}
        fichaNumero={selectedFicha?.numero_ficha ?? ""}
        puedeEditar={puedeEditar}
        onToast={showToast}
      />

      <NovedadFichaModal
        isOpen={isNovedadModalOpen}
        onClose={() => setIsNovedadModalOpen(false)}
        ficha={selectedFicha}
        puedeEditar={puedeEditar}
      />

      <DetailInstructorModal
        isOpen={isInstructorModalOpen}
        onClose={() => setIsInstructorModalOpen(false)}
        instructor={selectedInstructor}
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
