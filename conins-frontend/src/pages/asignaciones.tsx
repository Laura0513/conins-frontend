import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import { formatJornada } from "@/lib/terminology"
import CrearAsignacionModal from "@/components/asignaciones/CrearAsignacionModal"
import RegistrarProvisionalModal from "@/components/asignaciones/RegistrarProvisionalModal"
import DetailAsignacionModal from "@/components/asignaciones/DetailAsignacionModal"
import EditAsignacionModal from "@/components/asignaciones/EditAsignacionModal"
import DetailInstructorModal from "@/components/instructores/DetailInstructorModal"
import DetailFichaModal from "@/components/fichas/DetailFichaModal"
import VerAgendaAmbienteModal from "@/components/ambientes/VerAgendaAmbienteModal"
import { exportarAsignacionesPDF } from "@/lib/exportPDF"
import { TableSkeleton, PageSkeleton } from "@/components/ui/Skeleton"
import EmptyState from "@/components/ui/EmptyState"
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
  ClipboardList,
  FileDown,
} from "lucide-react"

type Asignacion = {
  id: number
  instructor_id: number
  ficha_id: number
  competencia_id: number
  instructor_nombre: string
  ficha_numero: string
  competencia: string
  ambiente: string
  jornada: string
  es_lider: boolean
  es_provisional: boolean
  activo: boolean
  tipo: "activa" | "provisional" | "historica"
}


