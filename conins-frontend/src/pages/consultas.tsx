import { useState, useEffect } from "react"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import { useToast } from "@/lib/ToastContext"
import {
  Search,
  FileDown,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Building2,
  Calendar,
} from "lucide-react"

// --- Types ---
type CargaHoraria = {
  instructor_id: number
  instructor_nombre: string
  total_horas: number
  fichas_count: number
  competencias_count: number
  estado: "Normal" | "Sobrecarga"
}

type HorarioFicha = {
  ficha_numero: string
  programa: string
  lunes: string
  martes: string
  miercoles: string
  jueves: string
  viernes: string
  sabado: string
}

type OcupacionAmbiente = {
  ambiente_nombre: string
  tipo: string
  capacidad: number
  horas_ocupadas: number
  horas_totales: number
  porcentaje: number
}

// --- Mock Data ---
const MOCK_CARGA: CargaHoraria[] = [
  { instructor_id: 1, instructor_nombre: "Carlos Álvarez", total_horas: 45, fichas_count: 3, competencias_count: 5, estado: "Sobrecarga" },
  { instructor_id: 2, instructor_nombre: "Andrés Pareja", total_horas: 38, fichas_count: 2, competencias_count: 4, estado: "Normal" },
  { instructor_id: 3, instructor_nombre: "William Ramírez", total_horas: 40, fichas_count: 4, competencias_count: 6, estado: "Normal" },
  { instructor_id: 4, instructor_nombre: "María López", total_horas: 20, fichas_count: 1, competencias_count: 2, estado: "Normal" },
]

const MOCK_HORARIOS_FICHA: HorarioFicha[] = [
  { ficha_numero: "2995403", programa: "ADSO", lunes: "06:00 - 12:00", martes: "14:00 - 18:00", miercoles: "06:00 - 12:00", jueves: "14:00 - 18:00", viernes: "06:00 - 12:00", sabado: "-" },
  { ficha_numero: "2887341", programa: "Contabilidad", lunes: "10:00 - 14:00", martes: "-", miercoles: "10:00 - 14:00", jueves: "-", viernes: "10:00 - 14:00", sabado: "-" },
]

const MOCK_OCUPACION: OcupacionAmbiente[] = [
  { ambiente_nombre: "Aula 203", tipo: "Aula", capacidad: 30, horas_ocupadas: 35, horas_totales: 40, porcentaje: 87 },
  { ambiente_nombre: "Aula 204", tipo: "Aula", capacidad: 30, horas_ocupadas: 20, horas_totales: 40, porcentaje: 50 },
  { ambiente_nombre: "Taller T1", tipo: "Taller", capacidad: 25, horas_ocupadas: 38, horas_totales: 40, porcentaje: 95 },
  { ambiente_nombre: "Lab. Redes", tipo: "Laboratorio", capacidad: 20, horas_ocupadas: 10, horas_totales: 40, porcentaje: 25 },
]

