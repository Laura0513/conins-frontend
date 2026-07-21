import { useState, useEffect } from "react"
import { X, Clock, User, BookOpen, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

type Ambiente = {
  id: number
  nombre: string
  tipo: string
  capacidad: number
  activo: boolean
}

type Horario = {
  id: number
  instructor_nombre: string
  ficha_numero: string
  competencia: string
  dias: string[]
  horas: string
}

type VerAgendaAmbienteModalProps = {
  isOpen: boolean
  onClose: () => void
  ambiente: Ambiente | null
}

export default function VerAgendaAmbienteModal({ isOpen, onClose, ambiente }: VerAgendaAmbienteModalProps) {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && ambiente) {
      cargarHorarios()
    }
  }, [isOpen, ambiente])

  const cargarHorarios = async () => {
    setLoading(true)
    try {
      const res = await api.horarios.getAll()
      const filtrados = (res.data || []).filter(
        (h: any) => h.ambiente === ambiente?.nombre && h.activo
      )
      setHorarios(filtrados)
    } catch {
      setHorarios([])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !ambiente) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Agenda de {ambiente.nombre}</h2>
            <p className="text-sm text-gray-500">{ambiente.tipo} · Capacidad: {ambiente.capacidad} pax</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-8 flex flex-col items-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-sm">Cargando agenda...</p>
            </div>
          ) : horarios.length > 0 ? (
            <div className="space-y-3">
              {horarios.map((h) => (
                <div key={h.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sena/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-sena" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{h.instructor_nombre}</p>
                        <p className="text-xs text-gray-500">Grupo {h.ficha_numero}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {h.horas}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {h.competencia}
                    </div>
                    <div className="flex gap-1">
                      {(h.dias || []).map((d) => (
                        <span key={d} className="px-1.5 py-0.5 bg-white rounded border border-gray-200">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No hay horarios registrados para este ambiente.</p>
            </div>
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