export default function AsignacionesPage() {
  const router = useRouter()
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
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false)
  const [selectedInstructor, setSelectedInstructor] = useState<{ id: number; nombre: string; email: string; tipo_area: string; activo: boolean; roles: string } | null>(null)
  const [isFichaModalOpen, setIsFichaModalOpen] = useState(false)
  const [selectedFicha, setSelectedFicha] = useState<any>(null)
  const [isAmbienteModalOpen, setIsAmbienteModalOpen] = useState(false)
  const [selectedAmbiente, setSelectedAmbiente] = useState<any>(null)

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
  const [filtroCoordinacion, setFiltroCoordinacion] = useState("todos")

  const rol = user?.roles?.[0]?.trim() || ""
  const puedeEditar = !["Instructor", "Subdirector"].includes(rol)

  useEffect(() => {
    cargarAsignaciones()
  }, [])

  const cargarAsignaciones = async () => {
    setLoading(true)
    try {
      const res = await api.assignments.getAll()
      const mapped = res.data.map((a: any) => ({
        ...a,
        tipo: !a.activo ? "historica" : a.es_provisional ? "provisional" : "activa",
      }))
      setAsignaciones(mapped)
    } catch (err) {
      console.warn("Error cargando asignaciones:", err)
      setAsignaciones([])
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
    const coincideCoordinacion = filtroCoordinacion === "todos"
    
    return coincideTab && coincideBusqueda && coincidePrograma && coincideCoordinacion
  })

  const totalPaginas = Math.ceil(listaFiltrada.length / porPagina)
  const listaPaginada = listaFiltrada.slice((paginaActual - 1) * porPagina, paginaActual * porPagina)

  useEffect(() => { setPaginaActual(1) }, [search, filtroPrograma, filtroCoordinacion, activeTab])

  const handleCreate = async (data: any) => {
    try {
      const { rapsSeleccionados, horario, ...asignacionData } = data
      const res = await api.assignments.create(asignacionData)
      const asignacionId = res.data?.id

      // Guardar RAPs seleccionados por competencia
      if (asignacionId && rapsSeleccionados) {
        for (const [competenciaId, rapIds] of Object.entries(rapsSeleccionados)) {
          if ((rapIds as number[]).length > 0) {
            try {
              await api.assignments.setRaps(asignacionId, Number(competenciaId), rapIds as number[])
            } catch (rapErr: any) {
              showToast(rapErr.message || "Error al asignar RAPs", "error")
            }
          }
        }
      }

      // Crear horario si se proporcionó
      let horarioCreado = false
      if (horario && horario.dias && horario.dias.length > 0) {
        try {
          const now = new Date()
          const day = now.getDay()
          const diff = day === 0 ? -6 : 1 - day
          const lunes = new Date(now)
          lunes.setDate(now.getDate() + diff)
          const semana = lunes.toISOString().split("T")[0]

          const compId = Number(asignacionData.competencia_ids?.[0])
          if (!compId || isNaN(compId)) {
            console.error("competencia_id inválido:", asignacionData.competencia_ids)
            showToast("No se pudo crear horario: competencia no válida", "error")
          } else {
            let todosOk = true
            for (const dia of horario.dias) {
              const horarioPayload = {
                ficha_id: Number(asignacionData.ficha_id),
                instructor_id: Number(asignacionData.instructor_id),
                competencia_id: compId,
                dia_semana: Number(dia),
                hora_inicio: horario.hora_inicio,
                hora_fin: horario.hora_fin,
                jornada_id: Number(horario.jornada_id),
                ambiente_id: horario.ambiente_id ? Number(horario.ambiente_id) : null,
                tipo_actividad_id: horario.tipo_actividad_id ? Number(horario.tipo_actividad_id) : null,
                rap_id: null,
                semana,
              }
              console.log("Enviando horario:", JSON.stringify(horarioPayload))
              try {
                await api.horarios.create(horarioPayload)
                console.log("Horario creado OK para día", dia)
              } catch (horErr: any) {
                todosOk = false
                console.error("Error creando horario día", dia, ":", horErr.message)
                showToast(`Error horario: ${horErr.message}`, "error")
              }
            }
            if (todosOk) horarioCreado = true
          }
        } catch (e: any) {
          console.error("Error general horarios:", e)
        }
      }

      showToast(
        horarioCreado
          ? "Asignación y horario registrados exitosamente"
          : "Asignación registrada" + (horario ? " (horario pendiente — puede agregarlo desde el detalle)" : ""),
        horarioCreado ? "success" : (horario ? "info" : "success")
      )
      setIsCreateModalOpen(false)
      cargarAsignaciones()
    } catch (err: any) {
      showToast(err.message || "Error al registrar asignación", "error")
    }
  }

  const handleProvisional = async (data: any) => {
    try {
      await api.assignments.registrarProvisional(data)
      showToast("Asignación provisional registrada", "success")
      setIsProvisionalModalOpen(false)
      cargarAsignaciones()
    } catch (err: any) {
      showToast(err.message || "Error al registrar provisional", "error")
    }
  }

  const openInstructorDetail = async (asig: Asignacion) => {
    try {
      const res = await api.instructors.getById(asig.instructor_id)
      const inst = res.data
      setSelectedInstructor({
        id: inst.id,
        nombre: inst.nombre || asig.instructor_nombre,
        email: inst.email || "",
        tipo_area: inst.tipo_area || "",
        activo: inst.activo ?? true,
        roles: inst.roles || "Instructor",
      })
      setIsInstructorModalOpen(true)
    } catch {
      // Fallback with minimal data
      setSelectedInstructor({
        id: asig.instructor_id,
        nombre: asig.instructor_nombre,
        email: "",
        tipo_area: "",
        activo: true,
        roles: "Instructor",
      })
      setIsInstructorModalOpen(true)
    }
  }

  const openFichaDetail = async (asig: Asignacion) => {
    try {
      const res = await api.fichas.getById(asig.ficha_id)
      setSelectedFicha(res.data)
    } catch {
      setSelectedFicha({ id: asig.ficha_id, numero_ficha: asig.ficha_numero, programa: "", jornada: asig.jornada, etapa: "", modalidad: "", instructores_count: 0, estado: "", activo: true })
    }
    setIsFichaModalOpen(true)
  }

  const openAmbienteDetail = async (asig: Asignacion) => {
    if (!asig.ambiente) return
    try {
      const res = await api.ambientes.getAll()
      const amb = (res.data || []).find((a: any) => a.nombre === asig.ambiente)
      if (amb) {
        setSelectedAmbiente(amb)
        setIsAmbienteModalOpen(true)
      }
    } catch {
      // silently fail
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

  const handleEditAsignacion = async (data: any) => {
    if (!selectedAsignacion) return
    try {
      await api.assignments.update(selectedAsignacion.id, data)
      showToast("Asignación actualizada exitosamente", "success")
      setIsEditModalOpen(false)
      cargarAsignaciones()
    } catch (err: any) {
      showToast(err.message || "Error al actualizar asignación", "error")
    }
  }

  const handleDesactivar = (asig: Asignacion) => {
    setConfirmDialog({
      isOpen: true,
      title: "Desactivar asignación",
      message: `¿Estás seguro de desactivar la asignación de ${asig.instructor_nombre} en el grupo ${asig.ficha_numero}? Pasará a estado histórico.`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false })
        try {
          await api.assignments.desactivar(asig.id)
          showToast("Asignación desactivada", "success")
          cargarAsignaciones()
        } catch (err: any) {
          showToast(err.message || "Error al desactivar", "error")
        }
      },
    })
  }

  const tabs = [
    { id: "activa", label: "Activas", count: asignaciones.filter(a => a.tipo === "activa").length },
    { id: "provisional", label: "Provisionales", count: asignaciones.filter(a => a.tipo === "provisional").length },
    { id: "historica", label: "Históricas", count: asignaciones.filter(a => a.tipo === "historica").length },
  ]

  if (authLoading || !user) return <PageSkeleton />

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

            <div className="grid grid-cols-2 gap-3 w-full md:flex md:flex-wrap md:w-auto">
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
              onClick={() => exportarAsignacionesPDF(listaFiltrada, activeTab)}
              disabled={listaFiltrada.length === 0}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-40"
            >
              <FileDown className="w-4 h-4" />
              PDF
            </button>
            {puedeEditar && (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : listaPaginada.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Sin asignaciones" description="No se encontraron asignaciones con los filtros seleccionados." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 md:px-6 md:py-4">Instructor</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Grupo</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Competencia</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Ambiente</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Jornada</th>
                    <th className="px-3 py-3 md:px-6 md:py-4 text-center">Líder</th>
                    {puedeEditar && <th className="px-3 py-3 md:px-6 md:py-4 text-center">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listaPaginada.map((asig) => (
                    <tr key={asig.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-3 md:px-6 md:py-4 font-medium text-gray-900">
                        <button
                          onClick={() => openInstructorDetail(asig)}
                          className="text-left hover:text-sena hover:underline transition-colors"
                          title="Ver detalle del instructor"
                        >
                          {asig.instructor_nombre}
                        </button>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-700">
                        <button
                          onClick={() => openFichaDetail(asig)}
                          className="text-left hover:text-sena hover:underline transition-colors"
                          title="Ver detalle del grupo"
                        >
                          {asig.ficha_numero}
                        </button>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">
                        <button
                          onClick={() => router.push("/gestion-competencias")}
                          className="text-left hover:text-sena hover:underline transition-colors"
                          title="Ir a gestión de competencias"
                        >
                          {asig.competencia}
                        </button>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">
                        {asig.ambiente ? (
                          <button
                            onClick={() => openAmbienteDetail(asig)}
                            className="text-left hover:text-sena hover:underline transition-colors"
                            title="Ver agenda del ambiente"
                          >
                            {asig.ambiente}
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">{formatJornada(asig.jornada)}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                        {asig.es_lider && (
                          <Star className="w-5 h-5 text-sena fill-sena mx-auto" />
                        )}
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                        {puedeEditar && asig.tipo !== "historica" ? (
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
                        ) : puedeEditar || rol === "Subdirector" ? (
                          <button
                            onClick={() => openDetailModal(asig)}
                            className="p-1.5 text-gray-400 hover:text-sena hover:bg-sena/10 rounded transition-colors"
                            title="Ver detalle"
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

      <DetailInstructorModal
        isOpen={isInstructorModalOpen}
        onClose={() => setIsInstructorModalOpen(false)}
        instructor={selectedInstructor}
        puedeEditar={puedeEditar}
      />

      <DetailFichaModal
        isOpen={isFichaModalOpen}
        onClose={() => setIsFichaModalOpen(false)}
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

      <VerAgendaAmbienteModal
        isOpen={isAmbienteModalOpen}
        onClose={() => setIsAmbienteModalOpen(false)}
        ambiente={selectedAmbiente}
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
