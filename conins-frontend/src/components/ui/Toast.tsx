import { useEffect, useState } from "react"
import { CheckCircle, XCircle, X, AlertCircle } from "lucide-react"

type ToastType = "success" | "error" | "info"

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Espera a que termine la animación
    }, 4000) // Dura 4 segundos
    return () => clearTimeout(timer)
  }, [onClose])

  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  }

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <XCircle className="w-5 h-5 text-red-600" />,
    info: <AlertCircle className="w-5 h-5 text-blue-600" />,
  }

  return (
    <div
      className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg transition-all duration-300 transform ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      } ${styles[type]}`}
    >
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={() => { setIsVisible(false); setTimeout(onClose, 300) }} className="ml-2 opacity-60 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
