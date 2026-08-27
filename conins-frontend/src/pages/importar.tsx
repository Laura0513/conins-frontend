import { useState, useRef, useEffect } from "react"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import { PageSkeleton } from "@/components/ui/Skeleton"
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Eye,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react"

type ErrorFila = { fila: number; mensaje: string }
type ResumenHoja = { hoja: string; filas: number; creados: number; errores: ErrorFila[] }
type ResultadoImportacion = { resumen: ResumenHoja[] }

type ErrorPreview = { hoja: string; fila: number; entidad: string; valor: string; motivo: string }
type InstructorNuevo = { nombre: string; email_sugerido: string; tipo_area: string }
type BajaAsignacion = { instructor_email: string; numero_grupo: string }

type PreviewData = {
  formato: string
  resumen: { instructores: number; grupos: number; asignaciones: number; horarios: number }
  nuevos: { ambientes: string[]; instructores: InstructorNuevo[] }
  errores: ErrorPreview[]
  posible_baja: { asignaciones: BajaAsignacion[] }
  plantilla_base64: string
}

type Programa = { id: number; nombre: string; codigo: string }

export default function ImportarPage() {
  const { user, loading: authLoading } = useProtectedRoute()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [archivo, setArchivo] = useState<File | null>(null)
  const [archivoBase64, setArchivoBase64] = useState<string>("")
  const [cargando, setCargando] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // Programa selector
  const [programas, setProgramas] = useState<Programa[]>([])
  const [programaCodigo, setProgramaCodigo] = useState("")
  const [loadingProgramas, setLoadingProgramas] = useState(false)

  // Checkboxes para ambientes nuevos
  const [ambientesAprobados, setAmbientesAprobados] = useState<string[]>([])

  // Secciones colapsables
  const [seccionAbierta, setSeccionAbierta] = useState<Record<string, boolean>>({
    creara: true,
    nuevos: true,
    errores: true,
    baja: true,
  })

  const rol = user?.roles?.[0]?.trim() || ""
  const esAdmin = ["Administrador", "Coordinadora Academica", "Asistente Coordinacion"].includes(rol)

  useEffect(() => {
    if (esAdmin) {
      setLoadingProgramas(true)
      api.programs.getAll()
        .then((res) => setProgramas(res.data || []))
        .catch(() => setProgramas([]))
        .finally(() => setLoadingProgramas(false))
    }
  }, [esAdmin])

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      showToast("Solo se permiten archivos Excel (.xlsx)", "error")
      return
    }
    setArchivo(file)
    setPreview(null)
    setResultado(null)
    const base64 = await fileToBase64(file)
    setArchivoBase64(base64)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handlePreview = async () => {
    if (!archivoBase64) return
    setPreviewing(true)
    setPreview(null)
    setResultado(null)

    try {
      const res = await api.importar.preview(archivoBase64, programaCodigo || undefined)
      const data = res.data as PreviewData
      setPreview(data)
      setAmbientesAprobados(data.nuevos?.ambientes || [])
      showToast("Previsualización lista — revisa antes de confirmar", "info")
    } catch (err: any) {
      showToast(err.message || "Error al previsualizar", "error")
    } finally {
      setPreviewing(false)
    }
  }

  const handleConfirmar = async () => {
    if (!preview?.plantilla_base64) return
    setCargando(true)
    setResultado(null)

    try {
      const res = await api.importar.cargar(preview.plantilla_base64, ambientesAprobados.length > 0 ? ambientesAprobados : undefined)
      setResultado(res.data)

      const totalCreados = (res.data.resumen || []).reduce((s: number, h: ResumenHoja) => s + h.creados, 0)
      const totalErrores = (res.data.resumen || []).reduce((s: number, h: ResumenHoja) => s + h.errores.length, 0)

      if (totalErrores === 0) {
        showToast(`Importación exitosa: ${totalCreados} registros creados`, "success")
      } else {
        showToast(`${totalCreados} creados, ${totalErrores} con errores — revisa el detalle`, "info")
      }
    } catch (err: any) {
      showToast(err.message || "Error al importar archivo", "error")
    } finally {
      setCargando(false)
    }
  }

  const limpiar = () => {
    setArchivo(null)
    setArchivoBase64("")
    setPreview(null)
    setResultado(null)
    setProgramaCodigo("")
    setAmbientesAprobados([])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const toggleSeccion = (key: string) => {
    setSeccionAbierta((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleAmbiente = (nombre: string) => {
    setAmbientesAprobados((prev) =>
      prev.includes(nombre) ? prev.filter((a) => a !== nombre) : [...prev, nombre]
    )
  }

  if (authLoading || !user) return <PageSkeleton />

  if (!esAdmin) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">Sin permisos</h2>
            <p className="text-gray-500">Solo los administradores pueden importar datos.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Importar datos</h1>
          <p className="text-gray-500 text-sm">Sube el Excel del líder o la plantilla de 4 hojas. Se previsualiza antes de cargar.</p>
        </div>

        {/* Paso 1: Subir archivo + programa */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">1. Seleccionar archivo y programa</h3>

          {/* Selector de programa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Programa (obligatorio para Excel crudo)</label>
            <select
              value={programaCodigo}
              onChange={(e) => setProgramaCodigo(e.target.value)}
              disabled={loadingProgramas}
              className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 bg-white"
            >
              <option value="">Seleccionar programa...</option>
              {programas.map((p) => (
                <option key={p.id} value={p.codigo}>{p.codigo} — {p.nombre}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Si subes la plantilla de 4 hojas, el programa es opcional.</p>
          </div>

          {/* Zona de carga */}
          {!archivo ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                dragOver ? "border-sena bg-sena/5" : "border-gray-300 hover:border-sena/50 hover:bg-gray-50"
              }`}
            >
              <Upload className={`w-10 h-10 mx-auto mb-3 ${dragOver ? "text-sena" : "text-gray-400"}`} />
              <p className="text-sm font-medium text-gray-700 mb-1">
                Arrastra tu archivo aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-gray-400">Solo archivos .xlsx</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{archivo.name}</p>
                  <p className="text-xs text-gray-400">{(archivo.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={limpiar} className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  Cambiar
                </button>
                <button
                  onClick={handlePreview}
                  disabled={previewing}
                  className="px-4 py-2 bg-sena hover:bg-sena/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {previewing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Analizando...</>
                  ) : (
                    <><Eye className="w-4 h-4" /> Previsualizar</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Paso 2: Previsualización */}
        {preview && !resultado && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">2. Revisar antes de cargar</h2>
              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                Formato: {preview.formato === "crudo" ? "Excel crudo (normalizado)" : "Plantilla"}
              </span>
            </div>

            {/* Bloque 1: Se creará */}
            <div className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
              <button onClick={() => toggleSeccion("creara")} className="w-full px-5 py-3 bg-green-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-green-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Se creará automáticamente
                </h3>
                {seccionAbierta.creara ? <ChevronUp className="w-4 h-4 text-green-600" /> : <ChevronDown className="w-4 h-4 text-green-600" />}
              </button>
              {seccionAbierta.creara && (
                <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Instructores", val: preview.resumen.instructores },
                    { label: "Grupos", val: preview.resumen.grupos },
                    { label: "Asignaciones", val: preview.resumen.asignaciones },
                    { label: "Horarios", val: preview.resumen.horarios },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{item.val}</p>
                      <p className="text-xs text-gray-500">{item.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bloque 2: Nuevos — requieren aprobación */}
            {(preview.nuevos.ambientes.length > 0 || preview.nuevos.instructores.length > 0) && (
              <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
                <button onClick={() => toggleSeccion("nuevos")} className="w-full px-5 py-3 bg-blue-50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                    <Info className="w-4 h-4" /> Nuevos — requieren aprobación
                  </h3>
                  {seccionAbierta.nuevos ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
                </button>
                {seccionAbierta.nuevos && (
                  <div className="p-5 space-y-4">
                    {preview.nuevos.ambientes.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Ambientes nuevos</p>
                        <div className="space-y-2">
                          {preview.nuevos.ambientes.map((amb) => (
                            <label key={amb} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                              <input
                                type="checkbox"
                                checked={ambientesAprobados.includes(amb)}
                                onChange={() => toggleAmbiente(amb)}
                                className="rounded border-gray-300 text-sena focus:ring-sena/50"
                              />
                              <span className="text-sm text-gray-700">{amb}</span>
                              <span className="text-xs text-blue-500">— se creará al confirmar</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    {preview.nuevos.instructores.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Instructores nuevos (se crean automáticamente)</p>
                        <div className="space-y-1.5">
                          {preview.nuevos.instructores.map((inst, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 bg-blue-50 rounded text-sm">
                              <span className="font-medium text-gray-800">{inst.nombre}</span>
                              <span className="text-gray-500">{inst.email_sugerido}</span>
                              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{inst.tipo_area}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bloque 3: Errores */}
            {preview.errores.length > 0 && (
              <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
                <button onClick={() => toggleSeccion("errores")} className="w-full px-5 py-3 bg-red-50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Errores — {preview.errores.length} fila(s) no se cargarán
                  </h3>
                  {seccionAbierta.errores ? <ChevronUp className="w-4 h-4 text-red-600" /> : <ChevronDown className="w-4 h-4 text-red-600" />}
                </button>
                {seccionAbierta.errores && (
                  <div className="p-5">
                    <p className="text-xs text-red-600 mb-3">Corrige estas filas en el Excel y vuelve a importar. Las filas válidas sí se cargarán.</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 border-b">
                          <tr>
                            <th className="py-2 pr-3">Hoja</th>
                            <th className="py-2 pr-3">Fila</th>
                            <th className="py-2 pr-3">Entidad</th>
                            <th className="py-2 pr-3">Valor</th>
                            <th className="py-2">Motivo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {preview.errores.map((err, i) => (
                            <tr key={i}>
                              <td className="py-2 pr-3 text-gray-700">{err.hoja}</td>
                              <td className="py-2 pr-3">
                                <span className="text-red-500 font-mono text-xs bg-red-50 px-1.5 py-0.5 rounded">{err.fila}</span>
                              </td>
                              <td className="py-2 pr-3 text-gray-500">{err.entidad}</td>
                              <td className="py-2 pr-3 text-gray-700 max-w-[200px] truncate" title={err.valor}>{err.valor}</td>
                              <td className="py-2 text-gray-600">{err.motivo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bloque 4: Posible baja */}
            {preview.posible_baja.asignaciones.length > 0 && (
              <div className="bg-white rounded-xl border border-yellow-200 shadow-sm overflow-hidden">
                <button onClick={() => toggleSeccion("baja")} className="w-full px-5 py-3 bg-yellow-50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-yellow-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Posible baja — {preview.posible_baja.asignaciones.length} asignación(es) ya no aparecen
                  </h3>
                  {seccionAbierta.baja ? <ChevronUp className="w-4 h-4 text-yellow-600" /> : <ChevronDown className="w-4 h-4 text-yellow-600" />}
                </button>
                {seccionAbierta.baja && (
                  <div className="p-5">
                    <p className="text-xs text-yellow-700 mb-3">Estas asignaciones existen en el sistema pero no aparecen en la planeación nueva. Por ahora es solo informativo — revísalas.</p>
                    <div className="space-y-1.5">
                      {preview.posible_baja.asignaciones.map((a, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 bg-yellow-50 rounded text-sm">
                          <span className="text-gray-700">{a.instructor_email}</span>
                          <span className="text-gray-400">→</span>
                          <span className="font-medium text-gray-800">Grupo {a.numero_grupo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Botón confirmar */}
            <div className="flex items-center justify-end gap-3">
              <button onClick={limpiar} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleConfirmar}
                disabled={cargando}
                className="px-6 py-2.5 bg-sena hover:bg-sena/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {cargando ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Cargando...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Confirmar e importar</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Resultado final */}
        {resultado && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Resultado de la importación</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {resultado.resumen.map((hoja) => {
                const tieneErrores = hoja.errores.length > 0
                const todoBien = hoja.errores.length === 0 && hoja.creados > 0
                return (
                  <div
                    key={hoja.hoja}
                    className={`bg-white rounded-xl border shadow-sm p-4 ${
                      tieneErrores ? "border-yellow-300" : todoBien ? "border-green-300" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {tieneErrores ? <AlertTriangle className="w-5 h-5 text-yellow-500" /> : <CheckCircle className="w-5 h-5 text-green-500" />}
                      <h3 className="text-sm font-bold text-gray-900">{hoja.hoja}</h3>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-500">Filas procesadas: <span className="font-medium text-gray-900">{hoja.filas}</span></p>
                      <p className="text-gray-500">Creados: <span className="font-medium text-green-600">{hoja.creados}</span></p>
                      {hoja.errores.length > 0 && (
                        <p className="text-gray-500">Errores: <span className="font-medium text-red-600">{hoja.errores.length}</span></p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {resultado.resumen.some((h) => h.errores.length > 0) && (
              <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-red-50 border-b border-red-200">
                  <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Detalle de errores
                  </h3>
                  <p className="text-xs text-red-600 mt-0.5">Corrige estas filas en el Excel y vuelve a importar. Las filas válidas ya se crearon.</p>
                </div>
                <div className="divide-y divide-red-100">
                  {resultado.resumen
                    .filter((h) => h.errores.length > 0)
                    .map((hoja) => (
                      <div key={hoja.hoja} className="px-5 py-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Hoja: {hoja.hoja}</p>
                        <div className="space-y-1.5">
                          {hoja.errores.map((err, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-red-500 font-mono text-xs bg-red-50 px-1.5 py-0.5 rounded whitespace-nowrap">Fila {err.fila}</span>
                              <span className="text-gray-700">{err.mensaje}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={limpiar} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Nueva importación
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
