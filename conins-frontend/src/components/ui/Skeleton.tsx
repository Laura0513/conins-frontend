/**
 * Componentes Skeleton para estados de carga
 * Reemplazan los spinners genéricos con animaciones que imitan la estructura real
 */

// Bloque skeleton base con animación pulse
function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

// Skeleton para tablas — imita filas con columnas
export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
}: {
  rows?: number
  columns?: number
  showHeader?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {showHeader && (
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <SkeletonBlock key={i} className="h-3 flex-1" />
          ))}
        </div>
      )}
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="px-6 py-4 flex items-center gap-4">
            {Array.from({ length: columns }).map((_, col) => (
              <SkeletonBlock
                key={col}
                className={`h-3 flex-1 ${col === 0 ? "max-w-[180px]" : col === columns - 1 ? "max-w-[100px]" : ""}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Skeleton para tarjetas de estadísticas (dashboard)
export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-8 w-8 rounded-lg" />
          </div>
          <SkeletonBlock className="h-7 w-16" />
          <SkeletonBlock className="h-2 w-32" />
        </div>
      ))}
    </div>
  )
}

// Skeleton para cards en grid
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-3 w-3/4" />
              <SkeletonBlock className="h-2 w-1/2" />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <SkeletonBlock className="h-2 w-full" />
            <SkeletonBlock className="h-2 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Skeleton para la página completa (auth loading)
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <SkeletonBlock className="h-10 w-10 rounded-full" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-sena animate-spin" />
        </div>
        <SkeletonBlock className="h-3 w-24" />
      </div>
    </div>
  )
}

// Skeleton para formularios/modales
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-4">
        <SkeletonBlock className="h-9 w-24 rounded-lg" />
        <SkeletonBlock className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  )
}

export default SkeletonBlock