// --- Component ---
export default function ConsultasPage() {
  const { user, loading: authLoading } = useProtectedRoute()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<"carga" | "ficha" | "ocupacion">("carga")
  
  // Data states
  const [carga, setCarga] = useState<CargaHoraria[]>([])
  const [horariosFicha, setHorariosFicha] = useState<HorarioFicha[]>([])
  const [ocupacion, setOcupacion] = useState<OcupacionAmbiente[]>([])
  
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroFicha, setFiltroFicha] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Simular carga de datos
      setTimeout(() => {
        setCarga(MOCK_CARGA)
        setHorariosFicha(MOCK_HORARIOS_FICHA)
        setOcupacion(MOCK_OCUPACION)
        setLoading(false)
      }, 500)
      
      // En producción:
      // const [resCarga, resHorarios, resOcupacion] = await Promise.all([
      //   api.consultas.getCargaHoraria(),
      //   api.consultas.getHorariosPorFicha(),
      //   api.consultas.getOcupacionAmbientes()
      // ])
    } catch (err) {
      console.warn("Backend no disponible, usando datos mock:", err)
      setCarga(MOCK_CARGA)
      setHorariosFicha(MOCK_HORARIOS_FICHA)
      setOcupacion(MOCK_OCUPACION)
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    showToast("Preparando reporte para descarga...", "info")
    setTimeout(() => window.print(), 500)
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
      <div className="p-6 space-y-6 print:p-0">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Consultas y Reportes</h1>
            <p className="text-gray-500 text-sm">Vistas consolidadas para gestión académica</p>
          </div>
          <button
            onClick={handleDownloadPDF}
            className="bg-sena hover:bg-sena/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            <FileDown className="w-4 h-4" />
            Descargar PDF
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 print:hidden">
          {[
            { id: "carga", label: "Carga Horaria", icon: Users },
            { id: "ficha", label: "Horario por Ficha", icon: Calendar },
            { id: "ocupacion", label: "Ocupación Ambientes", icon: Building2 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-sena text-sena"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-500 bg-white rounded-xl border border-gray-200">
            <Loader2 className="w-8 h-8 animate-spin text-sena mb-2" />
            <p>Cargando reporte...</p>
          </div>
        ) : (
          <>
            {/* Tab: Carga Horaria */}
            {activeTab === "carga" && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between print:hidden">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por instructor..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                      <option>Todos los estados</option>
                      <option>Normal</option>
                      <option>Sobrecarga</option>
                    </select>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4">Instructor</th>
                        <th className="px-6 py-4 text-center">Total Horas</th>
                        <th className="px-6 py-4 text-center">Fichas</th>
                        <th className="px-6 py-4 text-center">Competencias</th>
                        <th className="px-6 py-4 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {carga.filter(c => c.instructor_nombre.toLowerCase().includes(search.toLowerCase())).map((c) => (
                        <tr key={c.instructor_id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-medium text-gray-900">{c.instructor_nombre}</td>
                          <td className="px-6 py-4 text-center font-semibold text-gray-700">{c.total_horas}h</td>
                          <td className="px-6 py-4 text-center text-gray-600">{c.fichas_count}</td>
                          <td className="px-6 py-4 text-center text-gray-600">{c.competencias_count}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              c.estado === "Sobrecarga" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                            }`}>
                              {c.estado === "Sobrecarga" ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                              {c.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between text-sm text-gray-500">
                    <span>Total instructores: {carga.length}</span>
                    <span>Horas totales: {carga.reduce((sum, c) => sum + c.total_horas, 0)}h</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Horario por Ficha */}
            {activeTab === "ficha" && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm print:hidden">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por número de ficha..."
                      value={filtroFicha}
                      onChange={(e) => setFiltroFicha(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4">Ficha</th>
                        <th className="px-6 py-4">Programa</th>
                        <th className="px-6 py-4 text-center">Lun</th>
                        <th className="px-6 py-4 text-center">Mar</th>
                        <th className="px-6 py-4 text-center">Mié</th>
                        <th className="px-6 py-4 text-center">Jue</th>
                        <th className="px-6 py-4 text-center">Vie</th>
                        <th className="px-6 py-4 text-center">Sáb</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {horariosFicha.filter(h => h.ficha_numero.includes(filtroFicha)).map((h) => (
                        <tr key={h.ficha_numero} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-medium text-sena">{h.ficha_numero}</td>
                          <td className="px-6 py-4 text-gray-600">{h.programa}</td>
                          <td className="px-6 py-4 text-center text-xs">{h.lunes}</td>
                          <td className="px-6 py-4 text-center text-xs">{h.martes}</td>
                          <td className="px-6 py-4 text-center text-xs">{h.miercoles}</td>
                          <td className="px-6 py-4 text-center text-xs">{h.jueves}</td>
                          <td className="px-6 py-4 text-center text-xs">{h.viernes}</td>
                          <td className="px-6 py-4 text-center text-xs">{h.sabado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Ocupación Ambientes */}
            {activeTab === "ocupacion" && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4">Ambiente</th>
                        <th className="px-6 py-4 text-center">Tipo</th>
                        <th className="px-6 py-4 text-center">Capacidad</th>
                        <th className="px-6 py-4 text-center">Horas Ocupadas</th>
                        <th className="px-6 py-4 text-center">Ocupación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ocupacion.map((o) => (
                        <tr key={o.ambiente_nombre} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-medium text-gray-900">{o.ambiente_nombre}</td>
                          <td className="px-6 py-4 text-center text-gray-600">{o.tipo}</td>
                          <td className="px-6 py-4 text-center text-gray-600">{o.capacidad}</td>
                          <td className="px-6 py-4 text-center text-gray-600">{o.horas_ocupadas}h / {o.horas_totales}h</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                <div
                                  className={`h-2.5 rounded-full ${
                                    o.porcentaje > 80 ? "bg-red-500" : o.porcentaje > 50 ? "bg-yellow-500" : "bg-green-500"
                                  }`}
                                  style={{ width: `${o.porcentaje}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-600 w-10">{o.porcentaje}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer impresión */}
        <div className="hidden print:block mt-8 text-xs text-gray-500 text-center">
          <p>Reporte generado automáticamente por CONINS · CDMC SENA</p>
          <p>Fecha de emisión: {new Date().toLocaleDateString("es-CO")}</p>
        </div>
      </div>

      {/* Estilos impresión */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          main { position: absolute; left: 0; top: 0; width: 100%; }
          main * { visibility: visible; }
        }
      `}</style>
    </DashboardLayout>
  )
}
