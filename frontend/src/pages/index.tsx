import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/AuthContext"
import { Loader2 } from "lucide-react"

// Datos de prueba (mock data) - TEMPORAL hasta que el backend tenga los endpoints
const cargaHorariaMock = [
  { instructor: "Carlos Álvarez", horas: 45, limite: 40, estado: "Excede límite", tipo: "danger" },
  { instructor: "Andrés Pareja", horas: 22, limite: 32, estado: "En rango", tipo: "success" },
  { instructor: "William Ramírez", horas: 40, limite: 40, estado: "En rango", tipo: "success" },
  { instructor: "Paula Isaza", horas: 30, limite: 40, estado: "En rango", tipo: "success" },
]

const alertasMock = [
  { mensaje: "Carlos Álvarez tiene 45h — supera el límite de 40h semanales", tipo: "CARGA_HORARIA", tiempo: "Hace 2 h" },
  { mensaje: "Aula 203 ocupada en jornada mañana por ficha 2995403", tipo: "AMBIENTE_OCUPADO", tiempo: "Hace 4 h" },
  { mensaje: "Conflicto de horario detectado para William Ramírez el martes 10:00", tipo: "CONFLICTO", tiempo: "Ayer" },
]

function getProgressColor(horas: number, limite: number) {
  if (horas > limite) return "bg-red-500"
  if (horas >= limite * 0.85) return "bg-yellow-500"
  return "bg-sena"
}

function getStatusBadgeColor(tipo: string) {
  switch (tipo) {
    case "danger": return "bg-red-100 text-red-700"
    case "warning": return "bg-yellow-100 text-yellow-700"
    default: return "bg-green-100 text-green-700"
  }
}

function getAlertBadgeColor(tipo: string) {
  switch (tipo) {
    case "CARGA_HORARIA": return "bg-yellow-100 text-yellow-800"
    case "AMBIENTE_OCUPADO": return "bg-orange-100 text-orange-800"
    case "CONFLICTO": return "bg-red-100 text-red-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [instructorCount, setInstructorCount] = useState(0)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      api.instructors.getAll()
        .then((res) => {
          setInstructorCount(res.data.length)
        })
        .catch((err) => {
          console.error("Error cargando instructores:", err)
        })
        .finally(() => setDataLoading(false))
    }
  }, [user])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-sena" />
          <p>Verificando sesión...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-500 mb-8">Resumen general del CDMC</p>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          {/* Tarjeta REAL de Instructores */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Instructores activos</p>
            <p className="text-3xl font-bold text-gray-900">
              {dataLoading ? "..." : instructorCount}
            </p>
          </div>

          {/* Tarjetas con datos de prueba (Backend pendiente) */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Fichas activas</p>
            <p className="text-3xl font-bold text-gray-900">4</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Asignaciones vigentes</p>
            <p className="text-3xl font-bold text-gray-900">3</p>
          </div>
          <div className="bg-white p-6 rounded-xl border-l-4 border-yellow-400">
            <p className="text-sm text-gray-500 mb-1">Alertas pendientes</p>
            <p className="text-3xl font-bold text-gray-900">2</p>
          </div>
        </div>

        {/* Contenido inferior: Tabla + Alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Tabla de carga horaria (Datos de prueba) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Carga horaria semanal</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="text-left py-3 font-medium">Instructor</th>
                    <th className="text-center py-3 font-medium">Horas</th>
                    <th className="text-center py-3 font-medium">Límite</th>
                    <th className="text-center py-3 font-medium">Progreso</th>
                    <th className="text-center py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cargaHorariaMock.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 font-medium text-gray-900">{row.instructor}</td>
                      <td className="py-3 text-center text-gray-700">{row.horas}</td>
                      <td className="py-3 text-center text-gray-500">{row.limite}</td>
                      <td className="py-3">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${getProgressColor(row.horas, row.limite)}`}
                            style={{ width: `${Math.min((row.horas / row.limite) * 100, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(row.tipo)}`}>
                          {row.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alertas recientes (Datos de prueba) */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Alertas recientes</h2>
              <button onClick={() => router.push("/alertas")} className="text-sena text-sm font-medium hover:underline">Ver todas</button>
            </div>
            <div className="space-y-4">
              {alertasMock.map((alerta, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-gray-700 flex-1">{alerta.mensaje}</p>
                    <span className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${getAlertBadgeColor(alerta.tipo)}`}>
                      {alerta.tipo}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{alerta.tiempo}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}
