import { useState, useEffect } from "react"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import { formatJornada } from "@/lib/terminology"
import { exportarHorariosPDF } from "@/lib/exportPDF"
import CrearHorarioModal from "@/components/horarios/CrearHorarioModal"
import CrearBloqueHorarioModal from "@/components/horarios/CrearBloqueHorarioModal"
import EditarHorarioModal from "@/components/horarios/EditarHorarioModal"
import GrillaHorarios from "@/components/horarios/GrillaHorarios"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import {
  Search,
  Plus,
  Pencil,
  Power,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  FileDown,
  LayoutGrid,
  List,
} from "lucide-react"

type Horario = {
  id: number
  ficha_numero: string
  instructor_nombre: string
  competencia: string
  ambiente: string
  jornada: string
  tipo_actividad: string | null
  dias: string[]
  horas: string
  estado: string
  activo: boolean
  asignacion_id?: number | null
  competencia_id?: number | null
  ambiente_id?: number | null
  tipo_actividad_id?: number | null
  rap_id?: number | null
  rap_codigo?: string | null
  rap_descripcion?: string | null
}


export default function HorariosPage() {
  const { user, loading: authLoading } = useProtectedRoute()
  const { showToast } = useToast()
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedHorario, setSelectedHorario] = useState<Horario | null>(null)

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: (motivo?: string) => void
    showMotivo?: boolean
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {}, showMotivo: false })

  const [search, setSearch] = useState("")
  const [paginaActual, setPaginaActual] = useState(1)
  const porPagina = 10
  const [filtroFicha, setFiltroFicha] = useState("todas")
  const [filtroInstructor, setFiltroInstructor] = useState("todos")
  const [filtroJornada, setFiltroJornada] = useState("todas")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [vistaGrilla, setVistaGrilla] = useState(false)

  const rol = user?.roles?.[0]?.trim() || ""
  const puedeEditar = !["Instructor", "Subdirector"].includes(rol)

  useEffect(() => {
    cargarHorarios()
  }, [])

  const cargarHorarios = async () => {
    setLoading(true)
    try {
      const res = await api.horarios.getAll()
      setHorarios(res.data || [])
    } catch (err) {
      console.warn("Error cargando horarios:", err)
      setHorarios([])
    } finally {
      setLoading(false)
    }
  }

  const listaFiltrada = horarios.filter((h) => {
    const texto = search.toLowerCase()
    const coincideBusqueda =
      h.ficha_numero.toLowerCase().includes(texto) ||
      h.instructor_nombre.toLowerCase().includes(texto)
    
    const coincideFicha = filtroFicha === "todas" || h.ficha_numero === filtroFicha
    const coincideInstructor = filtroInstructor === "todos" || h.instructor_nombre === filtroInstructor
    const coincideJornada = filtroJornada === "todas" || h.jornada === filtroJornada
    const coincideEstado = filtroEstado === "todos" || h.estado === filtroEstado
    
    return coincideBusqueda && coincideFicha && coincideInstructor && coincideJornada && coincideEstado
  })

  const totalPaginas = Math.ceil(listaFiltrada.length / porPagina)
  const listaPaginada = listaFiltrada.slice((paginaActual - 1) * porPagina, paginaActual * porPagina)

  useEffect(() => { setPaginaActual(1) }, [search, filtroFicha, filtroInstructor, filtroJornada, filtroEstado])

  const handleCreate = async (data: any) => {
    try {
      const now = new Date()
      const day = now.getDay()
      const diff = day === 0 ? -6 : 1 - day
      const lunes = new Date(now)
      lunes.setDate(now.getDate() + diff)
      const semana = lunes.toISOString().split('T')[0]

      const dias = data.dias || [data.dia_semana] // Fallback for single day
      
      for (const dia of dias) {
        const payload = {
          ficha_id: data.ficha_id,
          instructor_id: data.instructor_id,
          competencia_id: data.competencia_id,
          dia_semana: Number(dia),
          hora_inicio: data.hora_inicio,
          hora_fin: data.hora_fin,
          jornada_id: data.jornada_id,
          ambiente_id: data.ambiente_id,
          tipo_actividad_id: data.tipo_actividad_id ?? null,
          semana,
        }
        await api.horarios.create(payload)
      }
      
      showToast("Horario registrado exitosamente", "success")
      setIsCreateModalOpen(false)
      cargarHorarios()
    } catch (err: any) {
      showToast(err.message || "Error al registrar horario", "error")
    }
  }
  const openEditModal = (horario: Horario) => {
    setSelectedHorario(horario)
    setIsEditModalOpen(true)
  }

  const handleEdit = async (data: any) => {
    if (!selectedHorario) return
    try {
      const res = await api.horarios.update(selectedHorario.id, data)
      
      if (res.alertas && res.alertas.length > 0) {
        const alertMessage = res.alertas.join(", ")
        showToast(`Horario actualizado con alertas: ${alertMessage}`, "info")
      } else {
        showToast("Horario actualizado exitosamente", "success")
      }
      
      setIsEditModalOpen(false)
      cargarHorarios()
    } catch (err) {
      showToast("Error al actualizar horario", "error")
    }
  }

  const handleAprobar = async (horario: Horario) => {
    setConfirmDialog({
      isOpen: true,
      title: "Aprobar horario",
      message: `¿Estas seguro de aprobar el horario de ${horario.instructor_nombre}? Quedará activo oficialmente.`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false })
        try {
          await api.horarios.aprobar(horario.id)
          showToast("Horario aprobado exitosamente", "success")
          cargarHorarios()
        } catch (err: any) {
          showToast(err.message || "Error al aprobar horario", "error")
        }
      },
    })
  }

  const handleRechazar = (horario: Horario) => {
    setConfirmDialog({
      isOpen: true,
      title: "Rechazar horario",
      message: `¿Estas seguro de rechazar el horario de ${horario.instructor_nombre}?`,
      showMotivo: true,
      onConfirm: async (motivo?: string) => {
        setConfirmDialog({ ...confirmDialog, isOpen: false })
        try {
          await api.horarios.rechazar(horario.id, motivo || "Sin motivo especificado")
          showToast("Horario rechazado", "success")
          cargarHorarios()
        } catch (err: any) {
          showToast(err.message || "Error al rechazar horario", "error")
        }
      },
    })
  }

  const handleDesactivar = (horario: Horario) => {
    setConfirmDialog({
      isOpen: true,
      title: horario.activo ? "¿Deshabilitar este horario?" : "¿Habilitar este horario?",
      message: horario.activo ? "El registro histórico se conservará." : "Se restaurará el horario activo.",
      showMotivo: horario.activo,
      onConfirm: async (motivo?: string) => {
        setConfirmDialog({ ...confirmDialog, isOpen: false })
        try {
          await api.horarios.toggleActivo(horario.id, motivo)
          showToast(`Horario ${horario.activo ? "deshabilitado" : "habilitado"}`, "success")
          cargarHorarios()
        } catch (err: any) {
          showToast(err.message || "Error al cambiar estado", "error")
        }
      },
    })
  }

  const handleSuspender = (horario: Horario) => {
    setConfirmDialog({
      isOpen: true,
      title: "Suspender horario",
      message: `¿Estas seguro de suspender el horario de ${horario.instructor_nombre}? Se registrara la trazabilidad del cambio.`,
      showMotivo: true,
      onConfirm: async (motivo?: string) => {
        setConfirmDialog({ ...confirmDialog, isOpen: false })
        try {
          await api.horarios.suspender(horario.id, motivo || "Sin motivo especificado")
          showToast("Horario suspendido exitosamente", "success")
          cargarHorarios()
        } catch (err: any) {
          showToast(err.message || "Error al suspender horario", "error")
        }
      },
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
            <h1 className="text-2xl font-bold text-gray-900">Horarios</h1>
            <p className="text-gray-500 text-sm">Listado de horarios registrados del CDMC</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setVistaGrilla(!vistaGrilla)}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              {vistaGrilla ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
              {vistaGrilla ? "Ver tabla" : "Ver grilla"}
            </button>
            <button
              onClick={() => exportarHorariosPDF(listaFiltrada)}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <FileDown className="w-4 h-4" />
              Exportar PDF
            </button>
            {puedeEditar && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-sena hover:bg-sena/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Registrar horario
              </button>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por grupo o instructor..."
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
              <option value="todas">Grupo: Todos</option>
              {[...new Set(horarios.map((h) => h.ficha_numero))].sort().map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

            <select
              value={filtroInstructor}
              onChange={(e) => setFiltroInstructor(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todos">Instructor: Todos</option>
              {[...new Set(horarios.map((h) => h.instructor_nombre))].sort().map((i) => (
                <option key={i} value={i}>{i}</option>
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
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todos">Estado: Todos</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>
        </div>

        {vistaGrilla ? (
          <GrillaHorarios horarios={listaFiltrada} />
        ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-sena mb-2" />
              <p>Cargando horarios...</p>
            </div>
          ) : listaPaginada.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No se encontraron horarios con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 md:px-6 md:py-4">Grupo</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Instructor</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Competencia</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Ambiente</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Jornada</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Tipo actividad</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Días</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Horas</th>
                    <th className="px-3 py-3 md:px-6 md:py-4 text-center">Estado</th>
                    {puedeEditar && <th className="px-3 py-3 md:px-6 md:py-4 text-center">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listaPaginada.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-3 md:px-6 md:py-4 font-medium text-gray-900">{h.ficha_numero}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-700">{h.instructor_nombre}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">{h.competencia}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">{h.ambiente}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          formatJornada(h.jornada) === 'Mañana' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {formatJornada(h.jornada)}
                        </span>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">
                        {h.tipo_actividad || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4">
                        <div className="flex flex-wrap gap-1">
                          {h.dias.map((d) => (
                            <span key={d} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              {d}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-700 whitespace-nowrap">{h.horas}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          h.estado === 'Aprobado' ? 'bg-green-100 text-green-800' :
                          h.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {h.estado === 'Pendiente' && <Clock className="w-3 h-3 mr-1" />}
                          {h.estado}
                        </span>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                        {puedeEditar ? (
                          <div className="flex items-center justify-center gap-2">
                            {h.estado === 'Pendiente' ? (
                              <>
                                <button
                                  onClick={() => handleAprobar(h)}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                  title="Aprobar"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRechazar(h)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Rechazar"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => openEditModal(h)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleSuspender(h)}
                                  className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                  title="Suspender"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDesactivar(h)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title={h.activo ? "Deshabilitar" : "Habilitar"}
                                >
                                  <Power className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
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
        )}
      </div>

      <CrearHorarioModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />

      <EditarHorarioModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        horario={selectedHorario}
        onSubmit={handleEdit}
      />

      {confirmDialog.isOpen && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          showMotivo={confirmDialog.showMotivo}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        />
      )}

    </DashboardLayout>
  )
}
