import { useState, useEffect } from "react"
import DashboardLayout from "@/layouts/DashboardLayout"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import { Loader2, Award } from "lucide-react"

type Competencia = {
  id: number
  nombre: string
  programa: string
  estado: "Activa" | "Inactiva"
}

const MOCK_COMPETENCIAS: Competencia[] = [
  { id: 1, nombre: "Bases de datos relacionales", programa: "ADSO", estado: "Activa" },
  { id: 2, nombre: "Análisis y diseño de software", programa: "ADSO", estado: "Activa" },
  { id: 3, nombre: "Desarrollo de aplicaciones web", programa: "ADSO", estado: "Activa" },
  { id: 4, nombre: "Gestión de proyectos de software", programa: "ADSO", estado: "Inactiva" },
]

export default function CompetenciasPage() {
  const { user, loading: authLoading } = useProtectedRoute()
  const [competencias, setCompetencias] = useState<Competencia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setCompetencias(MOCK_COMPETENCIAS)
      setLoading(false)
    }, 500)
  }, [])

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
            <div className="divide-y divide-gray-100">
              {competencias.map((comp) => (
                <div key={comp.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-sena/10 flex items-center justify-center">
                      <Award className="w-5 h-5 text-sena" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{comp.nombre}</p>
                      <p className="text-sm text-gray-500">{comp.programa}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    comp.estado === "Activa" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {comp.estado}
                  </span>
                </div>
              ))}
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
