# REPORTE DE SESIÓN — 6 de Julio 2026
## CONINS — Sistema de Control de Instructores (CDMC SENA)
**Elaborado por:** Laura Sofía Posada (frontend)  
**Para:** Jair Enrique González Buelvas (backend + BD)  
**Fecha:** 06/07/2026

---

## 1. Resumen general

Esta sesión abarcó dos grandes bloques de trabajo: (1) cambios en backend que fueron necesarios para alinear el frontend con el nuevo esquema de roles y funcionalidades pendientes, y (2) un barrido completo del frontend para eliminar datos mock, corregir bugs y crear funcionalidades nuevas. **Jair, los cambios de backend los hice yo desde el frontend porque eran necesarios para avanzar — necesitas revisarlos, validarlos e integrarlos en tu rama.**

---

## 2. CAMBIOS EN BACKEND (requieren revisión de Jair)

Estos cambios se hicieron sobre archivos del backend para que el frontend pudiera funcionar. Jair debe revisar, validar y decidir si los integra tal cual o los ajusta.

### 2.1 Roles — `constants/roles.ts`
Se actualizó para reflejar los 4 roles Title Case aprobados:
- `Subdirector` (ID 1)
- `Coordinadora Academica` (ID 2)
- `Asistente Coordinacion` (ID 3)
- `Instructor` (ID 4)

Se eliminó `Lider Programa` como rol del sistema (queda solo como tabla informativa).

### 2.2 Rutas backend — guards `requireRole`
Todos los archivos de rutas se actualizaron para usar los nuevos strings Title Case en los guards `requireRole([...])`. Archivos afectados:
- `instructor.routes.ts`
- `ficha.routes.ts`
- `horario.routes.ts`
- `asignacion.routes.ts`
- `notificacion.routes.ts`
- `catalogo.routes.ts`
- `auth.routes.ts` (si aplica)

### 2.3 Services actualizados
- **`auth.service.ts`**: SUPER_USER actualizado a `'Subdirector'`; checks de roles cambiados de snake_case a Title Case; `rol_ids.includes(5)` → `rol_ids.includes(4)` para Instructor.
- **`permiso.service.ts`**: eliminada función dead code `validarAlcanceLider`.

### 2.4 Models y schemas modificados
- **`horario.model.ts`**: soporte para `tipo_actividad_id` (FK a `tipos_actividad`); LEFT JOIN en queries; `getHorasPorInstructor` con filtro `suma_carga_horaria`.
- **`horario.schema.ts`**: `tipo_actividad_id` optional nullable en schemas Zod.
- **`ficha.model.ts` / `ficha.schema.ts`**: soporte para `fecha_inicio_productiva` y `fecha_fin_productiva`.
- **Nuevo modelo**: `rap-ficha-seguimiento.model.ts` — interfaces y métodos CRUD para seguimiento de RAPs por ficha.

### 2.5 P22 — Filtrado por rol (CRÍTICO de seguridad)
Se implementó filtrado por rol en backend para que cada usuario vea solo lo que le corresponde:
- Se agregó `findAllByInstructor` a los modelos de horario, asignación y ficha.
- Se actualizaron los services para recibir `req.user` y filtrar según rol.
- Se actualizaron los controllers para pasar `req.user` a los services.
- Alertas filtradas por instructor.

### 2.6 P23 — RF-37 completo (validaciones en update de horarios)
- `update()` de horarios ahora revalida RN-03 (carga horaria), RN-05 (ambiente ocupado) y alerta de jornada restringida.
- Fix: `findById` retornaba detail sin IDs internos necesarios para la query — corregido.

### 2.7 P28 — Seguimiento de RAPs
- Nuevo service: `rap-ficha-seguimiento.service.ts`
- Nuevo controller y routes
- Schema de validación Zod
- Ruta registrada en `server.ts`
- Endpoint `GET /api/rap-seguimiento/disponibles/:fichaId` para RAPs sin seguimiento

### 2.8 P29 — Tipos de actividad
- Nuevo endpoint `GET /api/catalogo/tipos-actividad`

