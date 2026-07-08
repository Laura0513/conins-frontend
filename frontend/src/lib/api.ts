const API_BASE_URL = 'http://localhost:5000/api'

function getAuthHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    }

    if (includeAuth) {
        const token = localStorage.getItem('auth_token')
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }
    }

    return headers
}

async function apiFetch(path: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${path}`

    const response = await fetch(url, {
        ...options,
        headers: {
            ...getAuthHeaders(options.headers ? !!(options.headers as Record<string, string>)['Authorization'] : true),
            ...options.headers,
        },
    })

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error('El servidor no respondió con datos válidos (Backend no disponible o ruta inexistente)')
    }

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Error en la peticion')
    }

    return data
}

export const api = {
    auth: {
        login(email: string, password: string) {
            return apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            })
        },

        crearPassword(email: string, nueva_password: string, confirmar_password: string) {
            return apiFetch('/auth/crear-password', {
                method: 'POST',
                body: JSON.stringify({ email, nueva_password, confirmar_password }),
            })
        },

        getPerfil() {
            return apiFetch('/auth/perfil')
        },

        updatePerfil(nombre?: string, email?: string) {
            return apiFetch('/auth/perfil', {
                method: 'PUT',
                body: JSON.stringify({ nombre, email }),
            })
        },

        cambiarContrasena(contrasena_actual: string, nueva_contrasena: string) {
            return apiFetch('/auth/cambiar-contrasena', {
                method: 'PATCH',
                body: JSON.stringify({ contrasena_actual, nueva_contrasena }),
            })
        },
    },

    users: {
        getAll() {
            return apiFetch('/auth/usuarios')
        },

        create(data: { nombre: string; email: string }) {
            return apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify(data),
            })
        },

        update(id: number, data: any) {
            return apiFetch(`/auth/usuarios/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            })
        },

        toggleEstado(id: number) {
            return apiFetch(`/auth/usuarios/${id}/estado`, {
                method: 'PATCH',
            })
        },

        asignarProgramas(liderId: number, programa_ids: number[]) {
            return apiFetch(`/auth/usuarios/${liderId}/programas`, {
                method: 'PUT',
                body: JSON.stringify({ programa_ids }),
            })
        },
    },

    instructors: {
        getAll() {
            return apiFetch('/instructores')
        },
        getOwnProfile() {
            return apiFetch('/instructores/perfil')
        },
        getById(id: number) {
            return apiFetch(`/instructores/${id}`)
        },
        getDetalle(id: number) {
            return apiFetch(`/instructores/${id}/detalle`)
        },
        create(data: any) {
            return apiFetch('/instructores', {
                method: 'POST',
                body: JSON.stringify(data),
            })
        },
        update(id: number, data: any) {
            return apiFetch(`/instructores/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            })
        },
        toggleEstado(id: number) {
            return apiFetch(`/instructores/${id}/estado`, {
                method: 'PATCH',
            })
        },
        registrarNovedad(id: number, data: any) {
            return apiFetch(`/instructores/${id}/novedades`, {
                method: 'POST',
                body: JSON.stringify(data),
            })
        },
        getCompetencias(id: number) {
            return apiFetch(`/instructores/${id}/competencias`)
        },
        addCompetencia(id: number, data: any) {
            return apiFetch(`/instructores/${id}/competencias`, {
                method: 'POST',
                body: JSON.stringify(data),
            })
        },
        removeCompetencia(id: number, competenciaId: number) {
            return apiFetch(`/instructores/${id}/competencias/${competenciaId}`, {
                method: 'DELETE',
            })
        },
    },

    fichas: {
        getAll() {
            return apiFetch('/fichas')
        },
        getById(id: number) {
            return apiFetch(`/fichas/${id}`)
        },
        create(data: any) {
            return apiFetch('/fichas', {
                method: 'POST',
                body: JSON.stringify(data),
            })
        },
        update(id: number, data: any) {
            return apiFetch(`/fichas/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            })
        },
        finalizar(id: number) {
            return apiFetch(`/fichas/${id}/finalizar`, {
                method: 'PATCH',
            })
        },
        toggleEstado(id: number) {
            return apiFetch(`/fichas/${id}/estado`, {
                method: 'PATCH',
            })
        },
    },

    assignments: {
        getAll() {
            return apiFetch('/asignaciones')
        },
        getById(id: number) {
            return apiFetch(`/asignaciones/${id}`)
        },
        create(data: any) {
            return apiFetch('/asignaciones', {
                method: 'POST',
                body: JSON.stringify(data),
            })
        },
        update(id: number, data: any) {
            return apiFetch(`/asignaciones/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            })
        },
        desactivar(id: number) {
            return apiFetch(`/asignaciones/${id}/desactivar`, {
                method: 'PATCH',
            })
        },
        registrarProvisional(data: any) {
            return apiFetch('/asignaciones/provisional', {
                method: 'POST',
                body: JSON.stringify(data),
            })
        },
    },

    horarios: {
        getAll() {
            return apiFetch('/horarios')
        },
        getById(id: number) {
            return apiFetch(`/horarios/${id}`)
        },
        create(data: any) {
            return apiFetch('/horarios', {
                method: 'POST',
                body: JSON.stringify(data),
            })
        },
        update(id: number, data: any) {
            return apiFetch(`/horarios/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            })
        },
        toggleActivo(id: number, motivo?: string) {
            return apiFetch(`/horarios/${id}/estado`, {
                method: 'PATCH',
                body: JSON.stringify({ motivo }),
            })
        },
        aprobar(id: number) {
            return apiFetch(`/horarios/${id}/aprobar`, {
                method: 'PATCH',
            })
        },
        rechazar(id: number, motivo: string) {
            return apiFetch(`/horarios/${id}/rechazar`, {
                method: 'PATCH',
                body: JSON.stringify({ motivo }),
            })
        },
        suspender(id: number, motivo: string) {
            return apiFetch(`/horarios/${id}/suspender`, {
                method: 'PATCH',
                body: JSON.stringify({ motivo }),
            })
        },
    },

    programs: {
        getAll() {
            return apiFetch('/programas')
        },
    },

    catalogo: {
        getAreas() {
            return apiFetch('/catalogo/areas')
        },
        getCompetenciasByPrograma(programaId: number) {
            return apiFetch(`/catalogo/programas/${programaId}/competencias`)
        },
        getTiposNovedadInstructor() {
            return apiFetch('/catalogo/tipos-novedad-instructor')
        },
        getTiposNovedadAmbiente() {
            return apiFetch('/catalogo/tipos-novedad-ambiente')
        },
        getTiposActividad() {
            return apiFetch('/catalogo/tipos-actividad')
        },
    },

    ambientes: {
        getAll() {
            return apiFetch('/ambientes')
        },
        create(data: any) {
            return apiFetch('/ambientes', {
                method: 'POST',
                body: JSON.stringify(data),
            })
        },
        update(id: number, data: any) {
            return apiFetch(`/ambientes/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            })
        },
        bloquear(id: number, data: any) {
            return apiFetch(`/ambientes/${id}/bloquear`, {
                method: 'POST',
                body: JSON.stringify(data),
            })
        },
    },

    alertas: {
        getAll() {
            return apiFetch('/alertas')
        },
        marcarAtendida(id: number) {
            return apiFetch(`/alertas/${id}/atendida`, {
                method: 'PATCH',
            })
        },
    },

    notificaciones: {
        getMis(soloNoLeidas = false) {
            return apiFetch(`/notificaciones${soloNoLeidas ? '?solo_no_leidas=true' : ''}`)
        },
        getNoLeidasCount() {
            return apiFetch('/notificaciones/no-leidas/count')
        },
        marcarLeida(id: number) {
            return apiFetch(`/notificaciones/${id}/leida`, { method: 'PATCH' })
        },
        marcarTodasLeidas() {
            return apiFetch('/notificaciones/marcar-todas', { method: 'PATCH' })
        },
    },

    consultas: {
        getCargaHoraria() {
            return apiFetch('/consultas/carga-horaria')
        },
        getHorariosPorFicha() {
            return apiFetch('/consultas/horarios-ficha')
        },
        getOcupacionAmbientes() {
            return apiFetch('/consultas/ocupacion-ambientes')
        },
    },

    rapSeguimiento: {
        getByFicha(fichaId: number) {
            return apiFetch(`/rap-seguimiento/ficha/${fichaId}`)
        },
        getDisponibles(fichaId: number) {
            return apiFetch(`/rap-seguimiento/disponibles/${fichaId}`)
        },
        getByAsignacionCompetencia(acId: number) {
            return apiFetch(`/rap-seguimiento/asignacion-competencia/${acId}`)
        },
        getById(id: number) {
            return apiFetch(`/rap-seguimiento/${id}`)
        },
        create(data: any) {
            return apiFetch('/rap-seguimiento', {
                method: 'POST',
                body: JSON.stringify(data),
            })
        },
        update(id: number, data: any) {
            return apiFetch(`/rap-seguimiento/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            })
        },
        evaluar(id: number, estado_aprobacion: 'aprobado' | 'no_aprobado') {
            return apiFetch(`/rap-seguimiento/${id}/evaluar`, {
                method: 'PATCH',
                body: JSON.stringify({ estado_aprobacion }),
            })
        },
        toggleActivo(id: number) {
            return apiFetch(`/rap-seguimiento/${id}/toggle`, {
                method: 'PATCH',
            })
        },
    },
}

export type ApiResponse<T = unknown> = {
    success: boolean
    message: string
    data: T
}
