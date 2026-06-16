import { useState, useEffect } from "react"
import { X, Loader2, User, Mail, Lock } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"

type PerfilModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function PerfilModal({ isOpen, onClose }: PerfilModalProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<"info" | "password">("info")
  
  const [perfil, setPerfil] = useState({
    nombre: "",
    email: "",
    rol: "",
  })

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
  })

  const [passwordData, setPasswordData] = useState({
    contrasena_actual: "",
    nueva_contrasena: "",
    confirmar_contrasena: "",
  })

  useEffect(() => {
    if (isOpen) {
      cargarPerfil()
      setActiveTab("info")
    }
  }, [isOpen])

  const cargarPerfil = async () => {
    setLoading(true)
    try {
      const res = await api.auth.getPerfil()
      const data = res.data
      setPerfil({
        nombre: data.nombre || "",
        email: data.email || "",
        rol: data.rol || data.roles?.[0] || "",
      })
      setFormData({
        nombre: data.nombre || "",
        email: data.email || "",
      })
    } catch (err) {
      console.error("Error cargando perfil:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePerfil = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.auth.updatePerfil(formData.nombre, formData.email)
      showToast("Perfil actualizado exitosamente", "success")
      cargarPerfil()
    } catch (err: any) {
      showToast(err.message || "Error al actualizar perfil", "error")
    } finally {
      setSubmitting(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.nueva_contrasena !== passwordData.confirmar_contrasena) {
      showToast("Las contraseñas nuevas no coinciden", "error")
      return
    }
    setSubmitting(true)
    try {
      await api.auth.cambiarContrasena(passwordData.contrasena_actual, passwordData.nueva_contrasena)
      showToast("Contraseña cambiada exitosamente", "success")
      setPasswordData({ contrasena_actual: "", nueva_contrasena: "", confirmar_contrasena: "" })
      setActiveTab("info")
    } catch (err: any) {
      showToast(err.message || "Error al cambiar contraseña", "error")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Mi Perfil</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-sena mb-2" />
            <p>Cargando perfil...</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("info")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === "info"
                    ? "text-sena border-b-2 border-sena bg-sena/5"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <User className="w-4 h-4 inline mr-2" />
                Información
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === "password"
                    ? "text-sena border-b-2 border-sena bg-sena/5"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Lock className="w-4 h-4 inline mr-2" />
                Seguridad
              </button>
            </div>

            <div className="p-4 md:p-6">
              {activeTab === "info" ? (
                <form onSubmit={handleUpdatePerfil} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                    <input
                      type="text"
                      value={perfil.rol}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500"
                    />
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
                      Guardar cambios
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
                    <input
                      type="password"
                      required
                      value={passwordData.contrasena_actual}
                      onChange={(e) => setPasswordData({ ...passwordData, contrasena_actual: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                    <input
                      type="password"
                      required
                      value={passwordData.nueva_contrasena}
                      onChange={(e) => setPasswordData({ ...passwordData, nueva_contrasena: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
                    <input
                      type="password"
                      required
                      value={passwordData.confirmar_contrasena}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmar_contrasena: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("info")}
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
                      Cambiar contraseña
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
