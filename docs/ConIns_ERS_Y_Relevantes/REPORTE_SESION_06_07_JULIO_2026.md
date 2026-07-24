# Reporte de Sesiones — 06 y 07 de Julio de 2026
**CONINS · Control de Instructores · CDMC-SENA**
**Elaborado por:** Jair Enrique Gonzalez Buelvas
**Para:** Laura Sofia Posada
**Fecha:** 07/07/2026

---

## Resumen ejecutivo

En estas dos sesiones se completaron tres grandes bloques de trabajo:

1. **Sesion 06/07 (manana):** Consolidacion de roles del sistema a 4 roles definitivos, reescritura de RF a v7.0 (49 RF), y actualizacion de todas las skills de IA del proyecto.
2. **Sesion 06/07 (tarde):** Revision de la rama `dev/laura`, implementacion de 6 gap items criticos en `main`, y migracion del frontend de Laura a la rama principal.
3. **Sesion 07/07:** Pruebas de navegacion en el app completo. Se detectaron y resolvieron 5 bugs de integracion (CORS, GROUP BY MySQL, tsx watch, super admin, rate limiter).

**Estado del repositorio al cierre:** `main` en `4298612`, limpio, sin errores TypeScript, backend y frontend corriendo.

---

## SESION 06/07/2026 (manana) — Roles, RF v7.0 y Skills

### Consolidacion de roles (decision tomada con Jair)

Se aprobo la **Opcion A**: `lider_programa` eliminado como rol del sistema. Queda como figura informativa (tabla `lider_programa`) sin impacto en permisos.

**4 roles definitivos en BD (Title Case con espacios):**

| ID | Rol | Descripcion |
|----|-----|-------------|
| 1 | Subdirector | Acceso completo al CDMC |
| 2 | Coordinadora Academica | Linea transversal (ADSO, bilingüismo, diseno, gestion) |
| 3 | Asistente Coordinacion | Permisos equivalentes a Coordinadora Academica |
| 4 | Instructor | Solo lectura de sus propias asignaciones |

> IMPORTANTE: Los JWT emitidos antes del 01/07/2026 son invalidos — requieren re-login.
> La convencion cambio de snake_case (`coordinadora_academica`) a Title Case (`Coordinadora Academica`).

**Constantes en `backend/constants/roles.ts`:**
```typescript
ROLES.SUBDIRECTOR
ROLES.COORDINADORA_ACADEMICA
ROLES.ASISTENTE_COORDINACION
ROLES.INSTRUCTOR
ROLES_ADMIN = [Subdirector, Coordinadora Academica, Asistente Coordinacion]
```

**Dos ejes que NO se mezclan:**
- `programas.tipo_linea`: `medular | transversal` (clasificacion administrativa)
- `instructores.tipo_area`: `tecnica | transversal` (clasificacion pedagogica)

`lider_ficha` NO es rol — es `es_lider_ficha BOOLEAN` en tabla `asignacion`.
`lider_programa` NO es rol — es relacion en tabla `lider_programa` (instructor_id, programa_id).

---

### RF v7.0 — 49 Requisitos Funcionales en 9 modulos

El archivo vigente es `CONINS_Requisitos_Funcionales_v7_0.txt`.

**Cambios clave respecto a v6.x:**
- RF-30 y RF-43 eliminados (lider asigna instructores, lider consulta sus programas). La funcionalidad quedo absorbida por Coordinadora Academica en RF-27, RF-28 y RF-41.
- RF-08 al RF-13: "lideres e instructores" simplificado a "instructores".
- RF-17: eliminada referencia a "lideres previamente registrados" en creacion de fichas.
- RF-25 y RF-26: reescritos para gestion informativa de lider_programa.
- RF-39 y RF-40: notificaciones van a Coordinadora Academica y Asistente Coordinacion (no mas a lider de programa).
- Nuevos: RF-48 (filtrado por rol — critico seguridad), RF-49 (tipos actividad), RF-50 (seguimiento RAPs), RF-51 (auditoria).

**RN-12 marcada obsoleta:** la validacion de alcance de lider ya no aplica como permiso.

---

