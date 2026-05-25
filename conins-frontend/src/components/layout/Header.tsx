import { Bell } from "lucide-react"
import { useAuth } from "@/lib/AuthContext"

export default function Header() {
  const { user } = useAuth()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
      {/* Breadcrumb / Titulo de seccion */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>CONINS</span>
        <span>·</span>
        <span className="text-gray-900 font-semibold">Dashboard</span>
      </div>

      {/* Zona de usuario */}
      <div className="flex items-center gap-6">
        {/* Notificaciones */}
        <button className="relative text-gray-500 hover:text-gray-700 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-sena text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            2
          </span>
        </button>

        {/* Perfil */}
        <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">
              {user?.nombre || "Usuario"}
            </p>
            <p className="text-xs text-gray-500">
              {user?.roles?.[0] || "Rol"}
            </p>
          </div>
          <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold text-sm">
            {user?.nombre?.charAt(0) || "U"}
          </div>
        </div>
      </div>
    </header>
  )
}
