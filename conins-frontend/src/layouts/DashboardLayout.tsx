import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar alertasViewed={alertasViewed} />
      <div className="ml-64 flex flex-col min-h-screen">
        <Header
          alertasViewed={alertasViewed}
          onViewAlertas={() => setAlertasViewed(true)}
        />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