### Skills de IA actualizadas a v5

Las 5 skills del proyecto en `.claude/skills/conins-core/` fueron reescritas para reflejar los 4 roles Title Case, schema v5 (27 tablas), y arquitectura actual:

- `auth-multirole`
- `role-based-access-control`
- `asignacion-competencia-integrity`
- `horario-carga-validation`
- `backend-clean-architecture`

---

## SESION 06/07/2026 (tarde) — Gap items de dev/laura + migracion frontend

### Gap items implementados en main

Se revisaron todos los commits de `dev/laura` y se portaron 6 items pendientes al backend de main:

#### P22 — Filtrado por rol en listados generales (CRITICO — seguridad)

**Rutas afectadas:** `GET /api/horarios`, `GET /api/fichas`, `GET /api/asignaciones`, `GET /api/alertas`

**Antes:** todos los usuarios recibían el dataset completo.
**Despues:** cuando el JWT tiene UNICAMENTE el rol `Instructor`, el sistema filtra automaticamente por `instructor_id` del usuario autenticado.

**Capas implementadas:**
- `models`: nuevos metodos `findAllByInstructorId()` en `horario.model.ts`, `ficha.model.ts`, `asignacion.model.ts`
- `alerta.controller.ts`: filtra por `i.usuario_id` cuando el rol es Instructor
- `services`: reciben `userId + roles` como parametros y deciden que model llamar
- `controllers`: pasan `req.user` a los services

Los roles admin (Subdirector, Coordinadora Academica, Asistente Coordinacion) siguen recibiendo el dataset completo.

#### P23 — RF-37: Revalidacion de reglas de negocio al editar horario

`horario.service.ts update()` fue reescrito. Ahora al hacer `PATCH /api/horarios/:id` se revalidan:

- **RN-04** (hard block): horarios superpuestos del mismo instructor — HTTP 409
- **RN-09** (hard block): ambiente bloqueado — HTTP 409
- **RN-05** (soft alert): ambiente ocupado por otro instructor — no bloquea
- **RN-03** (soft alert): instructor de planta en jornada nocturna/finde — no bloquea

Fix critico que se tuvo que resolver: `update()` necesita los IDs numericos (instructor_id, jornada_id, ambiente_id) para revalidar, pero `findById()` retorna un `HorarioDetail` con nombres en texto. Se agrego una lectura raw con `SELECT *` antes de revalidar.

**Nota pendiente para Laura:** Confirmar con Leidy si el alcance cubre la expectativa de RF-37.

#### P28 — RF-50: Modulo rap-ficha-seguimiento

Portado completo desde `dev/laura`. Archivos nuevos en main:

```
backend/services/rap-seguimiento.service.ts
backend/controllers/rap-seguimiento.controller.ts
backend/routes/rap-seguimiento.routes.ts
backend/schemas/rap-seguimiento.schema.ts
```

`rap-ficha-seguimiento.model.ts` ya existia en main — se agrego `findByFicha()`.
Registrado en `server.ts` bajo `/api/rap-seguimiento`.

**Endpoints disponibles:**
```
GET  /api/rap-seguimiento/ficha/:fichaId          — todos los RAPs de una ficha
GET  /api/rap-seguimiento/asignacion-competencia/:acId
GET  /api/rap-seguimiento/disponibles/:fichaId    — RAPs sin seguimiento registrado
GET  /api/rap-seguimiento/:id
POST /api/rap-seguimiento                         — crear (requiere ROLES_ADMIN)
PATCH /api/rap-seguimiento/:id                    — actualizar fechas/estado
PATCH /api/rap-seguimiento/:id/evaluar            — cambiar estado_aprobacion (requiere ROLES_ADMIN)
PATCH /api/rap-seguimiento/:id/toggle             — activar/desactivar
```

#### P29 — RF-49: Tipos de actividad en catalogo

`GET /api/catalogo/tipos-actividad` implementado en `catalogo.controller.ts` y registrado en `catalogo.routes.ts`. Consulta la tabla `tipos_actividad` (tabla 26 del schema v5).

#### P24 — Alias /mis en notificaciones

