import { useState, useEffect } from "react"
import { X, Plus, Pencil, Power, Loader2, FileText, AlertTriangle } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"

type Competencia = {
  id: number
  codigo: string
  nombre: string
  programa_id: number
  programa_nombre: string
  raps_count: number
  activo: boolean
}

type Rap = {
  id: number
  codigo: string
  descripcion: string
  activo: boolean
}

type VerRapsModalProps = {
  isOpen: boolean
  onClose: () => void
  competencia: Competencia | null
  puedeEditar: boolean
}

export default function VerRapsModal({
  isOpen,
  onClose,
  competencia,
  puedeEditar,
}: VerRapsModalProps) {
  const { showToast } = useToast()
  const [raps, setRaps] = useState<Rap[]>([])
  const [loading, setLoading] = useState(false)

  // Form for create/edit RAP
  const [showForm, setShowForm] = useState(false)
  const [editingRap, setEditingRap] = useState<Rap | null>(null)
  const [rapCodigo, setRapCodigo] = useState("")
  const [rapDescripcion, setRapDescripcion] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    rap: Rap | null
  }>({ isOpen: false, rap: null })

  useEffect(() => {
    if (isOpen && competencia) {
      cargarRaps()
      setShowForm(false)
      setEditingRap(null)
    }
  }, [isOpen, competencia])

  const cargarRaps = async () => {
    if (!competencia) return
    setLoading(true)
    try {
      const res = await api.competencias.getRaps(competencia.id)
      setRaps(res.data || [])
    } catch {
      setRaps([])
    } finally {
      setLoading(false)
    }
  }

  const openCreateForm = () => {
    setEditingRap(null)
    setRapCodigo("")
    setRapDescripcion("")
    setShowForm(true)
  }

  const openEditForm = (rap: Rap) => {
    setEditingRap(rap)
    setRapCodigo(rap.codigo)
    setRapDescripcion(rap.descripcion)
    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingRap(null)
    setRapCodigo("")
    setRapDescripcion("")
  }

  const handleSubmitRap = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!competencia || !rapCodigo.trim() || !rapDescripcion.trim()) return

    setSubmitting(true)
    try {
      if (editingRap) {
        await api.competencias.updateRap(competencia.id, editingRap.id, {
          codigo: rapCodigo.trim(),
          descripcion: rapDescripcion.trim(),
        })
        showToast("RAP actualizado exitosamente", "success")
      } else {
        await api.competencias.createRap(competencia.id, {
          codigo: rapCodigo.trim(),
          descripcion: rapDescripcion.trim(),
        })
        showToast("RAP registrado exitosamente", "success")
      }
      cancelForm()
      cargarRaps()
    } catch (err: any) {
      showToast(err.message || "Error al guardar RAP", "error")
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleRap = async () => {
    if (!competencia || !confirmDialog.rap) return
    try {
      await api.competencias.toggleRapEstado(competencia.id, confirmDialog.rap.id)
      const accion = confirmDialog.rap.activo ? "desactivado" : "activado"
      showToast(`RAP ${accion} exitosamente`, "success")
      setConfirmDialog({ isOpen: false, rap: null })
      cargarRaps()
    } catch (err: any) {
      showToast(err.message || "Error al cambiar estado del RAP", "error")
    }
  }

  if (!isOpen || !competencia) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">RAPs de competencia</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              <span className="font-mono text-xs">{competencia.codigo}</span> — {competencia.nombre}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1">
          {puedeEditar && !showForm && (
            <button
              onClick={openCreateForm}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm font-medium text-gray-500 hover:border-sena hover:text-sena transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar RAP
            </button>
          )}

          {showForm && (
            <form
              onSubmit={handleSubmitRap}
              className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3"
            >
              <h3 className="text-sm font-semibold text-gray-900">
                {editingRap ? "Editar RAP" : "Nuevo RAP"}
              </h3>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Código</label>
                <input
                  type="text"
                  value={rapCodigo}
                  onChange={(e) => setRapCodigo(e.target.value)}
                  placeholder="Ej: RA1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                <textarea
                  value={rapDescripcion}
                  onChange={(e) => setRapDescripcion(e.target.value)}
                  placeholder="Descripción del resultado de aprendizaje..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena resize-none"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !rapCodigo.trim() || !rapDescripcion.trim()}
                  className="px-4 py-2 bg-sena hover:bg-sena/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingRap ? "Guardar" : "Agregar"}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="py-8 flex flex-col items-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-sm">Cargando RAPs...</p>
            </div>
          ) : raps.length > 0 ? (
            <div className="space-y-2">
              {raps.map((rap) => (
                <div
                  key={rap.id}
                  className={`p-4 rounded-lg border ${
                    rap.activo
                      ? "bg-white border-gray-200"
                      : "bg-gray-50 border-gray-200 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-medium text-gray-500">
                            {rap.codigo}
                          </span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              rap.activo
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {rap.activo ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{rap.descripcion}</p>
                      </div>
                    </div>

                    {puedeEditar && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditForm(rap)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDialog({ isOpen: true, rap })}
                          className={`p-1.5 rounded transition-colors ${
                            rap.activo
                              ? "text-gray-400 hover:text-red-600 hover:bg-red-50"
                              : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                          }`}
                          title={rap.activo ? "Desactivar" : "Activar"}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No hay RAPs registrados para esta competencia.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-400">
            {raps.length} RAP{raps.length !== 1 ? "s" : ""} registrado{raps.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      {confirmDialog.isOpen && confirmDialog.rap && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  {confirmDialog.rap.activo ? "Desactivar" : "Activar"} RAP
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                ¿Estás seguro de que quieres {confirmDialog.rap.activo ? "desactivar" : "activar"} el
                RAP <strong>{confirmDialog.rap.codigo}</strong>?
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setConfirmDialog({ isOpen: false, rap: null })}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleToggleRap}
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
