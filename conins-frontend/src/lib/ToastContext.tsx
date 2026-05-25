import { createContext, useContext, useState, ReactNode } from "react"
import Toast from "@/components/ui/Toast"

type ToastType = "success" | "error" | "info"

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type })
  }

  const hideToast = () => {
    setToast(null)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast debe usarse dentro de ToastProvider")
  return context
}
