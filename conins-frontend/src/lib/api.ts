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

        register(email: string, password: string, tipo_contrato?: string, tipo_area?: string) {
            return apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email, password, tipo_contrato, tipo_area }),
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

    instructors: {
        getAll() {
            return apiFetch('/instructores')
        },
        create(data: any) {
            return apiFetch('/instructores', {
                method: 'POST',
                body: JSON.stringify(data),
            })
        },
    },
}

export type ApiResponse<T = unknown> = {
    success: boolean
    message: string
    data: T
}
