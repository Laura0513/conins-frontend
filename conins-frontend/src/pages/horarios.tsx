import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useDebounce } from "@/lib/useDebounce"
import DashboardLayout from "@/layouts/DashboardLayout"
import { api } from "@/lib/api"
import { useToast } from "@/lib/ToastContext"
import { useProtectedRoute } from "@/lib/useProtectedRoute"
import { formatJornada } from "@/lib/terminology"
import { exportarHorariosPDF, exportarHorarioIndividualPDF } from "@/lib/exportPDF"
import CrearHorarioModal from "@/components/horarios/CrearHorarioModal"
import CrearBloqueHorarioModal from "@/components/horarios/CrearBloqueHorarioModal"
import EditarHorarioModal from "@/components/horarios/EditarHorarioModal"
import GrillaHorarios from "@/components/horarios/GrillaHorarios"
import DetailInstructorModal from "@/components/instructores/DetailInstructorModal"
import DetailFichaModal from "@/components/fichas/DetailFichaModal"
import VerAgendaAmbienteModal from "@/components/ambientes/VerAgendaAmbienteModal"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import { TableSkeleton, PageSkeleton } from "@/components/ui/Skeleton"
import EmptyState from "@/components/ui/EmptyState"
import MultiSelect from "@/components/ui/MultiSelect"
import {
  Search,
  Plus,
  Pencil,
  Power,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Clock,
  Ban,
  FileDown,
  LayoutGrid,
  List,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react"

type Horario = {
  id: number
  ficha_numero: string
  instructor_nombre: string
  competencia: string
  ambiente: string
  jornada: string
  tipo_actividad: string | null
  dias: string[]
  horas: string
  estado: string
  activo: boolean
  instructor_id?: number | null
  ficha_id?: number | null
  asignacion_id?: number | null
  competencia_id?: number | null
  ambiente_id?: number | null
  tipo_actividad_id?: number | null
  rap_id?: number | null
  rap_codigo?: string | null
  rap_descripcion?: string | null
}


export default function HorariosPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useProtectedRoute()
  const { showToast } = useToast()
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedHorario, setSelectedHorario] = useState<Horario | null>(null)

  // Accesos directos — modales de detalle
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false)
  const [selectedInstructor, setSelectedInstructor] = useState<{ id: number; nombre: string; email: string; tipo_area: string; activo: boolean; roles: string } | null>(null)
  const [isFichaModalOpen, setIsFichaModalOpen] = useState(false)
  const [selectedFicha, setSelectedFicha] = useState<any>(null)
  const [isAmbienteModalOpen, setIsAmbienteModalOpen] = useState(false)
  const [selectedAmbiente, setSelectedAmbiente] = useState<any>(null)

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: (motivo?: string) => void
    showMotivo?: boolean
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {}, showMotivo: false })

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search)
  const [paginaActual, setPaginaActual] = useState(1)
  const porPagina = 10
  const [filtroFicha, setFiltroFicha] = useState<string[]>([])
  const [filtroInstructor, setFiltroInstructor] = useState<string[]>([])
  const [filtroJornada, setFiltroJornada] = useState<string[]>([])
  const [filtroAmbiente, setFiltroAmbiente] = useState<string[]>([])
  const [filtroEstado, setFiltroEstado] = useState<string[]>([])
  const [vistaGrilla, setVistaGrilla] = useState(true)
  const [mostrarInactivos, setMostrarInactivos] = useState(false)
  const [filtroVista, setFiltroVista] = useState<"semana" | "dia" | "mes">("semana")
  const [exportandoMes, setExportandoMes] = useState(false)

  // Semana actual por defecto (lunes de esta semana en formato ISO)
  const getLunesActual = () => {
    const now = new Date()
    const day = now.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const lunes = new Date(now)
    lunes.setDate(now.getDate() + diff)
    return lunes.toISOString().split("T")[0]
  }
  const [semanaGrilla, setSemanaGrilla] = useState<string | undefined>(getLunesActual)
  const [horariosGrilla, setHorariosGrilla] = useState<Horario[]>([])
  const [loadingGrilla, setLoadingGrilla] = useState(false)

  const DIAS_ABREV_HOY = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
  const diaHoyAbrev = DIAS_ABREV_HOY[new Date().getDay()]

  // Obtener todos los lunes del mes actual
  const getLunesDelMes = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const lunes: string[] = []
    const d = new Date(year, month, 1)
    // Ir al primer lunes del mes (o antes si el mes empieza después del lunes)
    while (d.getDay() !== 1) d.setDate(d.getDate() - 1)
    // Recorrer semana a semana hasta salir del mes
    while (d.getMonth() <= month || (d.getMonth() === 0 && month === 11)) {
      lunes.push(d.toISOString().split("T")[0])
      d.setDate(d.getDate() + 7)
      if (d.getFullYear() > year || (d.getFullYear() === year && d.getMonth() > month)) {
        // Incluir la última semana si arranca en el mes
        break
      }
    }
    return lunes
  }

  const exportarMesPDF = async () => {
    setExportandoMes(true)
    try {
      const semanas = getLunesDelMes()
      const todas: Horario[] = []
      const idsVistos = new Set<number>()
      for (const sem of semanas) {
        const res = await api.horarios.getAll(sem)
        const data = (res.data || []) as Horario[]
        for (const h of data) {
          if (!idsVistos.has(h.id) && h.activo) {
            idsVistos.add(h.id)
            todas.push(h)
          }
        }
      }
      const mesLabel = new Date().toLocaleDateString("es-CO", { month: "long", year: "numeric" })
      exportarHorariosPDF(aplicarFiltros(todas), `Horarios del mes — ${mesLabel}`)
    } catch {
      showToast("Error al exportar horarios del mes", "error")
    } finally {
      setExportandoMes(false)
    }
  }

  const rol = user?.roles?.[0]?.trim() || ""
  const puedeEditar = !["Instructor", "Subdirector"].includes(rol)

  useEffect(() => {
    cargarHorarios()
  }, [])

  const cargarHorarios = async () => {
    setLoading(true)
    try {
      const res = await api.horarios.getAll(getLunesActual())
      setHorarios(res.data || [])
    } catch (err) {
      console.warn("Error cargando horarios:", err)
      setHorarios([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch horarios por semana para la grilla
  const cargarHorariosGrilla = async (semana?: string) => {
    setLoadingGrilla(true)
    try {
      const res = await api.horarios.getAll(semana)
      setHorariosGrilla(res.data || [])
    } catch (err) {
      console.warn("Error cargando horarios grilla:", err)
      setHorariosGrilla([])
    } finally {
      setLoadingGrilla(false)
    }
  }

  useEffect(() => {
    if (vistaGrilla) {
      cargarHorariosGrilla(semanaGrilla)
    }
  }, [vistaGrilla, semanaGrilla])

  const handleSemanaChange = (semana: string | undefined) => {
    setSemanaGrilla(semana)
  }

  const inactivosCount = horarios.filter((h) => !h.activo).length

  // Filtro compartido entre tabla y grilla
  const aplicarFiltros = (lista: Horario[]) => lista.filter((h) => {
    if (!mostrarInactivos && !h.activo) return false
    const texto = debouncedSearch.toLowerCase()
    const coincideBusqueda =
      h.ficha_numero.toLowerCase().includes(texto) ||
      h.instructor_nombre.toLowerCase().includes(texto)
    const coincideFicha = filtroFicha.length === 0 || filtroFicha.includes(h.ficha_numero)
    const coincideInstructor = filtroInstructor.length === 0 || filtroInstructor.includes(h.instructor_nombre)
    const coincideAmbiente = filtroAmbiente.length === 0 || filtroAmbiente.includes(h.ambiente || "")
    const coincideJornada = filtroJornada.length === 0 || filtroJornada.includes(h.jornada)
    const coincideEstado = filtroEstado.length === 0 || filtroEstado.includes(h.estado)
    return coincideBusqueda && coincideFicha && coincideInstructor && coincideAmbiente && coincideJornada && coincideEstado
  })

  const horariosGrillaFiltrados = aplicarFiltros(horariosGrilla)

  const listaFiltrada = horarios.filter((h) => {
    if (!mostrarInactivos && !h.activo) return false

    const texto = debouncedSearch.toLowerCase()
    const coincideBusqueda =
      h.ficha_numero.toLowerCase().includes(texto) ||
      h.instructor_nombre.toLowerCase().includes(texto)

    const coincideFicha = filtroFicha.length === 0 || filtroFicha.includes(h.ficha_numero)
    const coincideInstructor = filtroInstructor.length === 0 || filtroInstructor.includes(h.instructor_nombre)
    const coincideAmbiente = filtroAmbiente.length === 0 || filtroAmbiente.includes(h.ambiente || "")
    const coincideJornada = filtroJornada.length === 0 || filtroJornada.includes(h.jornada)
    const coincideEstado = filtroEstado.length === 0 || filtroEstado.includes(h.estado)

    return coincideBusqueda && coincideFicha && coincideInstructor && coincideAmbiente && coincideJornada && coincideEstado
  })

  const totalPaginas = Math.ceil(listaFiltrada.length / porPagina)
  const listaPaginada = listaFiltrada.slice((paginaActual - 1) * porPagina, paginaActual * porPagina)

  useEffect(() => { setPaginaActual(1) }, [search, filtroFicha, filtroInstructor, filtroAmbiente, filtroJornada, filtroEstado])

  // ─── Accesos directos ───
  const openInstructorDetail = async (h: Horario) => {
    if (h.instructor_id) {
      try {
        const res = await api.instructors.getById(h.instructor_id)
        setSelectedInstructor(res.data)
        setIsInstructorModalOpen(true)
        return
      } catch {}
    }
    // Fallback: buscar por nombre
    try {
      const res = await api.instructors.getAll()
      const inst = (res.data || []).find((i: any) => i.nombre === h.instructor_nombre)
      if (inst) {
        setSelectedInstructor(inst)
        setIsInstructorModalOpen(true)
      }
    } catch {}
  }

  const openFichaDetail = async (h: Horario) => {
    if (h.ficha_id) {
      try {
        const res = await api.fichas.getById(h.ficha_id)
        setSelectedFicha(res.data)
        setIsFichaModalOpen(true)
        return
      } catch {}
    }
    // Fallback: buscar por número de ficha
    try {
      const res = await api.fichas.getAll()
      const ficha = (res.data || []).find((f: any) => String(f.numero_ficha) === String(h.ficha_numero))
      if (ficha) {
        setSelectedFicha(ficha)
        setIsFichaModalOpen(true)
      }
    } catch {}
  }

  const openAmbienteDetail = async (h: Horario) => {
    if (!h.ambiente) return
    try {
      const res = await api.ambientes.getAll()
      const amb = (res.data || []).find((a: any) => a.nombre === h.ambiente)
      if (amb) {
        setSelectedAmbiente(amb)
        setIsAmbienteModalOpen(true)
      }
    } catch {}
  }

  const handleCreate = async (data: any) => {
    try {
      const now = new Date()
      const day = now.getDay()
      const diff = day === 0 ? -6 : 1 - day
      const lunes = new Date(now)
      lunes.setDate(now.getDate() + diff)
      const semana = lunes.toISOString().split('T')[0]

      const dias = data.dias || [data.dia_semana] // Fallback for single day
      
      for (const dia of dias) {
        const payload = {
          ficha_id: data.ficha_id,
          instructor_id: data.instructor_id,
          competencia_id: data.competencia_id,
          dia_semana: Number(dia),
          hora_inicio: data.hora_inicio,
          hora_fin: data.hora_fin,
          jornada_id: data.jornada_id,
          ambiente_id: data.ambiente_id,
          tipo_actividad_id: data.tipo_actividad_id ?? null,
          semana,
        }
        await api.horarios.create(payload)
      }
      
      showToast("Horario registrado exitosamente", "success")
      setIsCreateModalOpen(false)
      cargarHorarios()
    } catch (err: any) {
      showToast(err.message || "Error al registrar horario", "error")
    }
  }
  const openEditModal = (horario: Horario) => {
    setSelectedHorario(horario)
    setIsEditModalOpen(true)
  }

  const handleEdit = async (data: any) => {
    if (!selectedHorario) return
    try {
      const res = await api.horarios.update(selectedHorario.id, data)
      
      if (res.alertas && res.alertas.length > 0) {
        const alertMessage = res.alertas.join(", ")
        showToast(`Horario actualizado con alertas: ${alertMessage}`, "info")
      } else {
        showToast("Horario actualizado exitosamente", "success")
      }
      
      setIsEditModalOpen(false)
      cargarHorarios()
    } catch (err) {
      showToast("Error al actualizar horario", "error")
    }
  }

  const handleDesactivar = (horario: Horario) => {
    setConfirmDialog({
      isOpen: true,
      title: horario.activo ? "¿Deshabilitar este horario?" : "¿Habilitar este horario?",
      message: horario.activo ? "El registro histórico se conservará." : "Se restaurará el horario activo.",
      showMotivo: horario.activo,
      onConfirm: async (motivo?: string) => {
        setConfirmDialog({ ...confirmDialog, isOpen: false })
        try {
          await api.horarios.toggleActivo(horario.id, motivo)
          showToast(`Horario ${horario.activo ? "deshabilitado" : "habilitado"}`, "success")
          cargarHorarios()
        } catch (err: any) {
          showToast(err.message || "Error al cambiar estado", "error")
        }
      },
    })
  }

  const handleSuspender = (horario: Horario) => {
    setConfirmDialog({
      isOpen: true,
      title: "Suspender horario",
      message: `¿Estas seguro de suspender el horario de ${horario.instructor_nombre}? Se registrara la trazabilidad del cambio.`,
      showMotivo: true,
      onConfirm: async (motivo?: string) => {
        setConfirmDialog({ ...confirmDialog, isOpen: false })
        try {
          await api.horarios.suspender(horario.id, motivo || "Sin motivo especificado")
          showToast("Horario suspendido exitosamente", "success")
          cargarHorarios()
        } catch (err: any) {
          showToast(err.message || "Error al suspender horario", "error")
        }
      },
    })
  }

  if (authLoading || !user) return <PageSkeleton />

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Horarios</h1>
            <p className="text-gray-500 text-sm">Listado de horarios registrados del CDMC</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setVistaGrilla(!vistaGrilla)}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              {vistaGrilla ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
              {vistaGrilla ? "Ver tabla" : "Ver horario"}
            </button>
            <button
              onClick={() => {
                if (filtroVista === "mes") {
                  exportarMesPDF()
                  return
                }
                let datos = vistaGrilla ? horariosGrillaFiltrados : listaFiltrada
                let label = "Malla de Horarios Semanal"
                if (vistaGrilla && filtroVista === "dia") {
                  datos = datos.filter((h: any) => {
                    const dias = Array.isArray(h.dias) ? h.dias : []
                    return dias.includes(diaHoyAbrev)
                  })
                  label = `Horarios del día — ${new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}`
                }
                exportarHorariosPDF(datos, label)
              }}
              disabled={exportandoMes}
              className={`border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm ${exportandoMes ? "opacity-50 cursor-wait" : ""}`}
            >
              {exportandoMes ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {exportandoMes ? "Exportando..." : "Exportar PDF"}
            </button>
            {puedeEditar && (
              <button
                onClick={() => router.push("/asignaciones")}
                className="bg-sena hover:bg-sena/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Crear desde asignación
              </button>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por grupo o instructor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena/50 focus:border-sena"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 w-full md:flex md:flex-wrap md:w-auto">
            <MultiSelect
              label="Grupo"
              allLabel="Todos"
              options={[...new Set(horarios.map((h) => h.ficha_numero))].sort().map((f) => ({ value: f, label: f }))}
              selected={filtroFicha}
              onChange={setFiltroFicha}
            />
            <MultiSelect
              label="Instructor"
              allLabel="Todos"
              options={[...new Set(horarios.map((h) => h.instructor_nombre))].sort().map((i) => ({ value: i, label: i }))}
              selected={filtroInstructor}
              onChange={setFiltroInstructor}
            />
            <MultiSelect
              label="Ambiente"
              allLabel="Todos"
              options={[...new Set(horarios.map((h) => h.ambiente).filter(Boolean))].sort().map((a) => ({ value: a, label: a }))}
              selected={filtroAmbiente}
              onChange={setFiltroAmbiente}
            />
            <MultiSelect
              label="Jornada"
              allLabel="Todas"
              options={[
                { value: "manana", label: "Mañana" },
                { value: "mixta", label: "Mixta" },
                { value: "noche", label: "Noche" },
                { value: "virtual", label: "Virtual" },
              ]}
              selected={filtroJornada}
              onChange={setFiltroJornada}
            />
          </div>
        </div>

        {/* Toggle inactivos */}
        {inactivosCount > 0 && (
          <button
            onClick={() => setMostrarInactivos(!mostrarInactivos)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              mostrarInactivos
                ? "bg-gray-100 border-gray-300 text-gray-700"
                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            {mostrarInactivos ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {mostrarInactivos ? "Ocultar inactivos" : `Mostrar inactivos (${inactivosCount})`}
          </button>
        )}

        {vistaGrilla ? (
          <div className="space-y-4">
            {/* Toggle día / semana / mes */}
            <div className="flex items-center gap-2">
              {(["dia", "semana", "mes"] as const).map((vista) => (
                <button
                  key={vista}
                  onClick={() => setFiltroVista(vista)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtroVista === vista
                      ? "bg-sena text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {vista === "dia" ? "Día" : vista === "semana" ? "Semana" : "Mes"}
                </button>
              ))}
            </div>
            <GrillaHorarios
              horarios={horariosGrillaFiltrados}
              onSemanaChange={handleSemanaChange}
              loading={loadingGrilla}
              filterDia={filtroVista === "dia" ? diaHoyAbrev : undefined}
            />
          </div>
        ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <TableSkeleton rows={5} columns={10} />
          ) : listaPaginada.length === 0 ? (
            <EmptyState icon={Calendar} title="Sin horarios" description="No se encontraron horarios con los filtros seleccionados." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 md:px-6 md:py-4">Grupo</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Instructor</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Competencia</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Ambiente</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Jornada</th>
                    {/* <th className="px-3 py-3 md:px-6 md:py-4">Tipo actividad</th> */}
                    <th className="px-3 py-3 md:px-6 md:py-4">Días</th>
                    <th className="px-3 py-3 md:px-6 md:py-4">Horas</th>
                    <th className="px-3 py-3 md:px-6 md:py-4 text-center">Estado</th>
                    <th className="px-3 py-3 md:px-6 md:py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listaPaginada.map((h) => (
                    <tr key={h.id} className={`hover:bg-gray-50/50 transition-colors ${!h.activo ? "opacity-50 bg-gray-50" : ""}`}>
                      <td className="px-3 py-3 md:px-6 md:py-4 font-medium text-gray-900">
                        <button onClick={() => openFichaDetail(h)} className="hover:text-sena hover:underline transition-colors text-left">
                          {h.ficha_numero}
                        </button>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-700">
                        <button onClick={() => openInstructorDetail(h)} className="hover:text-sena hover:underline transition-colors text-left">
                          {h.instructor_nombre}
                        </button>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">{h.competencia}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">
                        {h.ambiente ? (
                          <button onClick={() => openAmbienteDetail(h)} className="hover:text-sena hover:underline transition-colors text-left">
                            {h.ambiente}
                          </button>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          formatJornada(h.jornada) === 'Mañana' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {formatJornada(h.jornada)}
                        </span>
                      </td>
                      {/* <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500">
                        {h.tipo_actividad || <span className="text-gray-300">—</span>}
                      </td> */}
                      <td className="px-3 py-3 md:px-6 md:py-4">
                        <div className="flex flex-wrap gap-1">
                          {h.dias.map((d) => (
                            <span key={d} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              {d}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-gray-700 whitespace-nowrap">{h.horas}</td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          h.estado === 'Aprobado' ? 'bg-green-100 text-green-800' :
                          h.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {h.estado === 'Pendiente' && <Clock className="w-3 h-3 mr-1" />}
                          {h.estado}
                        </span>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                        {puedeEditar ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => exportarHorarioIndividualPDF(h)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Descargar PDF"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(h)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSuspender(h)}
                              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                              title="Suspender"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDesactivar(h)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title={h.activo ? "Desactivar" : "Activar"}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => exportarHorarioIndividualPDF(h)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Descargar PDF"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-3 py-3 md:px-6 md:py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-500">
              Mostrando {(paginaActual - 1) * porPagina + 1}–{Math.min(paginaActual * porPagina, listaFiltrada.length)} de {listaFiltrada.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className={`p-1 rounded border border-gray-300 bg-white ${paginaActual === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPaginaActual(p)}
                  className={`px-3 py-1 rounded text-sm font-medium ${p === paginaActual ? 'bg-sena text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                className={`p-1 rounded border border-gray-300 bg-white ${paginaActual === totalPaginas ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        )}
      </div>

      <CrearHorarioModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />

      <EditarHorarioModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        horario={selectedHorario}
        onSubmit={handleEdit}
      />

      {confirmDialog.isOpen && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          showMotivo={confirmDialog.showMotivo}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        />
      )}

      <DetailInstructorModal
        isOpen={isInstructorModalOpen}
        onClose={() => setIsInstructorModalOpen(false)}
        instructor={selectedInstructor}
        puedeEditar={puedeEditar}
      />

      <DetailFichaModal
        isOpen={isFichaModalOpen}
        onClose={() => setIsFichaModalOpen(false)}
        ficha={selectedFicha}
        onInstructorClick={async (instructorId, nombre) => {
          try {
            const res = await api.instructors.getById(instructorId)
            setSelectedInstructor(res.data)
          } catch {
            setSelectedInstructor({ id: instructorId, nombre, email: "", tipo_area: "", activo: true, roles: "Instructor" })
          }
          setIsInstructorModalOpen(true)
        }}
      />

      <VerAgendaAmbienteModal
        isOpen={isAmbienteModalOpen}
        onClose={() => setIsAmbienteModalOpen(false)}
        ambiente={selectedAmbiente}
      />

    </DashboardLayout>
  )
}
