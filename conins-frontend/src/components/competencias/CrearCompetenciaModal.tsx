import { useState } from "react"
import { X, Loader2 } from "lucide-react"

type Programa = {
  id: number
  nombre: string
}

type CrearCompetenciaModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { codigo: string; nombre: string; programa_id: number }) => Promise<void>
  programas: Programa[]
}

export default function CrearCompetenciaModal({
  isOpen,
  onClose,
  onSubmit,
  programas,
}: CrearCompetenciaModalProps) {
  const [codigo, setCodigo] = useState("")
  const [nombre, setNombre] = useState("")
  const [programaId, setProgramaId] = useState<number | "">("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codigo.trim() || !nombre.trim() || !programaId) return

    setSubmitting(true)
    try {
      await onSubmit({ codigo: codigo.trim(), nombre: nombre.trim(), programa_id: Number(programaId) })
      setCodigo("")
      setNombre("")
      setProgramaId("")
    } catch {
      // error handled by parent
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setCodigo("")
    setNombre("")
    setProgramaId("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Registrar competencia</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código de competencia
            </label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ej: 240201500"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la competencia
            </label>
            <textarea
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Descripción de la competencia..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Programa de formación
            </label>
            <select
              value={programaId}
              onChange={(e) => setProgramaId(e.target.value ? Number(e.target.value) : "")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena bg-white"
              required
            >
              <option value="">Seleccionar programa</option>
              {programas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !codigo.trim() || !nombre.trim() || !programaId}
              className="px-4 py-2.5 bg-sena hover:bg-sena/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
