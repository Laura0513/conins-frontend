import { type LucideIcon, Inbox } from "lucide-react"

type EmptyStateProps = {
  icon?: LucideIcon
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({
  icon: Icon = Inbox,
  title = "Sin resultados",
  description = "No se encontraron datos con los filtros seleccionados.",
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-gray-100 rounded-full p-4 mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-gray-700 font-medium text-base mb-1">{title}</h3>
      <p className="text-gray-400 text-sm text-center max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 bg-sena hover:bg-sena/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
