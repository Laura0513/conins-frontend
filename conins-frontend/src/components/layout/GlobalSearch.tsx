import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/router"
import { Search, X, Users, BookOpen, Building2, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { useDebounce } from "@/lib/useDebounce"

type SearchResult = {
  id: number
  tipo: "instructor" | "grupo" | "ambiente"
  titulo: string
  subtitulo: string
}

export default function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query, 250)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Cache de datos
  const [cache, setCache] = useState<{
    instructores: any[]
    fichas: any[]
    ambientes: any[]
    loaded: boolean
  }>({ instructores: [], fichas: [], ambientes: [], loaded: false })

  // Cargar datos al abrir por primera vez
  const loadCache = useCallback(async () => {
    if (cache.loaded) return
    try {
      const [resInst, resFichas, resAmb] = await Promise.allSettled([
        api.instructors.getAll(),
        api.fichas.getAll(),
        api.ambientes.getAll(),
      ])
      setCache({
        instructores: resInst.status === "fulfilled" ? resInst.value.data || [] : [],
        fichas: resFichas.status === "fulfilled" ? resFichas.value.data || [] : [],
        ambientes: resAmb.status === "fulfilled" ? resAmb.value.data || [] : [],
        loaded: true,
      })
    } catch {
      setCache((prev) => ({ ...prev, loaded: true }))
    }
  }, [cache.loaded])

  // Buscar en cache
  useEffect(() => {
    if (!debouncedQuery.trim() || !cache.loaded) {
      setResults([])
      return
    }

    setLoading(true)
    const q = debouncedQuery.toLowerCase()
    const found: SearchResult[] = []

    // Instructores
    cache.instructores
      .filter((i: any) => i.nombre?.toLowerCase().includes(q) || i.email?.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach((i: any) => {
        found.push({
          id: i.id,
          tipo: "instructor",
          titulo: i.nombre,
          subtitulo: `${i.email} · ${i.tipo_area || ""}`,
        })
      })

    // Grupos
    cache.fichas
      .filter((f: any) => {
        const numero = String(f.numero_grupo || f.ficha_numero || "")
        const programa = f.programa_nombre || f.programa || ""
        return numero.toLowerCase().includes(q) || programa.toLowerCase().includes(q)
      })
      .slice(0, 5)
      .forEach((f: any) => {
        found.push({
          id: f.id,
          tipo: "grupo",
          titulo: `Grupo ${f.numero_grupo || f.ficha_numero}`,
          subtitulo: f.programa_nombre || f.programa || "",
        })
      })

    // Ambientes
    cache.ambientes
      .filter((a: any) => a.nombre?.toLowerCase().includes(q) || a.tipo?.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach((a: any) => {
        found.push({
          id: a.id,
          tipo: "ambiente",
          titulo: a.nombre,
          subtitulo: `${a.tipo || ""} · Cap. ${a.capacidad ?? "—"}`,
        })
      })

    setResults(found)
    setSelectedIndex(0)
    setLoading(false)
  }, [debouncedQuery, cache])

  // Abrir/cerrar
  const handleOpen = () => {
    setOpen(true)
    loadCache()
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleClose = () => {
    setOpen(false)
    setQuery("")
    setResults([])
  }

  // Clic fuera cierra
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        if (open) handleClose()
        else handleOpen()
      }
      if (e.key === "Escape" && open) handleClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open])

  // Navegar resultados con teclado
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && results[selectedIndex]) {
      navigateTo(results[selectedIndex])
    }
  }

  const navigateTo = (result: SearchResult) => {
    handleClose()
    if (result.tipo === "instructor") router.push("/instructores")
    else if (result.tipo === "grupo") router.push("/fichas")
    else if (result.tipo === "ambiente") router.push("/ambientes")
  }

  const getIcon = (tipo: string) => {
    if (tipo === "instructor") return <Users className="w-4 h-4 text-sena" />
    if (tipo === "grupo") return <BookOpen className="w-4 h-4 text-blue-500" />
    return <Building2 className="w-4 h-4 text-orange-500" />
  }

  const getLabel = (tipo: string) => {
    if (tipo === "instructor") return "Instructor"
    if (tipo === "grupo") return "Grupo"
    return "Ambiente"
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="hidden md:inline">Buscar...</span>
        <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-white border border-gray-300 rounded text-gray-400">
          Ctrl+K
        </kbd>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh] bg-black/30 backdrop-blur-sm">
      <div
        ref={containerRef}
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar instructor, grupo o ambiente..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none"
            autoComplete="off"
          />
          <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="py-8 flex items-center justify-center text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : query.trim() && results.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              Sin resultados para &ldquo;{query}&rdquo;
            </div>
          ) : results.length > 0 ? (
            results.map((r, i) => (
              <button
                key={`${r.tipo}-${r.id}`}
                onClick={() => navigateTo(r)}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  i === selectedIndex ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  {getIcon(r.tipo)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.titulo}</p>
                  <p className="text-xs text-gray-500 truncate">{r.subtitulo}</p>
                </div>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                  {getLabel(r.tipo)}
                </span>
              </button>
            ))
          ) : (
            <div className="py-6 text-center text-sm text-gray-400">
              Escribe para buscar instructores, grupos o ambientes
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-4 text-[10px] text-gray-400">
          <span><kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded font-mono">↑↓</kbd> Navegar</span>
          <span><kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded font-mono">Enter</kbd> Ir</span>
          <span><kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded font-mono">Esc</kbd> Cerrar</span>
        </div>
      </div>
    </div>
  )
}
