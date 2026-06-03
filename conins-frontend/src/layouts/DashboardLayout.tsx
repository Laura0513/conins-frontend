import { useState } from "react"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [alertasViewed, setAlertasViewed] = useState(false)

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
