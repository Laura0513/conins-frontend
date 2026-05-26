# BACKEND REQUIREMENTS - CONINS
**Fecha:** 26 de mayo de 2026
**Responsable Backend:** Jair
**Estado Frontend:** 90% visual listo. Pendiente conexión de endpoints y validaciones.

---

## 1. RESUMEN DE ESTADO ACTUAL

El frontend tiene implementadas todas las vistas (CRUD completo visual) para:
- ✅ Auth (Login, Crear Password)
- ✅ Instructores (Lista, Crear, Editar, Detalle, Novedades)
- ✅ Fichas (Lista, Crear, Editar, Detalle, Finalizar)
- ✅ Asignaciones (Lista con Tabs, Crear, Editar, Detalle, Provisional, Desactivar)

**Lo que falta:** Conectar los endpoints reales, implementar validaciones de negocio y corregir inconsistencias de datos.

---

## 2. ENDPOINTS PENDIENTES POR MÓDULO

### A. INSTRUCTORES (`/api/instructores`)
| Método | Endpoint | Estado Frontend | Acción Requerida Backend |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | ✅ Conectado | Devolver campo `tiene_novedad: boolean` (true si tiene novedad activa vigente). |
| `POST` | `/` | ✅ Conectado | Validar email único. Retornar ID creado. |
| `PUT` | `/:id` | ⚠️ Mock | Implementar actualización de datos básicos. |
| `POST` | `/:id/novedades` | ️ Mock | Crear registro en tabla `novedades`. Actualizar estado del instructor si aplica. |
| `GET` | `/:id` | ❌ No existe | Retornar detalle completo (asignaciones, horarios, novedades activas). |

### B. FICHAS (`/api/fichas`)
| Método | Endpoint | Estado Frontend | Acción Requerida Backend |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | ⚠️ Mock | Retornar lista con `instructores_count` (JOIN con asignaciones). |
| `POST` | `/` | ⚠️ Mock | Crear ficha. Validar `numero_ficha` único. |
| `PUT` | `/:id` | ⚠️ Mock | Actualizar datos. |
| `PATCH` | `/:id/finalizar` | ⚠️ Mock | Cambiar estado a "Finalizada". Bloquear nuevas asignaciones. |
| `GET` | `/programas` | ❌ No existe | **CRÍTICO:** Retornar lista de programas para filtro en Fichas. |

### C. ASIGNACIONES (`/api/asignaciones`)
| Método | Endpoint | Estado Frontend | Acción Requerida Backend |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | ⚠️ Mock | Retornar asignaciones con: `competencia`, `ambiente`, `jornada`, `es_lider`. |
| `POST` | `/` | ️ Mock | Crear asignación. **Validar horas máximas (ver sección 3).** |
| `PUT` | `/:id` | ⚠️ Mock | Actualizar competencia/ambiente/líder. |
| `PATCH` | `/:id/desactivar` | ⚠️ Mock | Soft delete (`activo = false`). Mover a pestaña "Históricas". |
| `POST` | `/provisional` | ⚠️ Mock | Crear asignación con flag `es_provisional = true`. Guardar trazabilidad (autorizado_por, motivo). |

### D. PROGRAMAS (`/api/programas`)
| Método | Endpoint | Estado Frontend | Acción Requerida Backend |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | ❌ No existe | Retornar lista simple `{id, nombre}` para dropdowns. |

---

## 3. REGLAS DE NEGOCIO CRÍTICAS (VALIDACIONES)

### 3.1. Bloqueo por Novedades
- **Regla:** Un instructor con novedad activa (fecha_inicio <= hoy <= fecha_regreso) **NO** puede recibir nuevas asignaciones.
- **Implementación:**
  - Backend: Rechazar `POST /asignaciones` si instructor tiene novedad activa.
  - Frontend: Ya está listo el filtro visual. Falta que el backend envíe `tiene_novedad: true`.

### 3.2. Límite de Horas (20h - 40h semanales)
- **Regla:** La suma de horas de todas las asignaciones activas de un instructor no puede exceder 40h ni ser menor a 20h (excepto si tiene novedad).
- **Implementación:**
  - Backend: Al crear/editar asignación, calcular `SUM(horas) WHERE instructor_id = X AND activo = true`.
  - Rechazar si `total > 40`.
  - Retornar error claro: "El instructor excede el límite de 40 horas semanales".

### 3.3. Soft Delete Unificado
- **Problema:** Instructores/Fichas usan `activo: boolean`. Asignaciones usa `tipo: historica`.
- **Solución:** Unificar todo a `activo: boolean` en la DB.
  - `activo = true` -> Pestaña "Activas" / "Provisionales".
  - `activo = false` -> Pestaña "Históricas".

### 3.4. Roles y Permisos
- **Regla:** Solo `Coordinador` y `Subdirector` pueden crear/editar asignaciones.
- **Implementación:** Middleware de autenticación que verifique `usuario_roles` antes de permitir `POST/PUT/PATCH`.

---

## 4. ESTRUCTURA DE DATOS ESPERADA (RESPUESTAS JSON)

### GET /api/instructores
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Carlos Álvarez",
      "email": "carlos@sena.edu.co",
      "tipo_contrato": "contratista",
      "tipo_area": "tecnica",
      "activo": true,
      "tiene_novedad": false,
      "horas_semana": 35
    }
  ]
}
```

### GET /api/fichas
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "numero_ficha": "2995403",
      "programa": "ADSO",
      "jornada": "Mañana",
      "etapa": "lectiva",
      "modalidad": "Presencial",
      "instructores_count": 4,
      "estado": "Activa",
      "activo": true
    }
  ]
}
```

### GET /api/asignaciones
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "instructor_nombre": "Carlos Álvarez",
      "ficha_numero": "2995403",
      "competencia": "Bases de datos",
      "ambiente": "Aula 203",
      "jornada": "Mañana",
      "es_lider": true,
      "activo": true
    }
  ]
}
```

---

## 5. PRIORIDADES DE IMPLEMENTACIÓN

1.  **Alta:** Endpoints de lectura (`GET`) para Instructores, Fichas y Asignaciones con datos reales.
2.  **Alta:** Endpoint `GET /api/programas` (bloqueante para filtro de Fichas).
3.  **Media:** Validación de horas y bloqueo por novedades.
4.  **Media:** Endpoints de escritura (`POST/PUT`) con validaciones.
5.  **Baja:** Roles y permisos avanzados.

---

## 6. NOTAS TÉCNICAS
- **Base de datos:** MySQL (`conins`). Revisar `database.sql` para estructura de tablas.
- **Auth:** JWT. El token se envía en header `Authorization: Bearer <token>`.
- **Formato fechas:** `YYYY-MM-DD` (ISO 8601).
- **Soft delete:** Siempre usar `activo = false`, nunca `DELETE` físico.
