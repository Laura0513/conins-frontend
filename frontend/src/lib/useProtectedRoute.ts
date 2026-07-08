import { useEffect } from "react"
import { useRouter } from "next/router"
import { useAuth } from "@/lib/AuthContext"

export function useProtectedRoute() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth")
    }
  }, [user, loading, router])

  return { user, loading }
}
