import { useState, useEffect } from "react"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import CrearUsuarioModal from "@/components/usuarios/CrearUsuarioModal"
import EditarUsuarioModal from "@/components/usuarios/EditarUsuarioModal"
import AsignarProgramasLiderModal from "@/components/usuarios/AsignarProgramasLiderModal"
import { exportarUsuariosPDF } from "@/lib/exportPDF"
import { TableSkeleton, PageSkeleton } from "@/components/ui/Skeleton"
import EmptyState from "@/components/ui/EmptyState"
import {
  Search,
  Plus,
  Pencil,
  Power,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BookOpen,
  Users,
  FileDown,
} from "lucide-react"

type Usuario = {
  id: number
  nombre: string
  email: string
  rol: string
  activo: boolean
  ultimo_acceso?: string
  tipo_documento?: string
  documento?: string
}


export default function UsuariosPage() {
  const { user, loading: authLoading } = useProtectedRoute()
  const { showToast } = useToast()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAsignarProgramasModalOpen, setIsAsignarProgramasModalOpen] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)

  const [search, setSearch] = useState("")
  const [paginaActual, setPaginaActual] = useState(1)
  const porPagina = 10
  const [filtroRol, setFiltroRol] = useState("todos")
  const [filtroEstado, setFiltroEstado] = useState("todos")

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const cargarUsuarios = async () => {
    setLoading(true)
    try {
      const res = await api.users.getAll()
      setUsuarios(res.data)
    } catch (err) {
      console.warn("Error cargando usuarios:", err)
      setUsuarios([])
    } finally {
      setLoading(false)
    }
  }

  const listaFiltrada = usuarios.filter((u) => {
    const texto = search.toLowerCase()
    const coincideBusqueda = u.nombre.toLowerCase().includes(texto) || u.email.toLowerCase().includes(texto) || (u.documento || "").toLowerCase().includes(texto)
    const coincideRol = filtroRol === "todos" || u.rol === filtroRol
    const coincideEstado = filtroEstado === "todos" || (filtroEstado === "activo" ? u.activo : !u.activo)
    return coincideBusqueda && coincideRol && coincideEstado
  })

  const totalPaginas = Math.ceil(listaFiltrada.length / porPagina)
  const listaPaginada = listaFiltrada.slice((paginaActual - 1) * porPagina, paginaActual * porPagina)

  useEffect(() => { setPaginaActual(1) }, [search, filtroRol, filtroEstado])

  const handleCreate = async (data: any) => {
    try {
      await api.users.create(data)
      showToast("Usuario registrado exitosamente", "success")
      setIsCreateModalOpen(false)
      cargarUsuarios()
    } catch (err: any) {
      showToast(err.message || "Error al registrar usuario", "error")
    }
  }

  const handleToggleEstado = async (usuario: Usuario) => {
    try {
      await api.users.toggleEstado(usuario.id)
      showToast(`Usuario ${usuario.activo ? "desactivado" : "activado"}`, "success")
      cargarUsuarios()
    } catch (err: any) {
      showToast(err.message || "Error al cambiar estado", "error")
    }
  }

  const openEditModal = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setIsEditModalOpen(true)
  }

  const openAsignarProgramasModal = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setIsAsignarProgramasModalOpen(true)
  }

  const handleAsignarProgramas = async (liderId: number, programaIds: number[]) => {
    try {
      await api.users.asignarProgramas(liderId, programaIds)
      showToast("Programas asignados exitosamente", "success")
      setIsAsignarProgramasModalOpen(false)
    } catch (err: any) {
      showToast(err.message || "Error al asignar programas", "error")
    }
  }

  const handleEdit = async (data: any) => {
    if (!selectedUsuario) return
    try {
      await api.users.update(selectedUsuario.id, data)
      showToast("Usuario actualizado exitosamente", "success")
      setIsEditModalOpen(false)
      cargarUsuarios()
    } catch (err: any) {
      showToast(err.message || "Error al actualizar usuario", "error")
    }
  }

  if (authLoading || !user) return <PageSkeleton />

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
            <p className="text-gray-500 text-sm">Gestión de cuentas de acceso al sistema</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportarUsuariosPDF(listaFiltrada)}
              disabled={listaFiltrada.length === 0}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-40"
            >
              <FileDown className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-sena hover:bg-sena/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nuevo usuario
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 w-full md:flex md:flex-wrap md:w-auto">
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todos">Rol: Todos</option>
              <option value="Subdirector">Subdirector</option>
              <option value="Coordinadora Academica">Coordinadora Academica</option>
              <option value="Asistente Coordinacion">Asistente Coordinacion</option>
              
              <option value="Instructor">Instructor</option>
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
            <TableSkeleton rows={5} columns={7} />
          ) : listaPaginada.length === 0 ? (
            <EmptyState icon={Users} title="Sin usuarios" description="No se encontraron usuarios con los filtros seleccionados." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 md:px-6 md:py-4">Nombre</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Correo</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Documento</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Rol</th>
                    <th className="px-3 py-3 md:px-6 md:py-4 text-center">Último Acceso</th>
                    <th className="px-3 py-3 md:px-6 md:py-4 text-center">Estado</th>
                    <th className="px-3 py-3 md:px-6 md:py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listaPaginada.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-3 md:px-6 md:py-4 font-medium text-gray-900">{u.nombre}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">{u.email}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">
                        {u.documento ? (
                          <span>
                            <span className="text-xs text-gray-400 uppercase">{u.tipo_documento || "CC"}</span>{" "}
                            {u.documento}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.rol === 'Subdirector' ? 'bg-purple-100 text-purple-800' : 
                          u.rol === 'Coordinadora Academica' || u.rol === 'Asistente Coordinacion' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-center text-gray-500">
                        {u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleDateString("es-CO") : "-"}
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {false && (
                            <button
                              onClick={() => openAsignarProgramasModal(u)}
                              className="p-1.5 text-gray-400 hover:text-sena hover:bg-sena/10 rounded transition-colors"
                              title="Asignar programas"
                            >
                              <BookOpen className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleEstado(u)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title={u.activo ? "Desactivar" : "Activar"}
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

      <CrearUsuarioModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />

      <EditarUsuarioModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        usuario={selectedUsuario}
        onSubmit={handleEdit}
      />

      <AsignarProgramasLiderModal
        isOpen={isAsignarProgramasModalOpen}
        onClose={() => setIsAsignarProgramasModalOpen(false)}
        lider={selectedUsuario ? { id: selectedUsuario.id, nombre: selectedUsuario.nombre } : null}
        onSubmit={handleAsignarProgramas}
      />
    </DashboardLayout>
  )
}
