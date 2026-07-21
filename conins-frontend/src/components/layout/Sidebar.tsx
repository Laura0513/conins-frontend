import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  Building2,
  Bell,
  Search,
  UserCog,
  User,
  Layers,
  GraduationCap,
} from "lucide-react"
import { useAuth } from "@/lib/AuthContext"
import { api } from "@/lib/api"

type MenuItem = {
  name: string
  href: string
  icon: any
  showBadge?: boolean
}

const MENU_ADMIN: MenuItem[] = [
  { name: "Inicio", href: "/", icon: LayoutDashboard },
  { name: "Instructores", href: "/instructores", icon: Users },
  { name: "Ambientes", href: "/ambientes", icon: Building2 },
  { name: "Programas", href: "/programas", icon: GraduationCap },
  { name: "Grupos", href: "/fichas", icon: BookOpen },
  { name: "Competencias", href: "/gestion-competencias", icon: Layers },
  { name: "Asignaciones", href: "/asignaciones", icon: ClipboardList },
  { name: "Horarios", href: "/horarios", icon: Calendar },
  { name: "Alertas", href: "/alertas", icon: Bell, showBadge: true },
  { name: "Reportes", href: "/consultas", icon: Search },
  { name: "Usuarios", href: "/usuarios", icon: UserCog },
  { name: "Mi Perfil", href: "/perfil", icon: User },
]

const MENU_SUBDIRECTOR: MenuItem[] = [
  { name: "Inicio", href: "/", icon: LayoutDashboard },
  { name: "Instructores", href: "/instructores", icon: Users },
  { name: "Ambientes", href: "/ambientes", icon: Building2 },
  { name: "Programas", href: "/programas", icon: GraduationCap },
  { name: "Grupos", href: "/fichas", icon: BookOpen },
  { name: "Competencias", href: "/gestion-competencias", icon: Layers },
  { name: "Asignaciones", href: "/asignaciones", icon: ClipboardList },
  { name: "Horarios", href: "/horarios", icon: Calendar },
  { name: "Alertas", href: "/alertas", icon: Bell, showBadge: true },
  { name: "Reportes", href: "/consultas", icon: Search },
  { name: "Mi Perfil", href: "/perfil", icon: User },
]

const MENU_INSTRUCTOR: MenuItem[] = [
  { name: "Inicio", href: "/", icon: LayoutDashboard },
  { name: "Mis Horarios", href: "/horarios", icon: Calendar },
  { name: "Mis Asignaciones", href: "/asignaciones", icon: ClipboardList },
  { name: "Mis Grupos", href: "/fichas", icon: BookOpen },
  { name: "Mis Competencias", href: "/competencias", icon: Users },
  { name: "Alertas", href: "/alertas", icon: Bell, showBadge: true },
  { name: "Mi Perfil", href: "/perfil", icon: User },
]

function getMenuItems(rol: string) {
  const r = rol?.trim() || ""
  switch (r) {
    case "Instructor":
      return MENU_INSTRUCTOR
    case "Subdirector":
      return MENU_SUBDIRECTOR
    default:
      return MENU_ADMIN
  }
}

type SidebarProps = {
  alertasViewed: boolean
  isOpen: boolean
  onClose: () => void
  rol: string
}

export default function Sidebar({ alertasViewed, isOpen, onClose, rol }: SidebarProps) {
  const router = useRouter()
  const { user } = useAuth()
  const menuItems = getMenuItems(rol)
  const [alertasPendientes, setAlertasPendientes] = useState(0)

  const cargarAlertasPendientes = useCallback(async () => {
    try {
      const res = await api.alertas.getAll()
      const pendientes = (res.data || []).filter((a: any) => !a.atendida).length
      setAlertasPendientes(pendientes)
    } catch {
      setAlertasPendientes(0)
    }
  }, [])

  useEffect(() => {
    if (user) {
      cargarAlertasPendientes()
      const interval = setInterval(cargarAlertasPendientes, 60000)
      return () => clearInterval(interval)
    }
  }, [user, cargarAlertasPendientes])

  return (
    <aside className={`
      w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-40
      transition-transform duration-300 ease-in-out
      -translate-x-full md:translate-x-0
      ${isOpen ? 'translate-x-0' : ''}
    `}>
      {/* Logo y titulo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img src="/logoSena.png" alt="SENA" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="font-bold text-lg leading-tight text-gray-900">CONINS</h1>
            <p className="text-xs text-gray-500">CDMC · SENA</p>
          </div>
        </div>
      </div>

      {/* Menu de navegacion */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = router.pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-sena/10 text-sena shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
              {item.showBadge && alertasPendientes > 0 && !alertasViewed && (
                <span className="ml-auto bg-sena text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {alertasPendientes > 99 ? "99+" : alertasPendientes}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