### 2.9 Fix en `database.sql`
- `sp_crear_instructor`: corregido `rol_id 5` → `rol_id 4` para Instructor.

---

## 3. CAMBIOS EN FRONTEND (rama dev/laura)

### 3.1 Eliminación total de datos mock
Se eliminaron TODOS los datos mock de la aplicación. Cada página ahora depende 100% del backend. Archivos limpiados:

| Archivo | Qué se eliminó |
|---|---|
| `pages/consultas.tsx` | `MOCK_CARGA`, `MOCK_HORARIOS_FICHA`, `MOCK_OCUPACION` — reescrito completo con `api.consultas.*` |
| `pages/alertas.tsx` | `MOCK_ALERTAS` — ahora usa `api.alertas.getAll()` |
| `pages/horarios.tsx` | `MOCK_HORARIOS` y fallback mock en catch |
| `pages/fichas.tsx` | `MOCK_FICHAS` y fallback mock en catch |
| `pages/asignaciones.tsx` | `MOCK_ASIGNACIONES` y fallback mock en catch |
| `pages/ambientes.tsx` | `MOCK_AMBIENTES` y fallback mock en catch |
| `pages/usuarios.tsx` | `MOCK_USUARIOS` y fallback mock en catch |
| `pages/instructores.tsx` | Función `getMockHoras()` — ahora usa `inst.horas_semana ?? 0` |
| `pages/competencias.tsx` | Reescrito de `setTimeout+mock` a `api.instructors.getCompetencias()` |
| `components/ambientes/VerAgendaAmbienteModal.tsx` | `MOCK_HORARIOS` — ahora usa `api.horarios.getAll()` filtrado |
| `components/instructores/DetailInstructorModal.tsx` | `MOCK_ASIGNACIONES`, `MOCK_NOVEDADES` — ahora usa `api.instructors.getDetalle()` |
| `components/fichas/DetailFichaModal.tsx` | `MOCK_INSTRUCTORES` — ahora usa `api.fichas.getById()` |

### 3.2 Fix bug de roles — `.toLowerCase()`
**Bug**: todas las comparaciones de roles en el frontend usaban `.toLowerCase()` (ej: `rol === "instructor"`), pero los roles del backend ahora vienen en Title Case (`"Instructor"`). Esto causaba que TODOS los usuarios vieran el menú de admin completo.

**Fix aplicado en todos los archivos afectados:**
```typescript
// ANTES (roto):
const esAdmin = user?.roles?.[0]?.trim().toLowerCase() !== "instructor"

// DESPUÉS (correcto):
const rol = user?.roles?.[0]?.trim() || ""
const esAdmin = rol !== "Instructor"
```

Archivos corregidos: `alertas.tsx`, `Sidebar.tsx`, y todas las páginas que usaban `puedeEditar`.

Patrón estándar `puedeEditar`:
```typescript
const rol = user?.roles?.[0]?.trim() || ""
const puedeEditar = !["Instructor", "Subdirector"].includes(rol)
```

### 3.3 Sidebar — `components/layout/Sidebar.tsx`
- **Roles corregidos**: comparación directa con `"Instructor"` y `"Subdirector"` (sin `.toLowerCase()`).
- **Badge hardcodeado eliminado**: las 3 variantes de menú tenían `badge: 2` hardcodeado. Reemplazado con conteo real de alertas pendientes desde `api.alertas.getAll()`, con refresh cada 60 segundos.
- **"Mi Perfil"** (`/perfil`) agregado a los 3 menús (admin, subdirector, instructor).
- **Mobile**: se agregó `onClick={onClose}` a los links para cerrar sidebar en móvil.

### 3.4 Nueva página — `/perfil` (RF-03, RF-10)
Archivo: `pages/perfil.tsx` — **PÁGINA NUEVA**

Dos tabs:
- **Datos personales**: editar nombre y email vía `api.auth.updatePerfil()`. Muestra `tipo_documento` y `documento` como campos de solo lectura.
- **Seguridad**: cambiar contraseña vía `api.auth.cambiarContrasena()` con validaciones (mínimo 6 caracteres, confirmación).

