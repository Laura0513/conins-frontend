import { useState, useRef } from "react"
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
  Download,
  X,
} from "lucide-react"

type ErrorFila = {
  fila: number
  mensaje: string
}

type ResumenHoja = {
  hoja: string
  filas: number
  creados: number
  errores: ErrorFila[]
}

type ResultadoImportacion = {
  resumen: ResumenHoja[]
}

export default function ImportarPage() {
  const { user, loading: authLoading } = useProtectedRoute()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [archivo, setArchivo] = useState<File | null>(null)
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const rol = user?.roles?.[0]?.trim() || ""
  const esAdmin = ["Administrador", "Coordinadora Academica", "Asistente Coordinacion"].includes(rol)

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      showToast("Solo se permiten archivos Excel (.xlsx)", "error")
      return
    }
    setArchivo(file)
    setResultado(null)
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

  const handleImportar = async () => {
    if (!archivo) return
    setCargando(true)
    setResultado(null)

    try {
      const base64 = await fileToBase64(archivo)
      const res = await api.importar.cargar(base64)
      setResultado(res.data)

      const totalCreados = (res.data.resumen || []).reduce((s: number, h: ResumenHoja) => s + h.creados, 0)
      const totalErrores = (res.data.resumen || []).reduce((s: number, h: ResumenHoja) => s + h.errores.length, 0)

      if (totalErrores === 0) {
        showToast(`Importación exitosa: ${totalCreados} registros creados`, "success")
      } else {
        showToast(`${totalCreados} creados, ${totalErrores} con errores`, "info")
      }
    } catch (err: any) {
      showToast(err.message || "Error al importar archivo", "error")
    } finally {
      setCargando(false)
    }
  }

  const limpiar = () => {
    setArchivo(null)
    setResultado(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
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
          <p className="text-gray-500 text-sm">Carga masiva desde archivo Excel (.xlsx)</p>
        </div>

        {/* Instrucciones */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Formato del archivo</h3>
          <p className="text-sm text-gray-600 mb-3">
            El archivo debe tener hojas con estos nombres exactos (incluye solo las que necesites):
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900 mb-1">Hoja "Instructores"</p>
              <p className="text-xs text-gray-500">nombre, email, tipo_area, codigos_competencia (opcional, separados por coma)</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900 mb-1">Hoja "Grupos"</p>
              <p className="text-xs text-gray-500">numero_grupo, codigo_programa, jornada, ambiente, lider_email, etapa, fechas</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900 mb-1">Hoja "Asignaciones"</p>
              <p className="text-xs text-gray-500">instructor_email, numero_grupo, codigos_competencia, jornada, es_lider</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900 mb-1">Hoja "Horarios"</p>
              <p className="text-xs text-gray-500">instructor_email, numero_grupo, codigo_competencia, dia_semana, hora_inicio, hora_fin, jornada, semana</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Se procesan en orden: Instructores → Grupos → Asignaciones → Horarios. Las filas válidas se crean aunque otras tengan errores.</p>
        </div>

        {/* Zona de carga */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
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
                <button
                  onClick={limpiar}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cambiar archivo
                </button>
                <button
                  onClick={handleImportar}
                  disabled={cargando}
                  className="px-4 py-2 bg-sena hover:bg-sena/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {cargando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Importar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Resultados */}
        {resultado && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Resultado de la importación</h2>

            {/* Resumen general */}
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
                      {tieneErrores ? (
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
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

            {/* Detalle de errores */}
            {resultado.resumen.some((h) => h.errores.length > 0) && (
              <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-red-50 border-b border-red-200">
                  <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Detalle de errores
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
                              <span className="text-red-500 font-mono text-xs bg-red-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                                Fila {err.fila}
                              </span>
                              <span className="text-gray-700">{err.mensaje}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
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
