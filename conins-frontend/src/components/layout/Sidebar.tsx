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
} from "lucide-react"

const menuItems = [
  { name: "Inicio", href: "/", icon: LayoutDashboard },
  { name: "Instructores", href: "/instructores", icon: Users },
  { name: "Ambientes", href: "/ambientes", icon: Building2 },
  { name: "Fichas", href: "/fichas", icon: BookOpen },
  { name: "Asignaciones", href: "/asignaciones", icon: ClipboardList },
  { name: "Horarios", href: "/horarios", icon: Calendar },
  { name: "Alertas", href: "/alertas", icon: Bell, badge: 2 },
  { name: "Reportes", href: "/consultas", icon: Search },
  { name: "Usuarios", href: "/usuarios", icon: UserCog },
]

type SidebarProps = {
  alertasViewed: boolean
}

export default function Sidebar({ alertasViewed }: SidebarProps) {
  const router = useRouter()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-sena/10 text-sena shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
              {item.badge && !alertasViewed && (
                <span className="ml-auto bg-sena text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer del sidebar */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">
          CONINS v0.1 · CDMC SENA
        </p>
      </div>
    </aside>
  )
}
