import { X, User, Mail, FileText, Clock, AlertCircle, BookOpen, Calendar } from "lucide-react"

type Instructor = {
  id: number
  nombre: string
  email: string
  tipo_contrato: string
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

// Mock data until backend endpoints are ready
const MOCK_ASIGNACIONES: Asignacion[] = [
  { ficha_numero: "2995403", programa: "ADSO", jornada: "Manana", horas_asignadas: 20, es_lider: true },
  { ficha_numero: "2887341", programa: "Calzado", jornada: "Tarde", horas_asignadas: 15, es_lider: false },
]

const MOCK_NOVEDADES: Novedad[] = [
  { tipo: "Licencia", fecha_inicio: "2026-03-01", fecha_regreso: "2026-03-15", observacion: "Licencia medica" },
]

export default function DetailInstructorModal({ isOpen, onClose, instructor }: DetailInstructorModalProps) {
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

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
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
                <p className="text-xs text-gray-500">Contrato</p>
                <p className="text-sm text-gray-900 capitalize">
                  {instructor.tipo_contrato === "de_planta" ? "De Planta" : "Contratista"}
                </p>
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

          {/* Asignaciones */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sena" />
              Asignaciones ({MOCK_ASIGNACIONES.length})
            </h4>
            <div className="space-y-2">
              {MOCK_ASIGNACIONES.map((asig, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Ficha {asig.ficha_numero}
                      {asig.es_lider && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sena/10 text-sena">
                          Lider
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{asig.programa} - {asig.jornada}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{asig.horas_asignadas}h</span>
                </div>
              ))}
            </div>
          </div>

          {/* Novedades */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              Novedades ({MOCK_NOVEDADES.length})
            </h4>
            {MOCK_NOVEDADES.length > 0 ? (
              <div className="space-y-2">
                {MOCK_NOVEDADES.map((nov, i) => (
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
