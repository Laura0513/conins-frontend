import { useState, useRef, useEffect } from "react"
import { ChevronDown, X } from "lucide-react"

type Option = {
  value: string
  label: string
}

type MultiSelectProps = {
  label: string
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  allLabel?: string
}

export default function MultiSelect({
  label,
  options,
  selected,
  onChange,
  allLabel,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const allSelected = selected.length === 0
  const displayText = allSelected
    ? `${label}: ${allLabel || "Todos"}`
    : selected.length === 1
    ? `${label}: ${options.find((o) => o.value === selected[0])?.label || selected[0]}`
    : `${label}: ${selected.length} seleccionados`

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`border rounded-lg px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors w-full min-w-[140px] ${
          isOpen
            ? "border-sena ring-2 ring-sena/50"
            : selected.length > 0
            ? "border-sena/50 bg-sena/5"
            : "border-gray-300 bg-white"
        }`}
      >
        <span className="flex-1 truncate text-gray-700">{displayText}</span>
        {selected.length > 0 && (
          <button
            onClick={clearAll}
            className="p-0.5 rounded-full hover:bg-gray-200 transition-colors"
            title="Limpiar filtro"
          >
            <X className="w-3 h-3 text-gray-400" />
          </button>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto">
          {/* "Todos" option */}
          <button
            type="button"
            onClick={() => onChange([])}
            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors ${
              allSelected ? "text-sena font-medium" : "text-gray-700"
            }`}
          >
            <div className={`w-4 h-4 rounded border flex items-center justify-center ${
              allSelected ? "bg-sena border-sena" : "border-gray-300"
            }`}>
              {allSelected && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            {allLabel || "Todos"}
          </button>

          <div className="border-t border-gray-100 my-1" />

          {options.map((opt) => {
            const isChecked = selected.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleOption(opt.value)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                  isChecked ? "text-sena font-medium" : "text-gray-700"
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  isChecked ? "bg-sena border-sena" : "border-gray-300"
                }`}>
                  {isChecked && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
