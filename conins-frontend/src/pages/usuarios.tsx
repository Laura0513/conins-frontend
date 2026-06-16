import { useState, useEffect } from "react"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import CrearUsuarioModal from "@/components/usuarios/CrearUsuarioModal"
import {
  Search,
  Plus,
  Pencil,
  Power,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react"

type Usuario = {
  id: number
  nombre: string
  email: string
  rol: string
  activo: boolean
  ultimo_acceso?: string
}

const MOCK_USUARIOS: Usuario[] = [
  { id: 1, nombre: "Dyron Javier Ramirez Osorio", email: "djramirez@sena.edu.co", rol: "Subdirector", activo: true, ultimo_acceso: "2026-06-09" },
  { id: 2, nombre: "Rocio del Pilar Medina Rojas", email: "rpmedina@sena.edu.co", rol: "Coordinador", activo: true, ultimo_acceso: "2026-06-08" },
  { id: 3, nombre: "Leidy Johana Ruiz Cortes", email: "ljruizc@sena.edu.co", rol: "Coordinador", activo: true, ultimo_acceso: "2026-06-09" },
  { id: 4, nombre: "Paul Ernesto Tamayo Caviedes", email: "ptamayo@sena.edu.co", rol: "Coordinador", activo: false, ultimo_acceso: "2026-05-20" },
]

export default function UsuariosPage() {
  const { user, loading: authLoading } = useProtectedRoute()
  const { showToast } = useToast()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const [search, setSearch] = useState("")
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
      console.warn("Backend no disponible, usando datos mock:", err)
      setUsuarios(MOCK_USUARIOS)
    } finally {
      setLoading(false)
    }
  }

  const listaFiltrada = usuarios.filter((u) => {
    const texto = search.toLowerCase()
    const coincideBusqueda = u.nombre.toLowerCase().includes(texto) || u.email.toLowerCase().includes(texto)
    const coincideRol = filtroRol === "todos" || u.rol === filtroRol
    const coincideEstado = filtroEstado === "todos" || (filtroEstado === "activo" ? u.activo : !u.activo)
    return coincideBusqueda && coincideRol && coincideEstado
  })

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
            <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
            <p className="text-gray-500 text-sm">Gestión de cuentas de acceso al sistema</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-sena hover:bg-sena/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo usuario
          </button>
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
              <option value="Coordinador">Coordinador</option>
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
            <div className="p-12 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-sena mb-2" />
              <p>Cargando usuarios...</p>
            </div>
          ) : listaFiltrada.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No se encontraron usuarios con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 md:px-6 md:py-4">Nombre</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Correo</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Rol</th>
                    <th className="px-3 py-3 md:px-6 md:py-4 text-center">Último Acceso</th>
                    <th className="px-3 py-3 md:px-6 md:py-4 text-center">Estado</th>
                    <th className="px-3 py-3 md:px-6 md:py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listaFiltrada.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-3 md:px-6 md:py-4 font-medium text-gray-900">{u.nombre}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">{u.email}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.rol === 'Subdirector' ? 'bg-purple-100 text-purple-800' : 
                          u.rol === 'Coordinador' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
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
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
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
              Mostrando {listaFiltrada.length} de {usuarios.length}
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

      <CrearUsuarioModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />
    </DashboardLayout>
  )
}
