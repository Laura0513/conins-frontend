import { useState, useEffect } from "react"
import { X, User, Mail, FileText, Clock, AlertCircle, BookOpen, Calendar, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { formatJornada } from "@/lib/terminology"

type Instructor = {
  id: number
  nombre: string
  email: string
  tipo_area: string
  activo: boolean
  roles: string
  horas_semana?: number
  tiene_novedad?: boolean
}

type Asignacion = {
  ficha_numero: string
  programa: string
  jornada: string
  horas_asignadas: number
  es_lider: boolean
}

type Novedad = {
  tipo: string
  fecha_inicio: string
  fecha_regreso: string
  observacion: string
}

type DetailInstructorModalProps = {
  isOpen: boolean
  onClose: () => void
  instructor: Instructor | null
}

export default function DetailInstructorModal({ isOpen, onClose, instructor }: DetailInstructorModalProps) {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [novedades, setNovedades] = useState<Novedad[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && instructor) {
      cargarDetalle()
    }
  }, [isOpen, instructor])

  const cargarDetalle = async () => {
    if (!instructor) return
    setLoading(true)
    try {
      const res = await api.instructors.getDetalle(instructor.id)
      setAsignaciones(res.data?.asignaciones || [])
      setNovedades(res.data?.novedades || [])
    } catch {
      setAsignaciones([])
      setNovedades([])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !instructor) return null

  const horas = instructor.horas_semana ?? 0
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Detalle del instructor</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-sena/10 flex items-center justify-center">
              <User className="w-8 h-8 text-sena" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{instructor.nombre}</h3>
              <p className="text-sm text-gray-500">{instructor.roles || "Instructor"}</p>
            </div>
          </div>

          {/* Info basica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Correo</p>
                <p className="text-sm text-gray-900">{instructor.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Area</p>
                <p className="text-sm text-gray-900 capitalize">{instructor.tipo_area}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Carga horaria</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm font-medium ${colorTexto}`}>{horas}h / {limite}h</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${colorBarra}`} style={{ width: `${porcentaje}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-6 flex items-center justify-center text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <>
              {/* Asignaciones */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sena" />
                  Asignaciones ({asignaciones.length})
                </h4>
                {asignaciones.length > 0 ? (
                  <div className="space-y-2">
                    {asignaciones.map((asig, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Grupo {asig.ficha_numero}
                            {asig.es_lider && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sena/10 text-sena">
                                Lider
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">{asig.programa} - {formatJornada(asig.jornada)}</p>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{asig.horas_asignadas}h</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Sin asignaciones activas</p>
                )}
              </div>

              {/* Novedades */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  Novedades ({novedades.length})
                </h4>
                {novedades.length > 0 ? (
                  <div className="space-y-2">
                    {novedades.map((nov, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                        <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-orange-900">{nov.tipo}</p>
                          <p className="text-xs text-orange-700">
                            {nov.fecha_inicio} a {nov.fecha_regreso}
                          </p>
                          <p className="text-xs text-orange-600 mt-1">{nov.observacion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Sin novedades registradas</p>
                )}
              </div>
            </>
          )}
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