`GET /api/notificaciones/mis` agregado como alias identico a `GET /api/notificaciones`. El frontend de Laura llama este path en `api.ts getMis()`.

#### P21 — ultimo_acceso en listado de usuarios

`u.ultimo_acceso` agregado al SELECT y mapping en `findAll()` y `findAllActive()` de `usuario.model.ts`. La interfaz `UsuarioWithRoles` fue actualizada.

---

### Fix database.sql

`sp_crear_instructor` tenia `VALUES (p_usuario_id, 5)` — el ID 5 no existe desde que se reestructuraron los roles. Corregido a `VALUES (p_usuario_id, 4)` (ID 4 = Instructor).

---

### Migracion frontend dev/laura → main

El frontend completo de `dev/laura` fue migrado a main mediante cherry-pick del directorio `src/`. El proceso:

1. Copia de `src/` de la rama Laura a main
2. Actualizacion de `package.json` con las dependencias nuevas que Laura habia agregado
3. Completar `api.ts` con los namespaces que faltaban: `users` y `rapSeguimiento`
4. `npm install` y verificacion TypeScript (`tsc --noEmit`) — limpio
5. Commit `07de6bd` — 37 archivos

**Nota para Laura:** `index.tsx` (dashboard) usa `api.instructors.getAll()` (namespace en ingles). Funciona porque `api.ts` tiene ambos namespaces: `instructors` y `instructores`. No es un bug.

---

## SESION 07/07/2026 — Pruebas de integracion y fixes de bugs

Al probar la navegacion completa del frontend con el backend encendido, se detectaron y resolvieron 5 bugs:

### Bug 1 — CORS bloqueado por orden de middlewares (critico)

**Sintoma:** Al navegar entre modulos (ej. Instructores → Dashboard), aparecia un error en pantalla: `TypeError: Failed to fetch`. En DevTools del navegador:
```
Access to fetch at 'http://localhost:5000/api/horarios' from origin 'http://localhost:3000' 
has been blocked by CORS policy: Response to preflight request doesn't pass 
access control check: No 'Access-Control-Allow-Origin' header is present on the 
requested resource.
```

**Causa raiz:** En `backend/server.ts`, el middleware `rateLimiterGlobal` estaba registrado ANTES de `cors()`. Cada navegacion genera ~6 HTTP requests (3 datos + 3 preflights OPTIONS). Con el limite de 100 req/15min, el rate limiter disparaba un 429 sin incluir el header `Access-Control-Allow-Origin`. El browser interpreta eso como un fallo CORS — no como 429 — y bloquea todos los requests subsiguientes de esa pagina.

**Fix en `backend/server.ts`:**
```typescript
// ANTES (roto):
app.use(securityHeaders);
app.use(rateLimiterGlobal);   // 429 sin CORS headers
app.use(cors({...}));         // demasiado tarde

// DESPUES (correcto):
app.use(cors({                // primero — todas las respuestas llevan CORS headers
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(securityHeaders);
app.use(rateLimiterGlobal);
```

Se agrego `OPTIONS` a la lista de metodos permitidos para que los preflights siempre se resuelvan en el CORS middleware.

### Bug 2 — ER_WRONG_FIELD_WITH_GROUP en asignacion.model.ts

**Sintoma:** `GET /api/asignaciones` retornaba error MySQL:
```
ER_WRONG_FIELD_WITH_GROUP: 'ac.competencia_id' isn't in GROUP BY
```

**Causa raiz:** `findById()` y `findHistoricas()` en `asignacion.model.ts` tenian `ac.competencia_id` en el SELECT pero no en el GROUP BY — viola el modo `only_full_group_by` de MySQL.

**Fix:** GROUP BY eliminado de ambos metodos (no habia funciones de agregacion que lo justificaran).

### Bug 3 — tsx watch reiniciando el backend en cada error

**Sintoma:** El backend sentia micro-outages de 1-2 segundos cada vez que una request generaba un error (4xx o 5xx). Esto causaba que requests posteriores fallaran intermitentemente con `Failed to fetch` mientras el proceso se reiniciaba.

