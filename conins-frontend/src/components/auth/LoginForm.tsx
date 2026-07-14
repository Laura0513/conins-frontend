import { useState } from "react"
import { useRouter } from "next/router"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/AuthContext"
import { useToast } from "@/lib/ToastContext"

export default function LoginForm() {
  const { login } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(email, password)
      showToast("Bienvenido al sistema", "success")
      router.push("/")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al iniciar sesión", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* Campo correo */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          Correo electrónico
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

      {/* Campo contraseña */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          Contraseña
        </label>
        <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 gap-3">
          <span className="text-gray-400"><Lock className="w-5 h-5 text-gray-400" /></span>
          <input
            type={mostrarPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
            required
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

      {/* Botón */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-sena hover:bg-sena/90 text-white font-semibold py-3 rounded-xl transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Iniciando sesión..." : "Iniciar sesión"}
      </button>

      {/* Link olvidaste contraseña */}
      <Link href="/recuperar-contrasena" className="text-center text-sena text-sm font-semibold hover:underline">
        ¿Olvidaste tu contraseña?
      </Link>

    </form>
  )
}
