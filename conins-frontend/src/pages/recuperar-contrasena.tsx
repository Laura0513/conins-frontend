import { useState } from "react"
import { useRouter } from "next/router"
import Image from "next/image"
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, Loader2 } from "lucide-react"
import { useToast } from "@/lib/ToastContext"
import { api } from "@/lib/api"

export default function RecuperarContrasenaPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { token } = router.query

  // Paso 1: Solicitar recuperación (ingresar correo)
  // Paso 2: Correo enviado (confirmación)
  // Paso 3: Nueva contraseña (cuando llega con token)
  const [paso, setPaso] = useState<1 | 2 | 3>(token ? 3 : 1)

  const [email, setEmail] = useState("")
  const [nuevaContrasena, setNuevaContrasena] = useState("")
  const [confirmarContrasena, setConfirmarContrasena] = useState("")
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [mostrarConfirm, setMostrarConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetExitoso, setResetExitoso] = useState(false)

  // Solicitar recuperación
  const handleSolicitarRecuperacion = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.auth.solicitarRecuperacion(email)
      setPaso(2)
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Error al enviar solicitud",
        "error"
      )
    } finally {
      setLoading(false)
    }
  }

  // Resetear contraseña con token
  const handleResetearContrasena = async (e: React.FormEvent) => {
    e.preventDefault()

    if (nuevaContrasena.length < 8) {
      showToast("La contraseña debe tener al menos 8 caracteres", "error")
      return
    }

    if (nuevaContrasena !== confirmarContrasena) {
      showToast("Las contraseñas no coinciden", "error")
      return
    }

    setLoading(true)
    try {
      await api.auth.resetearContrasena(token as string, nuevaContrasena)
      setResetExitoso(true)
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Error al cambiar contraseña. El enlace puede haber expirado.",
        "error"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      {/* Logo y título */}
      <div className="flex flex-col items-center mb-8">
        <Image
          src="/logoSena.png"
          alt="Logo SENA"
          width={80}
          height={80}
          className="mb-4 object-contain"
        />
        <h1 className="text-3xl font-bold text-gray-900">CONINS</h1>
        <p className="text-gray-500 mt-1">Recuperar contraseña</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm w-full max-w-md p-8">

        {/* PASO 1: Ingresar correo */}
        {paso === 1 && (
          <form onSubmit={handleSolicitarRecuperacion} className="flex flex-col gap-4">
            <div className="text-center mb-2">
              <h2 className="text-lg font-bold text-gray-900">¿Olvidaste tu contraseña?</h2>
              <p className="text-sm text-gray-500 mt-1">
                Ingresa tu correo y te enviaremos un enlace para restablecerla.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Correo electrónico
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@sena.edu.co"
                  className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sena hover:bg-sena/90 text-white font-semibold py-3 rounded-xl transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/auth")}
              className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-sena transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </button>
          </form>
        )}

        {/* PASO 2: Correo enviado */}
        {paso === 2 && (
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-sena/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-sena" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Revisa tu correo</h2>
            <p className="text-sm text-gray-500">
              Hemos enviado un enlace de recuperación a <span className="font-medium text-gray-700">{email}</span>.
              Revisa tu bandeja de entrada y sigue las instrucciones.
            </p>
            <p className="text-xs text-gray-400">
              Si no lo ves, revisa la carpeta de spam.
            </p>

            <div className="flex flex-col gap-3 w-full mt-2">
              <button
                onClick={() => setPaso(1)}
                className="w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition-colors hover:bg-gray-50"
              >
                Reenviar correo
              </button>
              <button
                onClick={() => router.push("/auth")}
                className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-sena transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: Nueva contraseña (con token) */}
        {paso === 3 && !resetExitoso && (
          <form onSubmit={handleResetearContrasena} className="flex flex-col gap-4">
            <div className="text-center mb-2">
              <h2 className="text-lg font-bold text-gray-900">Nueva contraseña</h2>
              <p className="text-sm text-gray-500 mt-1">
                Ingresa tu nueva contraseña para restablecer el acceso.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Nueva contraseña
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 gap-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <input
                  type={mostrarPassword ? "text" : "password"}
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="text-gray-400"
                >
                  {mostrarPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Confirmar contraseña
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 gap-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <input
                  type={mostrarConfirm ? "text" : "password"}
                  value={confirmarContrasena}
                  onChange={(e) => setConfirmarContrasena(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirm(!mostrarConfirm)}
                  className="text-gray-400"
                >
                  {mostrarConfirm ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sena hover:bg-sena/90 text-white font-semibold py-3 rounded-xl transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Cambiando..." : "Restablecer contraseña"}
            </button>
          </form>
        )}

        {/* PASO 3: Reset exitoso */}
        {paso === 3 && resetExitoso && (
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-sena" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Contraseña actualizada</h2>
            <p className="text-sm text-gray-500">
              Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión.
            </p>
            <button
              onClick={() => router.push("/auth")}
              className="w-full bg-sena hover:bg-sena/90 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
            >
              Ir a iniciar sesión
            </button>
          </div>
        )}
      </div>

      <p className="text-gray-400 text-sm mt-8">© 2026 CONINS · CDMC SENA</p>
    </main>
  )
}