Características:
- Avatar con inicial del nombre y badge de rol con ícono Shield.
- 3 estados independientes para los toggles de visibilidad de contraseña (un ojito por campo).
- Llama `refreshUser()` del AuthContext después de actualizar perfil.

### 3.5 AuthContext — `lib/AuthContext.tsx`
- Se agregó función `refreshUser()` que llama `api.auth.getPerfil()` y actualiza el estado del usuario.
- Se agregó al tipo `AuthContextType` y al Provider value.

### 3.6 Dashboard — `pages/index.tsx`
Conectado a datos reales:
- Conteo real de fichas activas
- Conteo real de asignaciones
- Alertas reales (conteo + lista de recientes)
- Tabla de carga horaria real
- Vista de instructor con datos reales

### 3.7 Header — Notificaciones
Conectado a `api.notificaciones.getNoLeidasCount()` y `api.notificaciones.getMis()` para la campanita con badge real.

### 3.8 Consultas/Reportes — `pages/consultas.tsx`
3 tabs conectados a datos reales:
- Carga horaria: `api.consultas.getCargaHoraria()`
- Horarios por ficha: `api.consultas.getHorariosPorFicha()`
- Ocupación de ambientes: `api.consultas.getOcupacionAmbientes()`

### 3.9 P29 UI — Tipos de actividad en horarios
- Selector de `tipo_actividad` en `CrearHorarioModal` y `EditarHorarioModal`.
- `tipo_actividad_id` incluido en el payload de creación/edición.
- Columna `tipo_actividad` visible en la tabla de horarios.

### 3.10 P28 UI — Seguimiento de RAPs
- Nuevo componente `RapSeguimientoModal`.
- Botón "RAPs" integrado en la tabla de fichas.
- Métodos API frontend para endpoint de disponibles.

### 3.11 Endpoints del frontend — `lib/api.ts`
Namespaces ya configurados (verificar que el backend tenga las rutas correspondientes):
- `notificaciones`: `getMis()`, `getNoLeidasCount()`, `marcarLeida()`, `marcarTodasLeidas()`
- `consultas`: `getCargaHoraria()`, `getHorariosPorFicha()`, `getOcupacionAmbientes()`
- `rapSeguimiento`: `getDisponibles(fichaId)`
- `auth`: `getPerfil()`, `updatePerfil()`, `cambiarContrasena()`

---

## 4. ERROR ACTUAL — CORS

Al intentar iniciar sesión en `localhost:3000`, la consola muestra:

```
Access to fetch at 'http://localhost:5000/api/auth/login'
from origin 'http://localhost:3000' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Solución (Jair):** Configurar CORS en el servidor Express. En `server.ts`:

```typescript
import cors from "cors";

