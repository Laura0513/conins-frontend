import { useState, useEffect } from "react"
import { X, BookOpen, Clock, MapPin, Users, Calendar, FileText, Loader2, Home } from "lucide-react"
import { api } from "@/lib/api"
import { formatJornada } from "@/lib/terminology"

type Ficha = {
  id: number
  numero_ficha: string
  programa: string
  jornada: string
  etapa: string
  modalidad: string
  instructores_count: number
  estado: string
  activo: boolean
  ambiente?: string
  lider_nombre?: string
  referente_nombre?: string
  fecha_inicio_lectiva?: string | null
  fecha_fin_lectiva?: string | null
  fecha_inicio_productiva?: string | null
  fecha_fin_productiva?: string | null
  fecha_fin_ficha?: string | null
}

type InstructorAsignado = {
  id: number
  instructor_id?: number
  instructor_nombre: string
  competencia: string
  horas: number
  es_lider: boolean
}

type DetailFichaModalProps = {
  isOpen: boolean
  onClose: () => void
  ficha: Ficha | null
  onInstructorClick?: (instructorId: number, nombre: string) => void
}

export default function DetailFichaModal({ isOpen, onClose, ficha, onInstructorClick }: DetailFichaModalProps) {
  const [detalle, setDetalle] = useState<Ficha | null>(null)
  const [instructores, setInstructores] = useState<InstructorAsignado[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && ficha) {
      cargarDetalle()
    }
  }, [isOpen, ficha])

  const cargarDetalle = async () => {
    if (!ficha) return
    setLoading(true)
    try {
      const [fichaRes, asigRes] = await Promise.all([
        api.fichas.getById(ficha.id),
        api.assignments.getAll(),
      ])
      setDetalle(fichaRes.data || ficha)

      // Filtrar asignaciones de esta ficha
      const asignacionesFicha = (asigRes.data || []).filter(
        (a: any) => a.ficha_id === ficha.id && a.activo
      )
      const mapped: InstructorAsignado[] = asignacionesFicha.map((a: any) => ({
        id: a.id,
        instructor_id: a.instructor_id,
        instructor_nombre: a.instructor_nombre || "—",
        competencia: a.competencia || "",
        horas: a.horas_asignadas || 0,
        es_lider: a.es_lider || false,
      }))
      setInstructores(mapped)
    } catch {
      setDetalle(ficha)
      setInstructores([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d: string | null | undefined) => {
    if (!d) return "No definida"
    return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
  }

  if (!isOpen || !ficha) return null

  const data = detalle || ficha

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Detalle de grupo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-sena/10 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-sena" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Grupo {data.numero_ficha}</h3>
              <p className="text-sm text-gray-500">{data.programa}</p>
            </div>
          </div>

          {/* Info general */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Jornada</p>
                <p className="text-sm text-gray-900">{formatJornada(data.jornada)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Etapa</p>
                <p className="text-sm text-gray-900 capitalize">{data.etapa}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Modalidad</p>
                <p className="text-sm text-gray-900">{data.modalidad}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Instructores</p>
                <p className="text-sm text-gray-900">{data.instructores_count} asignados</p>
              </div>
            </div>
            {data.ambiente && (
              <div className="flex items-start gap-3">
                <Home className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Ambiente</p>
                  <p className="text-sm text-gray-900">{data.ambiente}</p>
                </div>
              </div>
            )}
            {data.lider_nombre && (
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Lider de programa</p>
                  <p className="text-sm text-gray-900">{data.lider_nombre}</p>
                </div>
              </div>
            )}
            {data.referente_nombre && (
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Referente del grupo</p>
                  <p className="text-sm text-gray-900">{data.referente_nombre}</p>
                </div>
              </div>
            )}
          </div>

          {/* Fechas */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sena" />
              Fechas
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Inicio lectiva</p>
                <p className="text-sm text-gray-900">{formatDate(data.fecha_inicio_lectiva)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fin lectiva</p>
                <p className="text-sm text-gray-900">{formatDate(data.fecha_fin_lectiva)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Inicio productiva</p>
                <p className="text-sm text-gray-900">{formatDate(data.fecha_inicio_productiva)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fin productiva</p>
                <p className="text-sm text-gray-900">{formatDate(data.fecha_fin_productiva)}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">Fecha fin grupo</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(data.fecha_fin_ficha)}</p>
            </div>
          </div>

          {/* Instructores asignados */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-sena" />
              Instructores asignados ({loading ? "..." : instructores.length})
            </h4>
            {loading ? (
              <div className="py-4 flex items-center justify-center text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : instructores.length > 0 ? (
              <div className="space-y-2">
                {instructores.map((asig) => (
                  <div key={asig.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {onInstructorClick && asig.instructor_id ? (
                          <button
                            onClick={() => onInstructorClick(asig.instructor_id!, asig.instructor_nombre)}
                            className="text-left hover:text-sena hover:underline transition-colors"
                            title="Ver detalle del instructor"
                          >
                            {asig.instructor_nombre}
                          </button>
                        ) : (
                          asig.instructor_nombre
                        )}
                        {asig.es_lider && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sena/10 text-sena">
                            Lider
                          </span>
                        )}
                      </p>
                      {asig.competencia && (
                        <p className="text-xs text-gray-500">{asig.competencia}</p>
                      )}
                    </div>
                    {asig.horas > 0 && (
                      <span className="text-sm font-medium text-gray-700">{asig.horas}h</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sin instructores asignados</p>
            )}
          </div>

          {/* Estado */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              data.estado === "Activa" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}>
              {data.estado}
            </span>
            {!data.activo && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Inactiva
              </span>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
