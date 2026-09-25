import { useState, useEffect } from "react"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import { TableSkeleton, PageSkeleton } from "@/components/ui/Skeleton"
import EmptyState from "@/components/ui/EmptyState"
import { Layers } from "lucide-react"

type CompetenciaView = {
  id: string
  competencia: string
  programa: string
  ficha_numero: string
  ambiente: string
  jornada: string
}

export default function CompetenciasPage() {
  const { user, loading: authLoading } = useProtectedRoute()
  const [competencias, setCompetencias] = useState<CompetenciaView[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarCompetencias()
  }, [])

  const cargarCompetencias = async () => {
    setLoading(true)
    try {
      // Derivar competencias desde las asignaciones del instructor
      // (el backend filtra por el usuario autenticado via token)
      const res = await api.assignments.getAll()
      const asignaciones = res.data || []

      // Extraer competencias únicas de las asignaciones
      const seen = new Set<string>()
      const comps: CompetenciaView[] = []

      for (const asig of asignaciones) {
        const key = `${asig.competencia_id || asig.competencia}-${asig.ficha_numero}`
        if (!seen.has(key)) {
          seen.add(key)
          comps.push({
            id: key,
            competencia: asig.competencia || "—",
            programa: asig.programa || "—",
            ficha_numero: asig.ficha_numero || "—",
            ambiente: asig.ambiente || "—",
            jornada: asig.jornada || "—",
          })
        }
      }

      setCompetencias(comps)
    } catch (err) {
      console.warn("Error cargando competencias:", err)
      setCompetencias([])
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !user) return <PageSkeleton />

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Competencias</h1>
          <p className="text-gray-500 text-sm">Competencias asignadas a tu perfil</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : competencias.length === 0 ? (
            <EmptyState icon={Layers} title="Sin competencias" description="No tienes competencias asignadas actualmente." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 md:px-6 md:py-4">Competencia</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Programa</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Grupo</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Ambiente</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Jornada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {competencias.map((comp) => (
                    <tr key={comp.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-3 md:px-6 md:py-4 font-medium text-gray-900">{comp.competencia}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">{comp.programa}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-700">{comp.ficha_numero}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">{comp.ambiente}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500 capitalize">{comp.jornada}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-500">
              Total: {competencias.length} competencia{competencias.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
