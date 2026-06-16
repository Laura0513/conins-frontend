import { Bell, LogOut, Menu } from "lucide-react"
import { useRouter } from "next/router"
import { useAuth } from "@/lib/AuthContext"
import { useState, useRef, useEffect } from "react"
import PerfilModal from "@/components/ui/PerfilModal"

type Notificacion = {
  id: number
  mensaje: string
  tiempo: string
}

const NOTIFICACIONES_MOCK: Notificacion[] = [
  { id: 1, mensaje: "Carlos Álvarez tiene 45h — supera el límite de 40h semanales", tiempo: "Hace 2 h" },
  { id: 2, mensaje: "Aula 203 ocupada en jornada mañana por ficha 2995403", tiempo: "Hace 4 h" },
]

type HeaderProps = {
  alertasViewed: boolean
  onViewAlertas: () => void
  onToggleSidebar: () => void
}

export default function Header({ alertasViewed, onViewAlertas, onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isPerfilOpen, setIsPerfilOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/auth")
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) onViewAlertas()
  }

  return (
    <header 
      className="h-16 border-b-2 border-sena flex items-center justify-between px-4 md:px-8 sticky top-0 z-50 shadow-sm"
      style={{ backgroundColor: '#ffffff' }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger Menu Button (Mobile Only) */}
        <button
          onClick={onToggleSidebar}
          className="p-2 text-gray-500 hover:text-sena hover:bg-gray-100 rounded-lg md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="hidden sm:inline font-medium text-gray-700">CONINS</span>
          <span className="hidden sm:inline text-gray-300">·</span>
          <span className="text-sena font-semibold">Inicio</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleToggle}
            className="relative text-gray-500 hover:text-sena transition-colors"
          >
            <Bell className="w-5 h-5" />
            {!alertasViewed && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-sena text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {NOTIFICACIONES_MOCK.length}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Notificaciones</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {NOTIFICACIONES_MOCK.map((notif) => (
                  <div key={notif.id} className="px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${alertasViewed ? "bg-gray-300" : "bg-green-500"}`} />
                      <div>
                        <p className="text-sm text-gray-700">{notif.mensaje}</p>
                        <p className="text-xs text-gray-400 mt-1">{notif.tiempo}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => {
                    router.push("/alertas")
                    setIsOpen(false)
                  }}
                  className="text-xs text-sena font-medium hover:underline w-full text-center"
                >
                  Ver todas las alertas
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
          <button
            onClick={() => setIsPerfilOpen(true)}
            className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
          >
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {user?.nombre || "Usuario"}
              </p>
              <p className="text-xs text-gray-500">
                {user?.roles?.[0] || "Rol"}
              </p>
            </div>
            <div className="w-9 h-9 bg-sena/10 rounded-full flex items-center justify-center text-sena font-semibold text-sm">
              {user?.nombre?.charAt(0) || "U"}
            </div>
          </button>
          
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <PerfilModal isOpen={isPerfilOpen} onClose={() => setIsPerfilOpen(false)} />
    </header>
  )
}
