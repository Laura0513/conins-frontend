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

    // Verificar si la respuesta es JSON antes de intentar parsearla
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
        // Si el backend devuelve HTML (ej: error 404/500 no manejado), lanzamos error controlado
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

        solicitarRecuperacion(email: string) {
            return apiFetch('/auth/recuperar-contrasena', {
                method: 'POST',
                body: JSON.stringify({ email }),
            })
        },

        resetearContrasena(token: string, nueva_contrasena: string) {
            return apiFetch('/auth/resetear-contrasena', {
                method: 'POST',
                body: JSON.stringify({ token, nueva_contrasena }),
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
        getNovedades(fichaId: number) {
            return apiFetch(`/fichas/${fichaId}/novedades`)
        },
        crearNovedad(fichaId: number, data: any) {
            return apiFetch(`/fichas/${fichaId}/novedades`, {
                method: 'POST',
                body: JSON.stringify(data),
            })
        },
        toggleNovedad(fichaId: number, novedadId: number) {
            return apiFetch(`/fichas/${fichaId}/novedades/${novedadId}/toggle`, {
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
        getRaps(asignacionId: number) {
            return apiFetch(`/asignaciones/${asignacionId}/raps`)
        },
        getRapsByCompetencia(asignacionId: number, competenciaId: number) {
            return apiFetch(`/asignaciones/${asignacionId}/competencia/${competenciaId}/raps`)
        },
        setRaps(asignacionId: number, competenciaId: number, rapIds: number[]) {
            return apiFetch(`/asignaciones/${asignacionId}/competencia/${competenciaId}/raps`, {
                method: 'PUT',
                body: JSON.stringify({ rap_ids: rapIds }),
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
        getById(id: number) {
            return apiFetch(`/programas/${id}`)
        },
        setReferente(id: number, instructorId: number | null) {
            return apiFetch(`/programas/${id}/referente`, {
                method: 'PATCH',
                body: JSON.stringify({ referente_id: instructorId }),
            })
        },
    },

    competencias: {
        getAll() {
            return apiFetch('/competencias')
        },
        getById(id: number) {
            return apiFetch(`/competencias/${id}`)
        },
        create(data: any) {
            return apiFetch('/competencias', {
                method: 'POST',
                body: JSON.stringify(data),
            })
        },
        update(id: number, data: any) {
            return apiFetch(`/competencias/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            })
        },
        toggleEstado(id: number) {
            return apiFetch(`/competencias/${id}/estado`, {
                method: 'PATCH',
            })
        },
        getRaps(competenciaId: number) {
            return apiFetch(`/competencias/${competenciaId}/raps`)
        },
        createRap(competenciaId: number, data: any) {
            return apiFetch(`/competencias/${competenciaId}/raps`, {
                method: 'POST',
                body: JSON.stringify(data),
            })
        },
        updateRap(competenciaId: number, rapId: number, data: any) {
            return apiFetch(`/competencias/${competenciaId}/raps/${rapId}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            })
        },
        toggleRapEstado(competenciaId: number, rapId: number) {
            return apiFetch(`/competencias/${competenciaId}/raps/${rapId}/estado`, {
                method: 'PATCH',
            })
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
        getTiposNovedadFicha() {
            return apiFetch('/catalogo/tipos-novedad-ficha')
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
            return apiFetch(`/rap-seguimiento/ficha/${fichaId}/disponibles`)
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
        evaluar(id: number, estado_aprobacion: string) {
            return apiFetch(`/rap-seguimiento/${id}/evaluar`, {
                method: 'PATCH',
                body: JSON.stringify({ estado_aprobacion }),
            })
        },
        toggleActivo(id: number) {
            return apiFetch(`/rap-seguimiento/${id}/estado`, {
                method: 'PATCH',
            })
        },
    },

    users: {
        getAll() {
            return apiFetch('/auth/usuarios')
        },
        create(data: any) {
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
        asignarProgramas(liderId: number, programaIds: number[]) {
            return apiFetch(`/auth/usuarios/${liderId}/programas`, {
                method: 'PUT',
                body: JSON.stringify({ programa_ids: programaIds }),
            })
        },
    },
}

export type ApiResponse<T = unknown> = {
    success: boolean
    message: string
    data: T
}
