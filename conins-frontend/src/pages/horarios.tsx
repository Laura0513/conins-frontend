import { useState, useEffect } from "react"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import CrearHorarioModal from "@/components/horarios/CrearHorarioModal"
import EditarHorarioModal from "@/components/horarios/EditarHorarioModal"
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
} from "lucide-react"

type Horario = {
  id: number
  ficha_numero: string
  instructor_nombre: string
  competencia: string
  ambiente: string
  jornada: string
  dias: string[]
  horas: string
  estado: string
  activo: boolean
}

const MOCK_HORARIOS: Horario[] = [
  { id: 1, ficha_numero: "2995403", instructor_nombre: "Carlos Álvarez", competencia: "Bases de datos", ambiente: "Aula 203", jornada: "Mañana", dias: ["Lun", "Mié", "Vie"], horas: "06:00 - 12:00", estado: "Activo", activo: true },
  { id: 2, ficha_numero: "2887341", instructor_nombre: "Andrés Pareja", competencia: "Contabilidad básica", ambiente: "Aula 207", jornada: "Mixta", dias: ["Mar", "Jue"], horas: "10:00 - 16:00", estado: "Activo", activo: true },
  { id: 3, ficha_numero: "3012456", instructor_nombre: "William Ramírez", competencia: "Logística empresarial", ambiente: "Taller T2", jornada: "Noche", dias: ["Lun", "Mar", "Mié", "Jue"], horas: "18:00 - 22:00", estado: "Activo", activo: true },
  { id: 4, ficha_numero: "2995403", instructor_nombre: "Carlos Álvarez", competencia: "Análisis y diseño de software", ambiente: "Aula 204", jornada: "Mañana", dias: ["Mar", "Jue"], horas: "08:00 - 12:00", estado: "Deshabilitado", activo: false },
]

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
  const [filtroFicha, setFiltroFicha] = useState("todas")
  const [filtroInstructor, setFiltroInstructor] = useState("todos")
  const [filtroJornada, setFiltroJornada] = useState("todas")
  const [filtroEstado, setFiltroEstado] = useState("todos")

  useEffect(() => {
    cargarHorarios()
  }, [])

  const cargarHorarios = async () => {
    setLoading(true)
    try {
      const res = await api.horarios.getAll()
      setHorarios(res.data)
    } catch (err) {
      console.warn("Backend no disponible, usando datos mock:", err)
      setHorarios(MOCK_HORARIOS)
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

  const handleCreate = async (data: any) => {
    try {
      // await api.horarios.create(data)
      showToast("Horario registrado exitosamente", "success")
      setIsCreateModalOpen(false)
      cargarHorarios()
    } catch (err) {
      showToast("Error al registrar horario", "error")
    }
  }

  const openEditModal = (horario: Horario) => {
    setSelectedHorario(horario)
    setIsEditModalOpen(true)
  }

  const handleEdit = async (data: any) => {
    if (!selectedHorario) return
    try {
      // await api.horarios.update(selectedHorario.id, data)
      showToast("Horario actualizado exitosamente", "success")
      setIsEditModalOpen(false)
      cargarHorarios()
    } catch (err) {
      showToast("Error al actualizar horario", "error")
    }
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
          // await api.horarios.toggle(horario.id, motivo)
          showToast(`Horario ${horario.activo ? "deshabilitado" : "habilitado"}`, "success")
          cargarHorarios()
        } catch (err) {
          showToast("Error al cambiar estado", "error")
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
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-sena hover:bg-sena/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Registrar horario
          </button>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ficha o instructor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <select
              value={filtroFicha}
              onChange={(e) => setFiltroFicha(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todas">Ficha: Todas</option>
              <option value="2995403">2995403</option>
              <option value="2887341">2887341</option>
              <option value="3012456">3012456</option>
            </select>

            <select
              value={filtroInstructor}
              onChange={(e) => setFiltroInstructor(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todos">Instructor: Todos</option>
              <option value="Carlos Álvarez">Carlos Álvarez</option>
              <option value="Andrés Pareja">Andrés Pareja</option>
              <option value="William Ramírez">William Ramírez</option>
            </select>

            <select
              value={filtroJornada}
              onChange={(e) => setFiltroJornada(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todas">Jornada: Todas</option>
              <option value="Mañana">Mañana</option>
              <option value="Mixta">Mixta</option>
              <option value="Noche">Noche</option>
              <option value="Virtual">Virtual</option>
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todos">Estado: Todos</option>
              <option value="Activo">Activo</option>
              <option value="Deshabilitado">Deshabilitado</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-sena mb-2" />
              <p>Cargando horarios...</p>
            </div>
          ) : listaFiltrada.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No se encontraron horarios con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Ficha</th>
                    <th className="px-6 py-4">Instructor</th>
                    <th className="px-6 py-4">Competencia</th>
                    <th className="px-6 py-4">Ambiente</th>
                    <th className="px-6 py-4">Jornada</th>
                    <th className="px-6 py-4">Días</th>
                    <th className="px-6 py-4">Horas</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listaFiltrada.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{h.ficha_numero}</td>
                      <td className="px-6 py-4 text-gray-700">{h.instructor_nombre}</td>
                      <td className="px-6 py-4 text-gray-500">{h.competencia}</td>
                      <td className="px-6 py-4 text-gray-500">{h.ambiente}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          h.jornada === 'Mañana' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {h.jornada}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {h.dias.map((d) => (
                            <span key={d} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              {d}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{h.horas}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          h.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {h.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(h)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDesactivar(h)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title={h.activo ? "Deshabilitar" : "Habilitar"}
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
              Mostrando {listaFiltrada.length} de {horarios.length}
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
