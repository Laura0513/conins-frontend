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
  ChevronDown,
  FileText,
  Shield,
  FileUp,
  ExternalLink,
} from "lucide-react"
import { useAuth } from "@/lib/AuthContext"
import { api } from "@/lib/api"

type MenuItem = {
  name: string
  href: string
  icon: any
  showBadge?: boolean
}

type MenuGroup = {
  label: string
  icon: any
  items: MenuItem[]
}

type SidebarEntry = MenuItem | MenuGroup

function isGroup(entry: SidebarEntry): entry is MenuGroup {
  return "items" in entry
}

// ─── Menú Admin / Coordinadora / Asistente ───
const MENU_ADMIN: SidebarEntry[] = [
  { name: "Inicio", href: "/", icon: LayoutDashboard },
  {
    label: "Gestión",
    icon: ClipboardList,
    items: [
      { name: "Asignaciones", href: "/asignaciones", icon: ClipboardList },
      { name: "Horarios", href: "/horarios", icon: Calendar },
      { name: "Instructores", href: "/instructores", icon: Users },
      { name: "Grupos", href: "/fichas", icon: BookOpen },
      { name: "Competencias y RAPs", href: "/gestion-competencias", icon: Layers },
      { name: "Ambientes", href: "/ambientes", icon: Building2 },
    ],
  },
  { name: "Importar datos", href: "/importar", icon: FileUp },
  { name: "Alertas", href: "/alertas", icon: Bell, showBadge: true },
  { name: "Reportes", href: "/consultas", icon: Search },
  { name: "Usuarios", href: "/usuarios", icon: UserCog },
  { name: "Mi Perfil", href: "/perfil", icon: User },
]

// ─── Menú Subdirector (sin Usuarios) ───
const MENU_SUBDIRECTOR: SidebarEntry[] = [
  { name: "Inicio", href: "/", icon: LayoutDashboard },
  {
    label: "Gestión",
    icon: ClipboardList,
    items: [
      { name: "Asignaciones", href: "/asignaciones", icon: ClipboardList },
      { name: "Horarios", href: "/horarios", icon: Calendar },
      { name: "Instructores", href: "/instructores", icon: Users },
      { name: "Grupos", href: "/fichas", icon: BookOpen },
      { name: "Competencias y RAPs", href: "/gestion-competencias", icon: Layers },
      { name: "Ambientes", href: "/ambientes", icon: Building2 },
    ],
  },
  { name: "Alertas", href: "/alertas", icon: Bell, showBadge: true },
  { name: "Reportes", href: "/consultas", icon: Search },
  { name: "Mi Perfil", href: "/perfil", icon: User },
]

// ─── Menú Instructor (sin acordeón) ───
const MENU_INSTRUCTOR: SidebarEntry[] = [
  { name: "Inicio", href: "/", icon: LayoutDashboard },
  { name: "Mis Horarios", href: "/horarios", icon: Calendar },
  { name: "Mis Asignaciones", href: "/asignaciones", icon: ClipboardList },
  { name: "Mis Grupos", href: "/fichas", icon: BookOpen },
  { name: "Mis Competencias", href: "/competencias", icon: Users },
  { name: "Alertas", href: "/alertas", icon: Bell, showBadge: true },
  { name: "Mi Perfil", href: "/perfil", icon: User },
]

function getMenuEntries(rol: string): SidebarEntry[] {
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
  const entries = getMenuEntries(rol)
  const [alertasPendientes, setAlertasPendientes] = useState(0)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const [enlaces, setEnlaces] = useState<{ id: number; nombre: string; url: string }[]>([])

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

      api.catalogo.getEnlaces()
        .then((res) => setEnlaces((res.data || []).filter((e: any) => e.activo)))
        .catch(() => setEnlaces([]))

      return () => clearInterval(interval)
    }
  }, [user, cargarAlertasPendientes])

  // Auto-abrir el grupo si la ruta actual está dentro de él
  useEffect(() => {
    entries.forEach((entry) => {
      if (isGroup(entry)) {
        const isChildActive = entry.items.some((item) => router.pathname === item.href)
        if (isChildActive) {
          setOpenGroups((prev) => ({ ...prev, [entry.label]: true }))
        }
      }
    })
  }, [router.pathname, entries])

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const renderItem = (item: MenuItem, nested = false) => {
    const isActive = router.pathname === item.href
    const Icon = item.icon

    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={onClose}
        className={`flex items-center gap-3 ${nested ? "px-3 py-2 ml-3 pl-6 border-l border-gray-200" : "px-4 py-3"} rounded-xl text-sm font-medium transition-all ${
          isActive
            ? "bg-sena/10 text-sena shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <Icon className={`${nested ? "w-4 h-4" : "w-5 h-5"}`} />
        <span>{item.name}</span>
        {item.showBadge && alertasPendientes > 0 && !alertasViewed && (
          <span className="ml-auto bg-sena text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {alertasPendientes > 99 ? "99+" : alertasPendientes}
          </span>
        )}
      </Link>
    )
  }

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
        {entries.map((entry) => {
          if (isGroup(entry)) {
            const expanded = openGroups[entry.label] ?? false
            const GroupIcon = entry.icon
            const hasActiveChild = entry.items.some((item) => router.pathname === item.href)

            return (
              <div key={entry.label}>
                <button
                  onClick={() => toggleGroup(entry.label)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    hasActiveChild
                      ? "bg-sena/5 text-sena"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <GroupIcon className="w-5 h-5" />
                  <span>{entry.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 ml-auto transition-transform duration-200 ${
                      expanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    expanded ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="space-y-0.5 pb-1">
                    {entry.items.map((item) => renderItem(item, true))}
                  </div>
                </div>
              </div>
            )
          }

          return renderItem(entry as MenuItem)
        })}
      </nav>

      {/* Enlaces externos */}
      {enlaces.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Enlaces</p>
          <div className="space-y-0.5">
            {enlaces.map((e) => (
              <a
                key={e.id}
                href={e.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{e.nombre}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