**Causa raiz:** `middleware/errorHandler.ts` escribe en `backend/error.log` via `fs.appendFileSync()`. tsx watch monitorea todos los archivos del directorio y detecta ese cambio — reinicia el proceso como si fuera un cambio de codigo.

**Fix en `backend/package.json`:**
```json
"dev": "tsx watch --ignore \"**/*.log\" server.ts"
```

### Bug 4 — Super admin rompia GET /api/auth/perfil

**Sintoma:** Al hacer login con `admin@conins.sena` (super admin de variables de entorno), el Header del frontend mostraba error al cargar el perfil.

**Causa raiz:** El JWT del super admin tenia `id: 1` hardcodeado. `getOwnProfile(1)` consulta `UsuarioModel.findById(1)` — si el usuario 1 no existe en la BD de pruebas, lanza `NotFoundError`.

**Fix en `backend/services/auth.service.ts`:**
- Super admin JWT usa `id: 0` (MySQL AUTO_INCREMENT nunca genera 0 — es un sentinel seguro)
- `getOwnProfile()` retorna early para `userId === 0` sin consultar la BD:

```typescript
async getOwnProfile(userId: number) {
  if (userId === 0) {
    return {
      id: 0,
      nombre: 'Administrador',
      email: process.env.SUPER_USER ?? 'admin@conins.sena',
      activo: true,
      roles: ['Subdirector'],
    };
  }
  // ... resto del flujo normal
}
```

### Bug 5 — Rate limiter bloqueando pruebas de desarrollo

**Sintoma:** Despues de varios minutos de pruebas, todas las requests retornaban `429 Demasiadas peticiones`. El limite de 100 req/15min es facil de alcanzar en desarrollo (cada navegacion genera ~6 requests; ~16 navegaciones = 429).

**Fix en `backend/middleware/security.ts`:**
```typescript
const isDev = process.env.NODE_ENV !== 'production';

export const rateLimiterGlobal = rateLimit({
  // ...
  skip: () => isDev,  // rate limiting desactivado en desarrollo
});

export const authRateLimiter = rateLimit({
  // ...
  skip: () => isDev,  // incluye el limiter de /login (max: 10)
});
```

En produccion (`NODE_ENV=production`) los limites aplican normalmente.

---

## Estado del repositorio al cierre

**Commits de estas sesiones:**
- `07de6bd` — frontend Laura + gap items backend (P21-P24, P28, P29)
- `809f22e` — fixes: CORS order, GROUP BY, tsx watch, super admin id:0
- `4298612` — chore: untrack error.log + package-lock.json
- `ed2f6c8` (aprox.) — fix rate limiter en dev + docs ConIns_Contexto_Actual sync

**Backend — modulos implementados y funcionales:**
Auth, Instructores, Fichas, Horarios, Asignaciones, Notificaciones, Ambientes, Consultas, Auditoria, Catalogo, Programas, Alertas, Rap-Seguimiento.

**Reglas de negocio:** RN-01 a RN-17 completas (RN-12 marcada obsoleta con los nuevos roles).

**Para arrancar en local:**
```bash
# Backend
cd backend && npm run dev
# Requiere .env con DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, SUPER_USER, SUPER_USER_PASSWORD

# Frontend
cd frontend && npm run dev
# Requiere frontend/.env.local con NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Pendientes activos relevantes para Laura

| ID | Descripcion | Impacto |
|----|-------------|---------|
| P4 | Lista oficial de instructores con correo estandarizado | Bloquea seed_data.sql final |
| P16 | Infraestructura de pruebas automatizadas | Pendiente Fase 4 |
| P17 | xss-clean, CSRF, validacion en rutas pendientes | Seguridad produccion |
| P25 | Alinear version del schema entre database.sql (v5) y Logica_Negocio_v5.md (v5.2) | Documentacion |
| P26 | Usuarios 5, 10, 11, 12 (linea medular Calzado/Cuero) sin rol | Pendiente expansion |

**Pendiente de confirmacion con Laura:**
- RF-37 (`update()` horario revalida reglas de negocio): confirmar con Leidy si el alcance cubre la expectativa.

---

*Documento generado el 07/07/2026. Proxima sesion: a coordinar.*
