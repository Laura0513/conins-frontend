import { useState, useEffect } from "react"
import { X, Loader2, Plus, Trash2 } from "lucide-react"
import { api } from "@/lib/api"

type Programa = { id: number; nombre: string }
type Lider = { id: number; nombre: string }

type AsignarProgramasLiderModalProps = {
  isOpen: boolean
  onClose: () => void
  lider: Lider | null
  onSubmit: (liderId: number, programaIds: number[]) => Promise<void>
}

export default function AsignarProgramasLiderModal({ isOpen, onClose, lider, onSubmit }: AsignarProgramasLiderModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [programas, setProgramas] = useState<Programa[]>([])
  const [programasDisponibles, setProgramasDisponibles] = useState<Programa[]>([])
  const [programasAsignados, setProgramasAsignados] = useState<Programa[]>([])
  const [selectedProgramaId, setSelectedProgramaId] = useState("")

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      api.programs.getAll()
        .then((res) => {
          setProgramas(res.data || [])
          setProgramasDisponibles(res.data || [])
        })
        .catch(() => {
          setProgramas([])
          setProgramasDisponibles([])
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen])

  useEffect(() => {
    if (lider && isOpen) {
      setProgramasAsignados([])
      setSelectedProgramaId("")
    }
  }, [lider, isOpen])

  if (!isOpen || !lider) return null

  const handleAgregarPrograma = () => {
    if (!selectedProgramaId) return
    const programa = programas.find(p => p.id === Number(selectedProgramaId))
    if (!programa) return

    setProgramasAsignados([...programasAsignados, programa])
    setProgramasDisponibles(programasDisponibles.filter(p => p.id !== programa.id))
    setSelectedProgramaId("")
  }

  const handleRemoverPrograma = (programaId: number) => {
    const programa = programasAsignados.find(p => p.id === programaId)
    if (programa) {
      setProgramasDisponibles([...programasDisponibles, programa])
      setProgramasAsignados(programasAsignados.filter(p => p.id !== programaId))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const programaIds = programasAsignados.map(p => p.id)
      await onSubmit(lider.id, programaIds)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Asignar programas</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-sena/5 border-b border-sena/10">
          <p className="text-sm text-gray-700 font-medium">Lider: {lider.nombre}</p>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-sena mb-2" />
            <p className="text-sm">Cargando programas...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Programas asignados</label>
              <div className="border border-gray-200 rounded-lg min-h-[120px] max-h-[200px] overflow-y-auto p-2 space-y-1 bg-gray-50">
                {programasAsignados.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Sin programas asignados</p>
                ) : (
                  programasAsignados.map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-white px-3 py-2 rounded border border-gray-100">
                      <span className="text-sm text-gray-700">{p.nombre}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoverPrograma(p.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={selectedProgramaId}
                onChange={(e) => setSelectedProgramaId(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
              >
                <option value="">Seleccionar programa</option>
                {programasDisponibles.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAgregarPrograma}
                disabled={!selectedProgramaId}
                className="px-4 py-2.5 bg-sena hover:bg-sena/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2.5 bg-sena hover:bg-sena/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Guardar asignacion
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
