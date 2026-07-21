import { useState, useEffect } from "react"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import { Loader2 } from "lucide-react"

type Competencia = {
  id: number
  nombre: string
  programa: string
  ficha_numero: string
  ambiente: string
  estado: "Activa" | "Inactiva"
}

export default function CompetenciasPage() {
  const { user, loading: authLoading } = useProtectedRoute()
  const [competencias, setCompetencias] = useState<Competencia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarCompetencias()
  }, [])

  const cargarCompetencias = async () => {
    setLoading(true)
    try {
      const res = await api.instructors.getCompetencias(user?.id || 0)
      setCompetencias(res.data || [])
    } catch (err) {
      console.warn("Error cargando competencias:", err)
      setCompetencias([])
    } finally {
      setLoading(false)
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Competencias</h1>
          <p className="text-gray-500 text-sm">Competencias habilitadas para tu perfil</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-sena mb-2" />
              <p>Cargando competencias...</p>
            </div>
          ) : competencias.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No tienes competencias registradas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 md:px-6 md:py-4">Competencia</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Programa</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Grupo</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Ambiente</th>
                    <th className="px-3 py-3 md:px-6 md:py-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {competencias.map((comp) => (
                    <tr key={comp.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-3 md:px-6 md:py-4 font-medium text-gray-900">{comp.nombre}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">{comp.programa}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-700">{comp.ficha_numero}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">{comp.ambiente}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          comp.estado === "Activa" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          {comp.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-500">
              Total: {competencias.length} competencias
            </span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
