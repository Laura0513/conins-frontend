import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { useAuth } from "@/lib/AuthContext"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user } = useAuth()
  const rol = user?.roles?.[0] || "Admin"
  
  // State for mobile sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // Inicializar estado desde localStorage para que persista entre cambios de página
  const [alertasViewed, setAlertasViewed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("alertasViewed") === "true"
    }
    return false
  })

  // Sincronizar con localStorage cuando cambie el estado
  useEffect(() => {
    localStorage.setItem("alertasViewed", String(alertasViewed))
  }, [alertasViewed])

  // Si entra a la página de alertas, marcar como vistas automáticamente
  useEffect(() => {
    if (router.pathname === "/alertas") {
      setAlertasViewed(true)
    }
  }, [router.pathname])

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}
      
      <Sidebar 
        alertasViewed={alertasViewed} 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar}
        rol={rol}
      />
      
      <div className="flex flex-col flex-1 md:ml-64">
        <Header
          alertasViewed={alertasViewed}
          onViewAlertas={() => setAlertasViewed(true)}
          onToggleSidebar={toggleSidebar}
        />
        <main className="flex-1 p-4 md:p-8">{children}</main>
        <Footer />
      </div>
    </div>
  )
}
