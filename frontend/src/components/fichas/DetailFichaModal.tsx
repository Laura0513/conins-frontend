import { useState, useEffect } from "react"
import { X, BookOpen, Clock, MapPin, Users, Calendar, FileText, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

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
  fecha_inicio?: string
  fecha_fin?: string
  ambiente?: string
}

type InstructorAsignado = {
  id: number
  instructor_nombre: string
  competencia: string
  horas: number
  es_lider: boolean
}

type DetailFichaModalProps = {
  isOpen: boolean
  onClose: () => void
  ficha: Ficha | null
}

export default function DetailFichaModal({ isOpen, onClose, ficha }: DetailFichaModalProps) {
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
      const res = await api.fichas.getById(ficha.id)
      setInstructores(res.data?.instructores || [])
    } catch {
      setInstructores([])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !ficha) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Detalle de ficha</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-6 overflow-y-auto flex-1">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-sena/10 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-sena" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Ficha {ficha.numero_ficha}</h3>
              <p className="text-sm text-gray-500">{ficha.programa}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Jornada</p>
                <p className="text-sm text-gray-900">{ficha.jornada}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Etapa</p>
                <p className="text-sm text-gray-900 capitalize">{ficha.etapa}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Modalidad</p>
                <p className="text-sm text-gray-900">{ficha.modalidad}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Instructores</p>
                <p className="text-sm text-gray-900">{ficha.instructores_count} asignados</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Fecha inicio</p>
                <p className="text-sm text-gray-900">{ficha.fecha_inicio || "No definida"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Fecha fin</p>
                <p className="text-sm text-gray-900">{ficha.fecha_fin || "No definida"}</p>
              </div>
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
                        {asig.instructor_nombre}
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

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              ficha.estado === "Activa" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}>
              {ficha.estado}
            </span>
            {!ficha.activo && (
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
