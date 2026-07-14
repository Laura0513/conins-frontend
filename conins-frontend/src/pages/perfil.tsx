import { useState, useEffect } from "react"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import { useAuth } from "@/lib/AuthContext"
import {
  User,
  Mail,
  Shield,
  Key,
  Save,
  Loader2,
  Eye,
  EyeOff,
  FileText,
} from "lucide-react"

type PerfilData = {
  id: number
  nombre: string
  email: string
  rol: string
  tipo_documento?: string
  documento?: string
}

export default function PerfilPage() {
  const { user, loading: authLoading } = useProtectedRoute()
  const { showToast } = useToast()
  const { refreshUser } = useAuth()

  const [perfil, setPerfil] = useState<PerfilData | null>(null)
  const [loading, setLoading] = useState(true)

  // Editar perfil
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [saving, setSaving] = useState(false)

  // Cambiar contraseña
  const [activeTab, setActiveTab] = useState<"datos" | "seguridad">("datos")
  const [contrasenaActual, setContrasenaActual] = useState("")
  const [nuevaContrasena, setNuevaContrasena] = useState("")
  const [confirmarContrasena, setConfirmarContrasena] = useState("")
  const [showActual, setShowActual] = useState(false)
  const [showNueva, setShowNueva] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    cargarPerfil()
  }, [])

  const cargarPerfil = async () => {
    setLoading(true)
    try {
      const res = await api.auth.getPerfil()
      const data = res.data
      setPerfil(data)
      setNombre(data.nombre || "")
      setEmail(data.email || "")
    } catch (err) {
      console.warn("Error cargando perfil:", err)
      // Fallback con datos del contexto de auth
      if (user) {
        setPerfil({
          id: (user as any).id || 0,
          nombre: user.nombre || "",
          email: (user as any).email || "",
          rol: user.roles?.[0] || "",
        })
        setNombre(user.nombre || "")
        setEmail((user as any).email || "")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGuardarDatos = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      showToast("El nombre es obligatorio", "error")
      return
    }
    if (!email.trim()) {
      showToast("El correo es obligatorio", "error")
      return
    }

    setSaving(true)
    try {
      await api.auth.updatePerfil(nombre.trim(), email.trim())
      showToast("Perfil actualizado exitosamente", "success")
      if (refreshUser) refreshUser()
      cargarPerfil()
    } catch (err: any) {
      showToast(err.message || "Error al actualizar perfil", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleCambiarContrasena = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contrasenaActual) {
      showToast("Ingresa tu contraseña actual", "error")
      return
    }
    if (nuevaContrasena.length < 6) {
      showToast("La nueva contraseña debe tener al menos 6 caracteres", "error")
      return
    }
    if (nuevaContrasena !== confirmarContrasena) {
      showToast("Las contraseñas no coinciden", "error")
      return
    }

    setSavingPassword(true)
    try {
      await api.auth.cambiarContrasena(contrasenaActual, nuevaContrasena)
      showToast("Contraseña cambiada exitosamente", "success")
      setContrasenaActual("")
      setNuevaContrasena("")
      setConfirmarContrasena("")
    } catch (err: any) {
      showToast(err.message || "Error al cambiar contraseña", "error")
    } finally {
      setSavingPassword(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-sena" />
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-500 text-sm">Administra tu informacion personal y seguridad</p>
        </div>

        {/* Avatar card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-sena/10 flex items-center justify-center shrink-0">
              <span className="text-3xl font-bold text-sena">
                {perfil?.nombre?.charAt(0) || user?.nombre?.charAt(0) || "U"}
              </span>
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-gray-900">
                {perfil?.nombre || user?.nombre || "Usuario"}
              </h2>
              <p className="text-sm text-gray-500">{perfil?.email || ""}</p>
              <span className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-xs font-medium bg-sena/10 text-sena">
                <Shield className="w-3.5 h-3.5" />
                {perfil?.rol || user?.roles?.[0] || "Sin rol"}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("datos")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "datos"
                ? "border-sena text-sena"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <User className="w-4 h-4" />
            Datos personales
          </button>
          <button
            onClick={() => setActiveTab("seguridad")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "seguridad"
                ? "border-sena text-sena"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Key className="w-4 h-4" />
            Seguridad
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 flex flex-col items-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-sena mb-2" />
            <p>Cargando perfil...</p>
          </div>
        ) : (
          <>
            {/* Tab: Datos personales */}
            {activeTab === "datos" && (
              <form onSubmit={handleGuardarDatos} className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo electronico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
                      placeholder="tu@correo.com"
                    />
                  </div>
                </div>

                {perfil?.tipo_documento && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de documento
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={perfil.tipo_documento?.toUpperCase() || ""}
                          disabled
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numero de documento
                      </label>
                      <input
                        type="text"
                        value={perfil.documento || ""}
                        disabled
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 -mx-8 -mb-8 px-8 py-5 mt-8 rounded-b-xl border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-sena hover:bg-sena/90 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Guardar cambios
                  </button>
                </div>
              </form>
            )}

            {/* Tab: Seguridad */}
            {activeTab === "seguridad" && (
              <form onSubmit={handleCambiarContrasena} className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña actual
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-lg px-4 py-2.5 gap-3 focus-within:ring-2 focus-within:ring-sena/50 focus-within:border-sena">
                    <Key className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                      type={showActual ? "text" : "password"}
                      value={contrasenaActual}
                      onChange={(e) => setContrasenaActual(e.target.value)}
                      className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                      placeholder="Tu contraseña actual"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowActual(!showActual)}
                      className="text-gray-400 hover:text-gray-600 shrink-0"
                    >
                      {showActual ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva contraseña
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-lg px-4 py-2.5 gap-3 focus-within:ring-2 focus-within:ring-sena/50 focus-within:border-sena">
                    <Key className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                      type={showNueva ? "text" : "password"}
                      value={nuevaContrasena}
                      onChange={(e) => setNuevaContrasena(e.target.value)}
                      className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                      placeholder="Minimo 6 caracteres"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowNueva(!showNueva)}
                      className="text-gray-400 hover:text-gray-600 shrink-0"
                    >
                      {showNueva ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                  {nuevaContrasena && nuevaContrasena.length < 6 && (
                    <p className="text-xs text-red-500 mt-1">Minimo 6 caracteres</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar nueva contraseña
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-lg px-4 py-2.5 gap-3 focus-within:ring-2 focus-within:ring-sena/50 focus-within:border-sena">
                    <Key className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                      type={showConfirmar ? "text" : "password"}
                      value={confirmarContrasena}
                      onChange={(e) => setConfirmarContrasena(e.target.value)}
                      className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                      placeholder="Repite la nueva contraseña"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmar(!showConfirmar)}
                      className="text-gray-400 hover:text-gray-600 shrink-0"
                    >
                      {showConfirmar ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmarContrasena && nuevaContrasena !== confirmarContrasena && (
                    <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
                  )}
                </div>

                <div className="bg-gray-50 -mx-8 -mb-8 px-8 py-5 mt-8 rounded-b-xl border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingPassword || !contrasenaActual || nuevaContrasena.length < 6 || nuevaContrasena !== confirmarContrasena}
                    className="bg-sena hover:bg-sena/90 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingPassword ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4" />
                    )}
                    Cambiar contraseña
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
