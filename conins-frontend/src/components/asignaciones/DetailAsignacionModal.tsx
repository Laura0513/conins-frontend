import { X, User, BookOpen, MapPin, Clock, Star, FileText, Calendar } from "lucide-react"

type Asignacion = {
  id: number
  instructor_nombre: string
  ficha_numero: string
  competencia: string
  ambiente: string
  jornada: string
  es_lider: boolean
  tipo: "activa" | "provisional" | "historica"
  autorizado_por?: string
  fecha_autorizacion?: string
  motivo?: string
}

type DetailAsignacionModalProps = {
  isOpen: boolean
  onClose: () => void
  asignacion: Asignacion | null
}

export default function DetailAsignacionModal({ isOpen, onClose, asignacion }: DetailAsignacionModalProps) {
  if (!isOpen || !asignacion) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Detalle de asignación</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-sena/10 flex items-center justify-center">
              <User className="w-6 h-6 text-sena" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{asignacion.instructor_nombre}</h3>
              <p className="text-sm text-gray-500">Ficha {asignacion.ficha_numero}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Competencia</p>
                <p className="text-sm text-gray-900">{asignacion.competencia}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Ambiente</p>
                <p className="text-sm text-gray-900">{asignacion.ambiente || "Sin asignar"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Jornada</p>
                <p className="text-sm text-gray-900">{asignacion.jornada}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Líder</p>
                <p className="text-sm text-gray-900">{asignacion.es_lider ? "Sí" : "No"}</p>
              </div>
            </div>
          </div>

          {asignacion.tipo === "provisional" && (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-orange-600 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Información de provisionalidad
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Autorizado por</p>
                  <p className="text-gray-900">{asignacion.autorizado_por || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fecha</p>
                  <p className="text-gray-900">{asignacion.fecha_autorizacion || "-"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Motivo</p>
                <p className="text-gray-900 mt-1 bg-orange-50 p-3 rounded-lg text-sm">{asignacion.motivo || "-"}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              asignacion.tipo === "activa" ? "bg-green-100 text-green-800" : asignacion.tipo === "provisional" ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-800"
            }`}>
              {asignacion.tipo === "activa" ? "Activa" : asignacion.tipo === "provisional" ? "Provisional" : "Histórica"}
            </span>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end">
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
