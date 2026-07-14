import { Bell, LogOut, Menu, Check, Loader2 } from "lucide-react"
import { useRouter } from "next/router"
import { useAuth } from "@/lib/AuthContext"
import { api } from "@/lib/api"
import { useState, useRef, useEffect, useCallback } from "react"

type Notificacion = {
  id: number
  mensaje: string
  tipo: string
  leida: boolean
  created_at: string
}

function tiempoRelativo(fecha: string) {
  const ahora = Date.now()
  const creado = new Date(fecha).getTime()
  const diff = ahora - creado
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Ahora"
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  const dias = Math.floor(hrs / 24)
  if (dias === 1) return "Ayer"
  return `Hace ${dias} dias`
}

type HeaderProps = {
  alertasViewed: boolean
  onViewAlertas: () => void
  onToggleSidebar: () => void
}

export default function Header({ alertasViewed, onViewAlertas, onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [noLeidasCount, setNoLeidasCount] = useState(0)
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Cargar conteo de no leídas al montar y cada 30s
  const cargarConteo = useCallback(async () => {
    try {
      const res = await api.notificaciones.getNoLeidasCount()
      setNoLeidasCount(res.data?.count ?? 0)
    } catch {
      // Silencioso — si falla no rompe nada
    }
  }, [])

  useEffect(() => {
    if (user) {
      cargarConteo()
      const interval = setInterval(cargarConteo, 30000)
      return () => clearInterval(interval)
    }
  }, [user, cargarConteo])

  // Cargar notificaciones al abrir el dropdown
  const cargarNotificaciones = async () => {
    setLoadingNotifs(true)
    try {
      const res = await api.notificaciones.getMis()
      setNotificaciones((res.data || []).slice(0, 8))
    } catch {
      setNotificaciones([])
    } finally {
      setLoadingNotifs(false)
    }
  }

  const handleToggle = () => {
    const abriendo = !isOpen
    setIsOpen(abriendo)
    if (abriendo) {
      cargarNotificaciones()
      onViewAlertas()
    }
  }

  const handleMarcarLeida = async (id: number) => {
    try {
      await api.notificaciones.marcarLeida(id)
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      )
      setNoLeidasCount((prev) => Math.max(0, prev - 1))
    } catch {
      // Silencioso
    }
  }

  const handleMarcarTodas = async () => {
    try {
      await api.notificaciones.marcarTodasLeidas()
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
      setNoLeidasCount(0)
    } catch {
      // Silencioso
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/auth")
  }

  // Nombre de la página actual para el breadcrumb
  const pageName = (() => {
    const path = router.pathname
    if (path === "/") return "Inicio"
    const name = path.replace("/", "")
    return name.charAt(0).toUpperCase() + name.slice(1)
  })()

  return (
    <header
      className="h-16 border-b-2 border-sena flex items-center justify-between px-4 md:px-8 sticky top-0 z-50 shadow-sm"
      style={{ backgroundColor: "#ffffff" }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-gray-500 hover:text-sena hover:bg-gray-100 rounded-lg md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="hidden sm:inline font-medium text-gray-700">CONINS</span>
          <span className="hidden sm:inline text-gray-300">·</span>
          <span className="text-sena font-semibold">{pageName}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Notificaciones */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleToggle}
            className="relative text-gray-500 hover:text-sena transition-colors"
          >
            <Bell className="w-5 h-5" />
            {noLeidasCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-sena text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {noLeidasCount > 99 ? "99+" : noLeidasCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
              {/* Header del dropdown */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">
                  Notificaciones
                  {noLeidasCount > 0 && (
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      {noLeidasCount} sin leer
                    </span>
                  )}
                </h3>
                {noLeidasCount > 0 && (
                  <button
                    onClick={handleMarcarTodas}
                    className="text-xs text-sena hover:underline font-medium"
                  >
                    Marcar todas
                  </button>
                )}
              </div>

              {/* Lista */}
              <div className="max-h-80 overflow-y-auto">
                {loadingNotifs ? (
                  <div className="py-8 flex items-center justify-center text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : notificaciones.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">
                    No hay notificaciones
                  </div>
                ) : (
                  notificaciones.map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${
                        notif.leida ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                            notif.leida ? "bg-gray-300" : "bg-sena"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700">{notif.mensaje}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-400">
                              {notif.created_at ? tiempoRelativo(notif.created_at) : ""}
                            </p>
                            {!notif.leida && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarcarLeida(notif.id)
                                }}
                                className="text-xs text-sena hover:underline flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Leida
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
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

        {/* Usuario */}
        <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">
              {user?.nombre || "Usuario"}
            </p>
            <p className="text-xs text-gray-500">{user?.roles?.[0] || "Rol"}</p>
          </div>
          <div className="w-9 h-9 bg-sena/10 rounded-full flex items-center justify-center text-sena font-semibold text-sm">
            {user?.nombre?.charAt(0) || "U"}
          </div>

          <button
            onClick={handleLogout}
            className="ml-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Cerrar sesion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
