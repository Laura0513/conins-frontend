import { useState } from "react"
import { AlertTriangle, X } from "lucide-react"

type ConfirmDialogProps = {
  title: string
  message: string
  showMotivo?: boolean
  onConfirm: (motivo?: string) => void
  onCancel: () => void
}

export default function ConfirmDialog({ title, message, showMotivo, onConfirm, onCancel }: ConfirmDialogProps) {
  const [motivo, setMotivo] = useState("")

  const handleConfirm = () => {
    onConfirm(showMotivo ? motivo : undefined)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">{message}</p>

          {showMotivo && (
            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-500 mb-1">Motivo (opcional)</label>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Motivo de la deshabilitación"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {showMotivo ? "Deshabilitar" : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
