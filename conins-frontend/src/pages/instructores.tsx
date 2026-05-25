import { useState, useEffect } from "react"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"
import {
  Search,
  Plus,
  Eye,
  Pencil,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react"

type Instructor = {
  id: number
  nombre: string
  email: string
  tipo_contrato: string
  tipo_area: string
  activo: boolean
  roles: string
  horas_semana?: number
}

export default function InstructoresPage() {
  const { showToast } = useToast()
  const [instructores, setInstructores] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)

  // Estados para Modal de Crear Instructor
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    tipo_contrato: "contratista",
    tipo_area: "tecnica",
  })

  // Estados para Modal de Novedad
  const [isNovedadModalOpen, setIsNovedadModalOpen] = useState(false)
  const [selectedInstructorId, setSelectedInstructorId] = useState<number | null>(null)
  const [novedadData, setNovedadData] = useState({
    tipo: "licencia",
    fecha_inicio: "",
    fecha_regreso: "",
    observacion: "",
  })

  // Filtros
  const [search, setSearch] = useState("")
  const [filtroContrato, setFiltroContrato] = useState("todos")
  const [filtroArea, setFiltroArea] = useState("todas")

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.instructors.create(formData)
      showToast("Instructor registrado exitosamente", "success")
      setIsCreateModalOpen(false)
      setFormData({ nombre: "", email: "", tipo_contrato: "contratista", tipo_area: "tecnica" })
      cargarInstructores()
    } catch (err) {
      showToast("Error al crear instructor. Verifica el backend.", "error")
    } finally {
      setSubmitting(false)
    }
  }

  const handleNovedadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInstructorId) return

    setSubmitting(true)
    try {
      // Aquí irá la llamada a la API cuando Jair tenga el endpoint listo
      // await api.instructors.addNovedad(selectedInstructorId, novedadData)
      showToast("Novedad registrada exitosamente", "success")
      setIsNovedadModalOpen(false)
      setNovedadData({ tipo: "licencia", fecha_inicio: "", fecha_regreso: "", observacion: "" })
    } catch (err) {
      showToast("Error al registrar novedad.", "error")
    } finally {
      setSubmitting(false)
    }
  }

  const openNovedadModal = (instructorId: number) => {
    setSelectedInstructorId(instructorId)
    setIsNovedadModalOpen(true)
  }

  // Lógica de filtrado
  const listaFiltrada = instructores.filter((inst) => {
    const texto = search.toLowerCase()
    const coincideBusqueda = inst.nombre.toLowerCase().includes(texto) || inst.email.toLowerCase().includes(texto)
    const coincideContrato = filtroContrato === "todos" || inst.tipo_contrato === filtroContrato
    const coincideArea = filtroArea === "todas" || inst.tipo_area === filtroArea
    return coincideBusqueda && coincideContrato && coincideArea
  })

  // Función auxiliar para simular horas
  const getMockHoras = (id: number): number => {
    const horas = [22, 30, 40, 45, 18, 35, 28]
    return horas[id % horas.length]
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Instructores</h1>
            <p className="text-gray-500 text-sm">Gestión de instructores del CDMC</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-sena hover:bg-sena/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Registrar instructor
          </button>
        </div>

        {/* Barra de Filtros */}
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

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <select
              value={filtroContrato}
              onChange={(e) => setFiltroContrato(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todos">Contrato: Todos</option>
              <option value="de_planta">De Planta</option>
              <option value="contratista">Contratista</option>
            </select>

            <select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="todas">Área: Todas</option>
              <option value="tecnica">Técnica</option>
              <option value="transversal">Transversal</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-sena mb-2" />
              <p>Cargando instructores...</p>
            </div>
          ) : listaFiltrada.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No se encontraron instructores con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Nombre</th>
                    <th className="px-6 py-4">Correo</th>
                    <th className="px-6 py-4">Contrato</th>
                    <th className="px-6 py-4">Área</th>
                    <th className="px-6 py-4">Horas/sem</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listaFiltrada.map((inst) => (
                    <tr key={inst.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{inst.nombre}</td>
                      <td className="px-6 py-4 text-gray-500">{inst.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          inst.tipo_contrato === 'de_planta' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {inst.tipo_contrato === 'de_planta' ? 'Planta' : 'Contratista'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 capitalize">{inst.tipo_area}</td>
                      <td className="px-6 py-4">
                        {(() => {
                          const horas = inst.horas_semana ?? getMockHoras(inst.id)
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
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          inst.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {inst.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-1.5 text-gray-400 hover:text-sena hover:bg-sena/10 rounded transition-colors" title="Ver detalle">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar">
                            <Pencil className="w-4 h-4" />
                          </button>
                          {/* Botón de Novedad */}
                          <button
                            onClick={() => openNovedadModal(inst.id)}
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                            title="Registrar novedad"
                          >
                            <CalendarX className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación Visual */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-500">
              Mostrando {listaFiltrada.length} de {instructores.length}
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

      {/* Modal de Registro de Instructor */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Registrar instructor</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                  name="nombre"
                  required
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="correo@sena.edu.co"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de contrato</label>
                  <select
                    name="tipo_contrato"
                    value={formData.tipo_contrato}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                  >
                    <option value="contratista">Contratista</option>
                    <option value="de_planta">De Planta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de área</label>
                  <select
                    name="tipo_area"
                    value={formData.tipo_area}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                  >
                    <option value="tecnica">Técnica</option>
                    <option value="transversal">Transversal</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2.5 bg-sena hover:bg-sena/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Registrar Novedad */}
      {isNovedadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Registrar novedad</h2>
              <button onClick={() => setIsNovedadModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleNovedadSubmit} className="p-6 space-y-5">
              {/* Alerta informativa */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  El instructor quedará excluido de asignaciones mientras la novedad esté vigente.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={novedadData.tipo}
                  onChange={(e) => setNovedadData({...novedadData, tipo: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
                >
                  <option value="licencia">Licencia</option>
                  <option value="incapacidad">Incapacidad</option>
                  <option value="comision">Comisión</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                  <input
                    type="date"
                    required
                    value={novedadData.fecha_inicio}
                    onChange={(e) => setNovedadData({...novedadData, fecha_inicio: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha est. de regreso</label>
                  <input
                    type="date"
                    required
                    value={novedadData.fecha_regreso}
                    onChange={(e) => setNovedadData({...novedadData, fecha_regreso: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
                <textarea
                  rows={3}
                  value={novedadData.observacion}
                  onChange={(e) => setNovedadData({...novedadData, observacion: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 resize-none"
                  placeholder="Motivo o detalles adicionales..."
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNovedadModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2.5 bg-sena hover:bg-sena/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Registrar novedad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  )
}
