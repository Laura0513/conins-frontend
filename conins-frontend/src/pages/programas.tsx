import { useState, useEffect } from "react"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  GraduationCap,
  UserCheck,
} from "lucide-react"

type Programa = {
  id: number
  nombre: string
  tipo_linea?: string
  area?: string
  modalidad?: string
  referente_id?: number | null
  referente_nombre?: string | null
}

type Instructor = {
  id: number
  nombre: string
}

export default function ProgramasPage() {
  const { user, loading: authLoading } = useProtectedRoute()
  const { showToast } = useToast()
  const [programas, setProgramas] = useState<Programa[]>([])
  const [instructores, setInstructores] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)

  const [search, setSearch] = useState("")
  const [paginaActual, setPaginaActual] = useState(1)
  const porPagina = 10

  const rol = user?.roles?.[0]?.trim() || ""
  const puedeEditar = !["Instructor", "Subdirector"].includes(rol)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [progRes, instRes] = await Promise.all([
        api.programs.getAll(),
        api.instructors.getAll(),
      ])
      setProgramas(progRes.data || [])
      setInstructores(instRes.data || [])
    } catch (err) {
      console.warn("Error cargando datos:", err)
      setProgramas([])
    } finally {
      setLoading(false)
    }
  }

  const handleReferenteChange = async (programaId: number, instructorId: string) => {
    const value = instructorId ? Number(instructorId) : null
    setSavingId(programaId)
    try {
      await api.programs.setReferente(programaId, value)
      setProgramas((prev) =>
        prev.map((p) =>
          p.id === programaId
            ? {
                ...p,
                referente_id: value,
                referente_nombre: value
                  ? instructores.find((i) => i.id === value)?.nombre || null
                  : null,
              }
            : p
        )
      )
      showToast("Referente actualizado exitosamente", "success")
    } catch (err: any) {
      showToast(err.message || "Error al actualizar referente", "error")
    } finally {
      setSavingId(null)
    }
  }

  const listaFiltrada = programas.filter((p) => {
    const texto = search.toLowerCase()
    return (
      p.nombre.toLowerCase().includes(texto) ||
      (p.tipo_linea || "").toLowerCase().includes(texto) ||
      (p.area || "").toLowerCase().includes(texto)
    )
  })

  const totalPaginas = Math.ceil(listaFiltrada.length / porPagina)
  const listaPaginada = listaFiltrada.slice(
    (paginaActual - 1) * porPagina,
    paginaActual * porPagina
  )

  useEffect(() => {
    setPaginaActual(1)
  }, [search])

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programas de formación</h1>
          <p className="text-gray-500 text-sm">
            Catálogo de programas del CDMC y sus referentes
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, línea o área..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-sena mb-2" />
              <p>Cargando programas...</p>
            </div>
          ) : listaPaginada.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <GraduationCap className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No se encontraron programas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 md:px-6 md:py-4">Programa</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Línea</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Modalidad</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4" />
                        Referente
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listaPaginada.map((prog) => (
                    <tr key={prog.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-3 md:px-6 md:py-4">
                        <p className="font-medium text-gray-900">{prog.nombre}</p>
                        {prog.area && (
                          <p className="text-xs text-gray-400 mt-0.5">{prog.area}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">
                        {prog.tipo_linea || "—"}
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">
                        {prog.modalidad || "—"}
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4">
                        {puedeEditar ? (
                          <div className="relative">
                            <select
                              value={prog.referente_id || ""}
                              onChange={(e) =>
                                handleReferenteChange(prog.id, e.target.value)
                              }
                              disabled={savingId === prog.id}
                              className="w-full max-w-[220px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white disabled:opacity-50"
                            >
                              <option value="">Sin referente</option>
                              {instructores.map((inst) => (
                                <option key={inst.id} value={inst.id}>
                                  {inst.nombre}
                                </option>
                              ))}
                            </select>
                            {savingId === prog.id && (
                              <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-sena" />
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-700">
                            {prog.referente_nombre || "Sin referente"}
                          </span>
                        )}
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
    </DashboardLayout>
  )
}