// Antes de las rutas:
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
```

Si ya tiene `cors` instalado, verificar que:
1. Esté antes de las rutas (`app.use(cors(...))` antes de `app.use('/api/...', ...)`)
2. El `origin` coincida con el puerto del frontend (`3000`)
3. El paquete `cors` esté instalado: `npm install cors` y `npm install -D @types/cors`

---

## 5. PENDIENTES POR IMPLEMENTAR

### 5.1 Backend (Jair)

| Prioridad | Pendiente | Detalle |
|---|---|---|
| BLOQUEANTE | CORS | Sin esto no se puede probar nada del frontend. Ver sección 4. |
| Alta | Revisar cambios backend de esta sesión | Los cambios de secciones 2.1 a 2.9 fueron hechos desde el frontend — necesitan revisión y validación. |
| Alta | Verificar endpoints de consultas | `GET /api/consultas/carga-horaria`, `GET /api/consultas/horarios-ficha`, `GET /api/consultas/ocupacion-ambientes` — el frontend los llama, verificar que existan. |
| Alta | Verificar endpoints de notificaciones | `GET /api/notificaciones/mis`, `GET /api/notificaciones/no-leidas/count`, `PATCH /api/notificaciones/:id/leida`, `PATCH /api/notificaciones/marcar-todas-leidas` |
| Alta | Verificar endpoints de perfil | `GET /api/auth/perfil`, `PUT /api/auth/perfil` (body: nombre, email), `PUT /api/auth/cambiar-contrasena` (body: contrasenaActual, nuevaContrasena) |
| Media | RF-47 — Novedades de fichas | Backend tiene tabla `ficha_novedades` pero falta verificar que el frontend tenga un componente modal funcional para esto. |
| Media | Competencias endpoint | `GET /api/instructores/competencias/:userId` — el frontend usa `usuario_id` pero el endpoint podría esperar `instructor_id`. Verificar. |
| Baja | `ultimo_acceso` | Agregarlo al SELECT y mapeo en `usuario.model.ts` (P21). |

### 5.2 Frontend (Laura)

| Prioridad | Pendiente |
|---|---|
| Media | Novedades de fichas modal (RF-47) — verificar componente |
| Media | Verificar endpoint de competencias con IDs correctos |
| Baja | Paginación en tablas grandes |
| Baja | Responsive mobile |

---

## 6. ESTRUCTURA DE ROLES — Referencia rápida

| ID | Rol | Menú en Sidebar | Puede editar |
|---|---|---|---|
| 1 | Subdirector | Completo (sin Usuarios) | NO (`puedeEditar = false`) |
| 2 | Coordinadora Academica | Completo | SÍ |
| 3 | Asistente Coordinacion | Completo | SÍ |
| 4 | Instructor | Limitado (mis horarios, fichas, competencias) | NO (`puedeEditar = false`) |

Patrón en frontend:
```typescript
const rol = user?.roles?.[0]?.trim() || ""
const puedeEditar = !["Instructor", "Subdirector"].includes(rol)
```

---

## 7. JWT — Payload esperado

```json
{
  "id": 1,           // usuario_id
  "nombre": "Nombre",
  "roles_globales": ["Coordinadora Academica"]  // array de strings Title Case
}
```

El frontend accede al rol como `user.roles[0]` (primer rol del array).

---

## 8. ARCHIVOS MODIFICADOS — Lista completa

### Backend (requieren revisión de Jair)
```
backend/constants/roles.ts
backend/services/auth.service.ts
backend/services/permiso.service.ts
backend/models/horario.model.ts
backend/models/ficha.model.ts
backend/models/rap-ficha-seguimiento.model.ts
backend/schemas/horario.schema.ts
backend/schemas/ficha.schema.ts
backend/schemas/rap-ficha-seguimiento.schema.ts
backend/services/rap-ficha-seguimiento.service.ts
backend/controllers/rap-ficha-seguimiento.controller.ts
backend/routes/rap-ficha-seguimiento.routes.ts
backend/controllers/catalogo.controller.ts
backend/routes/catalogo.routes.ts
backend/server.ts
backend/database.sql
Todas las rutas (*.routes.ts) — guards requireRole actualizados
Todos los services que filtran por rol (P22)
Todos los controllers que pasan req.user (P22)
```

### Frontend (rama dev/laura)
```
conins-frontend/src/pages/index.tsx (dashboard)
conins-frontend/src/pages/alertas.tsx
conins-frontend/src/pages/horarios.tsx
conins-frontend/src/pages/fichas.tsx
conins-frontend/src/pages/asignaciones.tsx
conins-frontend/src/pages/ambientes.tsx
conins-frontend/src/pages/usuarios.tsx
conins-frontend/src/pages/instructores.tsx
conins-frontend/src/pages/competencias.tsx
conins-frontend/src/pages/consultas.tsx
conins-frontend/src/pages/perfil.tsx (NUEVO)
conins-frontend/src/components/layout/Sidebar.tsx
conins-frontend/src/components/layout/Header.tsx
conins-frontend/src/components/ambientes/VerAgendaAmbienteModal.tsx
conins-frontend/src/components/instructores/DetailInstructorModal.tsx
conins-frontend/src/components/fichas/DetailFichaModal.tsx
conins-frontend/src/components/fichas/RapSeguimientoModal.tsx (NUEVO)
conins-frontend/src/components/horarios/CrearHorarioModal.tsx
conins-frontend/src/components/horarios/EditarHorarioModal.tsx
conins-frontend/src/lib/AuthContext.tsx
conins-frontend/src/lib/api.ts
```
