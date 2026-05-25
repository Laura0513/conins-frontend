import { useState } from "react"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { api } from "@/lib/api"

export default function CreatePasswordForm() {
  const [email, setEmail] = useState("")
  const [nuevaPassword, setNuevaPassword] = useState("")
  const [confirmarPassword, setConfirmarPassword] = useState("")
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (nuevaPassword !== confirmarPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setLoading(true)

    try {
      await api.auth.crearPassword(email, nuevaPassword, confirmarPassword)
      setSuccess("Contrasena creada exitosamente. Ya puedes iniciar sesion.")
      setEmail("")
      setNuevaPassword("")
      setConfirmarPassword("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la contrasena")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* Texto descriptivo */}
      <p className="text-sm text-gray-500">
        Tu cuenta fue habilitada por un administrador. Ingresa tu correo y crea tu contraseña de acceso.
      </p>

      {/* Campo correo */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          Correo electronico
        </label>
        <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 gap-3">
          <span className="text-gray-400"><Mail className="w-5 h-5 text-gray-400" /></span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
            required
          />
        </div>
      </div>

      {/* Campo contrasena nueva */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          Contrasena nueva
        </label>
        <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 gap-3">
          <span className="text-gray-400"><Lock className="w-5 h-5 text-gray-400" /></span>
          <input
            type={mostrarPassword ? "text" : "password"}
            value={nuevaPassword}
            onChange={(e) => setNuevaPassword(e.target.value)}
            placeholder="Minimo 6 caracteres"
            className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setMostrarPassword(!mostrarPassword)}
            className="text-gray-400 text-sm"
          >
            {mostrarPassword ? <Eye /> : <EyeOff />}
          </button>
        </div>
      </div>

      {/* Campo confirmar contrasena */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          Confirmar contrasena
        </label>
        <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 gap-3">
          <span className="text-gray-400"><Lock className="w-5 h-5 text-gray-400" /></span>
          <input
            type={mostrarConfirmar ? "text" : "password"}
            value={confirmarPassword}
            onChange={(e) => setConfirmarPassword(e.target.value)}
            placeholder="Repite tu contrasena"
            className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
            required
          />
          <button
            type="button"
            onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
            className="text-gray-400 text-sm"
          >
            {mostrarConfirmar ? <Eye /> : <EyeOff />}
          </button>
        </div>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">
          {error}
        </p>
      )}
      {success && (
        <p className="text-green-600 text-sm text-center bg-green-50 py-2 rounded-lg">
          {success}
        </p>
      )}

      {/* Boton */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-sena hover:bg-sena/90 text-white font-semibold py-3 rounded-xl transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Creando contrasena..." : "Crear contrasena"}
      </button>

    </form>
  )
}
