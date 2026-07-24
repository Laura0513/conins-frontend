# CONINS — Registro de Contexto y Cambios
**Centro del Diseño y Manufactura del Cuero (CDMC) — SENA**
*Última actualización: 2026-06-30 (fix database.sql + seed_data.sql v5)*

---

## Equipo del proyecto

| Rol | Nombre | Observación |
|---|---|---|
| Instructor líder técnico | Luis Eladio Porras Camargo | lporras@sena.edu.co · lporras567@gmail.com |
| Instructor líder anterior | Wilmar Alexander Zapata (Soywaz) | Autor del repo base en GitHub |
| Instructor de seguimiento | Gloria Eugenia Jaramillo | CDMC |
| Coordinadora Académica | Leidy Johana Ruiz Cortés | ljruizc@sena.edu.co |
| Coordinador Académico Transversal (anterior) | Juan Pablo Hoyos Maya | También líder del área Bilingüismo |
| Coordinador Académico Medular | Paul Ernesto Tamayo Caviedes | Línea calzado, marroquinería, curtición |
| Subdirector de Centro | Dyron Javier Ramírez Osorio | Administrador principal del sistema |
| Aprendiz (backend + BD + análisis) | Jair Enrique González Buelvas | Rama `dev/Jair` |
| Aprendiz (frontend + diseño) | Laura Sofía Posada | Rama `dev/laura` |

**Repo principal:** `https://github.com/Soywaz/conins`
**Directorio local Jair:** `D:\2_ConIns\Jair_ConIns`
**Directorio referencia instructor:** `D:\2_ConIns\WAZ_ConIns`

---

## Descripción oficial del sistema

> Desarrollar un sistema de información web que permita gestionar, controlar y optimizar la asignación académica y operativa de los instructores del Centro del Diseño y Manufactura del Cuero (CDMC) del SENA, mediante la administración estructurada de competencias, resultados de aprendizaje (RAPs), ambientes de formación, fichas y horarios. El sistema garantiza el cumplimiento de la carga horaria reglamentaria, previene inconsistencias como la duplicidad de asignaciones por ficha, y gestiona situaciones operativas como novedades administrativas de instructores y bloqueos temporales de ambientes.
>
> La solución incorpora un modelo de control de acceso basado en roles jerárquicos (Subdirector, Coordinadores de Línea Medular y Transversal, Líderes de Programa e Instructores), con soporte para múltiples roles simultáneos por usuario. Incluye funcionalidades de consulta, filtrado, alertas automáticas, notificaciones internas y por correo electrónico, y generación de reportes exportables en PDF para la toma de decisiones por parte de los directivos del centro.
>
> La solución se implementa mediante una arquitectura web cliente-servidor: frontend desarrollado con Next.js 15 (Pages Router), React 19, TypeScript y Tailwind CSS 4, consumiendo una API REST construida con Node.js, Express 5 y TypeScript bajo arquitectura MVC con módulos ESM6. La persistencia de datos se gestiona en una base de datos relacional MySQL (27 tablas, schema v5.2), administrada desde phpMyAdmin, garantizando integridad referencial, trazabilidad de asignaciones y disponibilidad de la información mediante eliminación lógica universal.

---

## Stack tecnológico vigente

| Capa | Tecnología |
|---|---|
| Frontend | **Next.js 15** (Pages Router) · React 19 · TypeScript · Tailwind CSS 4 |
| Íconos | Lucide React |
| HTTP client | Fetch nativo |
| Backend | Node.js · Express 5 · TypeScript · MVC · ESM6 |
| Auth | JWT + bcrypt |
| Correo | Nodemailer |
| Base de datos | MySQL — `conIns` |
| Administración BD | phpMyAdmin · Laragon |
| Control de versiones | Git + GitHub |
| IDE | VS Code |

> **Vite eliminado.** Frontend migra a Next.js 15 con Pages Router — confirmado en feedback con Juan Pablo Hoyos, Wilmar Zapata y Gloria Jaramillo. Zustand en revisión para Fase 3.

---

## Modelo de datos — BD `conIns` (schema v5 — 25 tablas — verificado 30/06/2026)

> Nota: la tabla siguiente resume los grupos principales. Para el detalle de tablas agregadas tras el cierre de v4 (tipos_novedad_instructor, tipos_novedad_ambiente, tipos_novedad_ficha, ficha_novedades, lider_id en fichas, ultimo_acceso en usuarios, tipo_documento/documento en usuarios), ver las entradas del 09/06, 10/06 y 11/06 en el Historial de cambios más abajo.
>
> **Corrección 30/06/2026:** el encabezado anterior decía "v5.2 — 27 tablas". Conteo directo de `CREATE TABLE IF NOT EXISTS` en `database.sql` (cuyo comentario interno dice `Schema: v5`) confirma 25 tablas — `lider_id` y `ultimo_acceso` son columnas agregadas a tablas existentes, no tablas nuevas. Ver entrada del 30/06/2026 abajo para el detalle completo.

| Tabla | Propósito |
|---|---|
| `roles` | 5 entradas: Subdirector · Coordinador Medular · Coordinador Transversal · Lider Programa · Instructor |
| `usuarios` | Autenticación centralizada |
| `usuario_roles` | N:M usuarios ↔ roles |
| `instructores` | `tipo_contrato` + `tipo_area` |
| `lider_programa` | Instructor ↔ programa(s) que lidera |
| `instructor_competencias_habilitadas` | Competencias por contrato |
| `instructor_novedades` | Licencias, incapacidades, comisiones |
| `programas` | Seed — sin CRUD en UI. `tipo_formacion ENUM('titulada','complementaria','operario')` |
| `competencias` | Por programa — seed |
| `raps` | Por competencia — seed, heredados al asignar competencia |
| `ambientes` | Aulas 200–208, talleres T1–T4 — seed |
| `ambiente_bloqueos` | Bloqueos temporales con expiración automática |
| `jornadas` | Mañana · mixta · noche · virtual — seed |
| `fichas` | `etapa ENUM('lectiva','productiva')` · número, programa, jornada, modalidad |
| `asignacion` | `instructor → ficha` · `es_lider_ficha` · `es_provisional` |
| `asignacion_competencia` | `asignacion → competencia` · trazabilidad |
| `horarios` | Bloques de clase |
| `alertas` | Alertas automáticas persistidas |
| `notificaciones` | Mensajes a usuarios específicos — campanita en dashboard |

> `asignacion_rap` eliminada — reemplazada por `asignacion + asignacion_competencia`. RAPs heredados al asignar competencia.
> `lider_ficha` eliminado de `roles` — es `es_lider_ficha BOOLEAN DEFAULT FALSE` en `asignacion`.

---

## Arquitectura del backend (Fase 3 — TypeScript + MVC + ESM6 — implementado al 28/05/2026)

```
backend/
├── config/
│   ├── db.ts                    Conexión MySQL con pool
│   └── mail.ts                  Nodemailer transporter (condicional)
├── constants/
│   ├── roles.ts                 ROLES.SUBDIRECTOR, COORDINADOR_MEDULAR, etc.
│   ├── alertas.ts               Tipos de alertas
│   ├── etiquetas.ts             Etiquetas de notificaciones
│   └── horario.ts               Constantes de horarios
├── controllers/                 Solo HTTP — sin lógica de negocio
│   ├── auth.controller.ts       login, crearPassword, cambiarPassword, perfil
│   ├── instructor.controller.ts CRUD + competencias + novedades + detalle
│   ├── ficha.controller.ts      CRUD + finalizar + toggle estado
│   ├── horario.controller.ts    CRUD + toggle estado + alertas
│   ├── asignacion.controller.ts CRUD + desactivar + provisionales
│   ├── notificacion.controller.ts GET + marcar leida
│   ├── programa.controller.ts   GET lista simple
│   └── catalogo.controller.ts   GET areas, programas, competencias, raps
├── services/                    Lógica de negocio + validaciones RN
│   ├── auth.service.ts          Login, registro, cambio password
│   ├── instructor.service.ts    CRUD + competencias + novedades + detalle + horas_semana + tiene_novedad
│   ├── ficha.service.ts         CRUD + finalizar + toggle estado + validación numero único
│   ├── horario.service.ts       CRUD + RN-04/RN-05/RN-14 + validación horas + alertas
│   ├── asignacion.service.ts    CRUD + RN-06/RN-08/RN-12 + trazabilidad RN-16
│   ├── notificacion.service.ts  RF-38 a RF-40 + triggers automáticos
│   ├── permiso.service.ts       RN-12 validaciones de alcance líder/coordinador
│   └── catalogo.service.ts      Áreas, programas, competencias, raps
├── models/                      Solo queries — sin lógica de negocio
│   ├── usuario.model.ts         findByEmail, findById, create, updatePassword
│   ├── rol.model.ts             findByUsuarioId, assignRoles
│   ├── instructor.model.ts      CRUD + competencias + novedades + horas + tieneNovedadActiva + getDetalle
│   ├── ficha.model.ts           CRUD + finalizar + toggle + findByNumero
│   ├── horario.model.ts         CRUD + hasOverlap + hasAmbienteOcupado + isInstructorDePlanta
│   ├── asignacion.model.ts      CRUD + desactivar + tieneNovedadActiva + hasRapEnFicha
│   ├── asignacion-competencia.model.ts  registrarCambioInstructor + updateCompetencia
│   ├── notificacion.model.ts    crear + findByUsuario + marcarLeida + getNoLeidasCount
│   ├── programa.model.ts        findAll + findAllSimple + findById
│   └── ... (area, competencia, rap, ambiente, alerta, jornada)
├── middleware/
│   ├── auth.ts                  verifyToken + requireRole[]
│   ├── validate.ts              Zod schema validation
│   ├── security.ts              Helmet + rate-limit
│   ├── audit.ts                 Audit logging
│   └── errorHandler.ts          Error handler centralizado
├── routes/                      auth · instructores · fichas · horarios
│                                asignaciones · notificaciones · programas · catalogo
├── schemas/                     Zod schemas para validación
│   ├── auth.schema.ts
│   ├── instructor.schema.ts
│   ├── ficha.schema.ts
│   ├── horario.schema.ts
│   ├── asignacion.schema.ts
│   └── ...
├── utils/
│   ├── errors.ts                AppError, NotFoundError, ConflictError, ValidationError, ForbiddenError
│   ├── response.ts              ApiResponse.success / .created / .error / .paginated
│   └── asyncHandler.ts          Wrapper async para controllers
├── database.sql                 Schema v4 — 20 tablas (actualizado 28/05/2026)
├── seed_data.sql                Datos iniciales del CDMC
└── server.ts                    Express app + rutas + middleware
```

**Módulos implementados al 28/05/2026:**
- ✅ Auth (login, crear-password, cambiar-password, perfil)
- ✅ Instructores (CRUD + competencias + novedades + detalle completo)
- ✅ Fichas (CRUD + finalizar + toggle estado)
- ✅ Horarios (CRUD + toggle estado + validaciones RN-04/RN-05/RN-14)
- ✅ Asignaciones (CRUD + desactivar + provisionales + validaciones RN-06/RN-08/RN-12 + trazabilidad RN-16)
- ✅ Notificaciones (RF-38 a RF-40 — internas + correo Nodemailer)
- ✅ Programas (GET lista simple para dropdowns)
- ✅ Catálogo (GET áreas, programas, competencias, raps)

---

## Roles del sistema (tabla `roles` — 5 entradas exactas)

| ID | Nombre | Nivel | Alcance |
|---|---|---|---|
| 1 | Subdirector | 1 | CDMC completo |
| 2 | Coordinador Medular | 2 | Línea medular |
| 3 | Coordinador Transversal | 2 | Línea transversal |
| 4 | Lider Programa | 3 | Su programa |
| 5 | Instructor | 4 | Solo lectura |

---

## Reglas de negocio vigentes

| RN | Regla | Tipo |
|---|---|---|
| RN-01 | Onboarding dos pasos — HTTP 403 si correo no habilitado | Hard |
| RN-02 | Correo como identificador único — sin restricción de dominio | Hard |
| RN-03 | Alerta `JORNADA_RESTRINGIDA` — planta en nocturna o fin de semana | Soft |
| RN-04 | Hard block horarios superpuestos — HTTP 409 | Hard |
| RN-05 | Soft alert `AMBIENTE_OCUPADO` | Soft |
| RN-06 | `UNIQUE(ficha_id, rap_id)` — HTTP 409 | Hard |
| RN-07 | Alerta `CARGA_HORARIA` fuera de rango 20–40h | Soft |
| RN-08 | Instructor excluido mientras novedad vigente — reincorporación automática | Auto |
| RN-09 | Ambiente excluido mientras bloqueo vigente — reincorporación automática | Auto |
| RN-10 | Soft delete universal — `activo BOOLEAN DEFAULT TRUE` | Hard |
| RN-11 | Provisional: autorizante + fecha + motivo obligatorios | Hard |
| RN-12 | Líder solo asigna en sus programas | Hard |
| RN-13 | Competencia habilitada por contrato | Hard |
| RN-14 | Fichas virtuales sin ambiente físico | Hard |
| RN-15 | RAPs heredados al asignar competencia | Hard |
| RN-16 | Nomenclatura "ficha" configurable en frontend | Soft |

---

## Requisitos Funcionales — v6.1 (47 RF en 8 módulos, vigente al 11/06/2026)

| Módulo | Rango | Total | Estado ERS |
|---|---|---|---|
| AUTH | RF-01 al RF-13, RF-46 | 14 | ✅ Completo |
| Instructores | RF-14 al RF-16 | 3 | ✅ Completo |
| Fichas | RF-17 al RF-20, RF-47 | 5 | ✅ Completo |
| Horarios | RF-21 al RF-24 | 4 | ✅ Completo |
| Asignaciones | RF-25 al RF-30 | 6 | ✅ Completo |
| Ambientes | RF-31 | 1 | ✅ Completo |
| Alertas, Validaciones y Notificaciones | RF-32 al RF-40 | 9 | ✅ Completo |
| Consulta y Visualización | RF-41 al RF-45 | 5 | ✅ Completo |
| **Total** | | **47** | ✅ ERS v3.0 + RF-46, RF-47 |

> RF-46 (documento de identidad del usuario) y RF-47 (novedad administrativa de ficha) se agregaron el 10/06/2026 — ver entrada correspondiente en el Historial de cambios.

---

## Estado del frontend (al 28/05/2026)

**Stack:** Next.js 15 · Pages Router · React 19 · TypeScript · Tailwind CSS 4 · Lucide React · Fetch nativo

**Páginas implementadas:**
- `/auth` — Login + Crear contraseña (dos tabs)
- `/` — Dashboard con tarjetas de resumen
- `/instructores` — CRUD completo + filtros + modales (crear, editar, detalle, novedad)
- `/fichas` — CRUD completo + filtros + modales (crear, editar, detalle) + finalizar
- `/horarios` — CRUD completo + filtros + modales (crear, editar) + toggle estado con motivo
- `/asignaciones` — CRUD completo + tabs (activas, provisionales, históricas) + modales (crear, editar, detalle, provisional)

**Componentes modulares:**
- Auth: `LoginForm`, `CreatePasswordForm`
- Layout: `DashboardLayout`, `Sidebar`, `Header`
- Instructores: `CreateInstructorModal`, `EditInstructorModal`, `DetailInstructorModal`, `NovedadModal`
- Fichas: `CrearFichaModal`, `EditFichaModal`, `DetailFichaModal`
- Horarios: `CrearHorarioModal`, `EditarHorarioModal`
- Asignaciones: `CrearAsignacionModal`, `EditAsignacionModal`, `DetailAsignacionModal`, `RegistrarProvisionalModal`
- UI: `Toast`, `ConfirmDialog`

**Hooks y contexto:**
- `useProtectedRoute` — protección de rutas con redirección a /auth
- `AuthContext` — gestión de sesión con persistencia en localStorage
- `ToastContext` — notificaciones toast
- `api.ts` — cliente HTTP con Fetch nativo
- `terminology.ts` — nomenclatura configurable (RN-17)

**Páginas pendientes:**
- `/alertas` — listado de alertas
- `/usuarios` — gestión de usuarios
- `/ambientes` — gestión de ambientes
- `/consultas` — búsqueda global
- `/perfil` — perfil de usuario

---

## Pendientes activos (vigente al 30/06/2026)

| # | Pendiente | Responsable | Prioridad |
|---|---|---|---|
| P4 | Lista oficial de instructores con correo estandarizado | CDMC → Jair | 🟡 Media |
| ~~P7~~ | ~~Migración a TypeScript + Next.js 15 + MVC + ESM6~~ | ~~Resuelto 28/05/2026~~ | ✅ |
| P8 | Apellido co-líder Rivera (Técnico Medular) | CDMC | 🟢 Baja |
| P9 | Apellido Catalina (líder Talento Humano) | CDMC | 🟢 Baja |
| P10 | Revisar Resolución 1415/2012 y Acuerdo 0003/2017 | Jair | 🟢 Baja |
| P11 | Definir gestión de estado en Next.js 15 (¿Zustand o nativo?) | Jair + Laura | 🟡 Media — evaluar en Fase 4 |
| ~~P14~~ | ~~Implementar RN-09 (bloqueo temporal de ambiente)~~ | ~~Resuelto 09/06/2026~~ | ✅ |
| ~~P15~~ | ~~Implementar RN-13 (validar competencia habilitada antes de asignar)~~ | ~~Resuelto 09/06/2026~~ | ✅ |
| P16 | Configurar infraestructura de pruebas automatizadas | Jair + Laura | 🟡 Media — Fase 4 |
| P17 | Implementar seguridad: xss-clean, CSRF, validación en rutas pendientes | Jair | 🟡 Media |
| P18 | Continuous Integration (GitHub Actions) | Jair | 🟢 Baja — Fase 4 |
| P19 | Docker (Dockerfile + docker-compose) | Jair | 🟢 Baja — Fase 5 |
| P20 | Migración a PostgreSQL | Jair | 🟢 Baja — Fase 6 |
| P21 | `ultimo_acceso` no se devuelve en `GET /api/auth/usuarios` — columna existe y se actualiza en login, falta agregarla al SELECT/mapeo de `usuario.model.ts` | Jair | 🟡 Media |
| P22 | Sin filtrado por rol en `GET /api/horarios`, `/fichas`, `/asignaciones`, `/alertas` — solo exigen `verifyToken`, devuelven todo el dataset sin importar el rol | Jair | 🔴 Alta — seguridad |
| P23 | RF-37 parcial — `update()` de horario no recalcula RN-03/RN-05 ni permite reasignar `instructor_id`; confirmar alcance con Laura | Jair | 🟡 Media |
| P24 | Alinear `GET /api/notificaciones` (real) vs `/api/notificaciones/mis` (pedida por Laura) | Jair | 🟢 Baja |
| P25 | Unificar nomenclatura de versión del schema SQL entre `database.sql` (v5, 25 tablas) y la documentación (registraba v5.2, 27 tablas) | Jair | 🟢 Baja |

> P1–P3, P5–P6 resueltos el 04/05/2026. P12 y P13 (páginas y modales del frontend) quedaron cubiertos con el merge de Laura del 09/06/2026 (11 páginas, 18 componentes). P14 y P15 resueltos el 09/06/2026. P21–P25 detectados el 30/06/2026 en verificación directa de código.

---

## Archivos de referencia del proyecto

| Archivo | Versión | Descripción |
|---|---|---|
| `CONINS_contexto_general.md` | v9.3 | Contexto completo |
| `CONINS_Requisitos_Funcionales_v6_1.txt` | v6.1 | 47 RF — fuente de verdad |
| `CONINS_Logica_Negocio_v5.md` | v5.2 | Reglas de negocio y arquitectura — pendiente alinear conteo de tablas (P25) |
| `CRONOGRAMA.md` | v4.2 | Fases, fechas y estados |
| `ERS_CONINS_v3.docx` | v3.0 | ERS IEEE 830 completo |
| `SENA_identidad_visual_resumen_tecnico.md` | — | Paleta y tipografía SENA 2024 |
| `.agents/skills/conins-core/` | — | 5 skills de Claude Code |
| `.claude/CLAUDE.md` | — | Governance del proyecto |

---

## Historial de cambios

### 2026-07-06 — Jair Enrique Gonzalez Buelvas

**RF v7.0 + roles finales + skills actualizadas + gap items dev/laura implementados**

**Consolidacion de roles (manana):**
- Opcion A aprobada: `lider_programa` eliminado como rol del sistema. 4 roles definitivos en BD (Title Case): `Subdirector` (ID 1), `Coordinadora Academica` (ID 2), `Asistente Coordinacion` (ID 3), `Instructor` (ID 4).
- `CONINS_Requisitos_Funcionales_v7_0.txt` reescrito: 49 RF en 9 modulos, `lider_programa` absorbido por Coordinadora Academica.
- `CONINS_Logica_Negocio_v5.md` y `CONINS_contexto_general.md` actualizados a roles finales.
- `database.sql`: views `vw_fichas_con_lider` y `vw_resumen_horario_instructor` corregidas (columnas inexistentes).
- Limpieza de documentos de contexto: marcadores obsoletos eliminados, referencias a roles old snake_case removidas.

**Skills conins-core actualizadas a v5 (manana):**
- `auth-multirole`, `role-based-access-control`, `asignacion-competencia-integrity`, `horario-carga-validation`, `backend-clean-architecture` — todas reescritas con 4 roles Title Case, schema v5, arquitectura actual.

**Revision dev/laura + implementacion de gap items (tarde):**

Revision completa de la rama `dev/laura` (ZIP descargado localmente). Implementados en main:

- **P22 (CRITICO — seguridad):** `GET /api/horarios`, `/fichas`, `/asignaciones`, `/alertas` ahora filtran por rol. Instructor solo ve sus propios registros. Implementado en models (`findAllByInstructorId`), services (param `userId + roles`), controllers (pasan `req.user`), y `alerta.controller.ts` (filtra por `i.usuario_id`).
- **P23 (RF-37):** `horario.service.ts update()` reescrito — ahora revalida RN-04 (hard block), RN-09 (hard block), RN-05 (soft alert — ambiente ocupado) y RN-03 (soft alert — jornada restringida). Fix critico: `update()` leia raw record para obtener IDs numericos que `findById()` (retorna HorarioDetail) no expone. Semana se toma del registro existente, no de `getLunesSemanaActual()`. Controller `update` propaga alertas en respuesta.
- **P28 (RF-50):** Modulo `rap-ficha-seguimiento` completo portado a main. Archivos nuevos: `rap-seguimiento.service.ts`, `rap-seguimiento.controller.ts`, `rap-seguimiento.routes.ts`, `rap-seguimiento.schema.ts`. Model (`rap-ficha-seguimiento.model.ts`) ya existia en main — agregado `findByFicha()`. Registrado en `server.ts` bajo `/api/rap-seguimiento`. Endpoint `GET /ficha/:fichaId/disponibles` para RAPs sin seguimiento.
- **P29 (RF-49):** `GET /api/catalogo/tipos-actividad` — funcion `getTiposActividad` en controller y ruta en routes.
- **P24:** Alias `GET /api/notificaciones/mis` agregado a `notificacion.routes.ts` — frontend llama este path en `api.ts getMis()`.
- **P21:** `u.ultimo_acceso` agregado al SELECT y mapping en `findAll()` y `findAllActive()` de `usuario.model.ts`. Interfaz `UsuarioWithRoles` actualizada.
- **database.sql:** `sp_crear_instructor` — `VALUES (p_usuario_id, 5)` corregido a `VALUES (p_usuario_id, 4)` (ID 4 = Instructor).

tsc limpio al cierre de sesion.

**Commits:** `d5142f6` (limpieza docs) · `2a075e6` (RF v7.0 + vistas + contexto) · `07de6bd` (gap items + frontend Laura)

---

### 2026-07-07 — Jair Enrique Gonzalez Buelvas

**Bugs de sesion de pruebas: CORS + GROUP BY + tsx watch + super admin**

Durante prueba de navegacion entre modulos del frontend se detectaron y resolvieron 4 bugs:

**B1 — CORS bloqueado por middleware order (critico):**
- Root cause: `rateLimiterGlobal` registrado ANTES de `cors()` en `server.ts`. Cuando el rate limiter dispara 429 (facil de alcanzar durante pruebas — 100 req/15min, ~6 requests por navegacion), la respuesta sale sin `Access-Control-Allow-Origin`. El browser lo interpreta como fallo CORS y bloquea TODOS los requests subsiguientes con `TypeError: Failed to fetch`.
- Fix: `cors()` movido a primera posicion en el stack de middlewares, antes de `securityHeaders` y `rateLimiterGlobal`. OPTIONS preflight ahora es manejado por CORS antes de llegar al rate limiter.

**B2 — ER_WRONG_FIELD_WITH_GROUP en asignacion.model.ts:**
- `findById` y `findHistoricas` tenian `ac.competencia_id` en SELECT sin estar en GROUP BY (MySQL `only_full_group_by`).
- Fix: GROUP BY eliminado de ambos metodos. `findAll` y `findAllByInstructorId` ya estaban limpios desde sesion anterior.

**B3 — tsx watch reiniciando backend en cada error:**
- Root cause: `errorHandler.ts` escribe en `error.log` via `fs.appendFileSync`. tsx watch detecta el cambio de archivo y reinicia el proceso — outage de 1-2 seg por cada respuesta de error.
- Fix: `tsx watch --ignore "**/*.log"` en `backend/package.json`.

**B4 — super admin JWT con id:1 rompia GET /api/auth/perfil:**
- Super admin (`admin@conins.sena`) tenia `id: 1` hardcodeado en JWT. `getOwnProfile(1)` consulta la BD — si usuario 1 no existe, lanza `NotFoundError`.
- Fix: JWT usa `id: 0` (sentinel — MySQL AUTO_INCREMENT nunca genera 0). `getOwnProfile` retorna early para `userId === 0` sin tocar la BD.

**Limpieza:**
- `backend/error.log` desindexado del repositorio (ya estaba en `.gitignore` pero fue commiteado antes de que se agregara esa regla). `git rm --cached backend/error.log`.
- `frontend/package-lock.json` commiteado (generado por npm install al migrar rama Laura).

**Commits:** `809f22e` (fixes backend) · `4298612` (untrack error.log + package-lock) · push a main en `4298612`

---

### 2026-07-14 — Jair Enrique Gonzalez Buelvas

**tipo_contrato eliminado del backend + recuperar-contrasena + fichas findById + novedades RF-47 + onAlertaCargaHoraria + seed ADSO**

**tipo_contrato eliminado (L4):**
- Columna `tipo_contrato ENUM('contratista','de_planta')` eliminada del modelo `instructores` (model, schemas, services, controllers).
- RN-03 (JORNADA_RESTRINGIDA) ahora aplica a todos los instructores — `isInstructorDePlanta` siempre retorna `true`.
- Limites de carga: 20-40h para todos sin distincion por tipo de contrato.

**Recuperar/resetear contrasena con token (L5):**
- Tabla `password_reset_tokens` agregada al schema: token hex 64 chars, expira 1h, single-use.
- `POST /api/auth/recuperar-contrasena` — genera token, envia correo via Nodemailer si SMTP configurado.
- `POST /api/auth/resetear-contrasena` — valida token, actualiza password, invalida token.
- Frontend: pagina `recuperar-contrasena.tsx` + link en `LoginForm`.

**fichas findById ampliado (L1):**
- `GET /api/fichas/:id` incluye `fecha_inicio_lectiva`, `fecha_fin_lectiva`, `fecha_inicio_productiva`, `fecha_fin_productiva`, `ambiente_nombre`, `lider_nombre`.

**Novedades de fichas RF-47 (L2):**
- `GET /api/fichas/:id/novedades` — lista novedades de la ficha.
- `POST /api/fichas/:id/novedades` — registrar novedad.
- `PATCH /api/fichas/:fichaId/novedades/:novedadId` — actualizar novedad.

**onAlertaCargaHoraria conectado (L6):**
- `NotificacionService.onAlertaCargaHoraria` conectado en `horario.controller.ts` al crear y actualizar horario.

**Frontend fixes de dev/laura integrados:**
- `exportPDF` — fix null check (crash cuando jsPDF no carga).
- `api.ts` — metodos alineados con endpoints reales del backend.

**Seed ADSO 228118 (SEED-ADSO):**
- Competencias y RAPs reales importados desde Reporte Juicios Evaluativos Ficha 2995403.
- 7 competencias tecnicas (38392/38376/38362/38367/38368/38356/38369) + 12 transversales + 1 productiva = 22 competencias, 79 RAPs.
- `instructor_competencias_habilitadas`: tecnicos → comp 1-7, transversales → comp 8-19, lider tecnico → comp 1-7+20.
- Programa ADSO codigo corregido: 228118 (antes TEST-228108).

**Commits:** pendiente al cierre de sesion

---

### 2026-07-15 — Jair Enrique Gonzalez Buelvas

**database.sql + seed_data.sql tipo_contrato cleanup + RF v8.0 + Logica de Negocio v5.4 + Contexto General v9.5**

**database.sql — 8 fixes:**
- C1: DDL `instructores` — columna `tipo_contrato` eliminada del `CREATE TABLE`.
- C2: trigger `tr_instructores_after_insert` — `tipo_contrato` eliminado del `JSON_OBJECT`.
- C3: trigger `tr_instructores_after_update` — `tipo_contrato` eliminado de OLD y NEW en `JSON_OBJECT`.
- C4: trigger `tr_instructores_after_delete` — `tipo_contrato` eliminado del `JSON_OBJECT`.
- C5: `sp_crear_instructor` — parametro `IN p_tipo_contrato VARCHAR(20)` eliminado; INSERT corregido a `(usuario_id, tipo_area)`.
- C6: `vw_carga_horaria_instructor` — `i.tipo_contrato` eliminado de SELECT y GROUP BY.
- C7: `vw_asignaciones_activas` — `i.tipo_contrato` eliminado de SELECT.
- C8: `INSERT INTO tipos_actividad` cambiado a `INSERT IGNORE` — evita duplicate key en re-importacion.

**seed_data.sql — 1 fix:**
- C9: INSERT de `instructores` — columna `tipo_contrato` y valores `'contratista'` eliminados de todos los rows.

**RF v8.0 — reestructuracion completa:**
- Archivo nuevo: `CONINS_Requisitos_Funcionales_v8_0.txt` — 53 RF en 11 modulos, numeracion secuencial RF-01 a RF-53.
- AUTH: 14 → 7 RF (pares admin/instructor unificados).
- Nuevo modulo PROGRAMAS (RF-18, RF-19).
- AMBIENTES: 1 → 5 RF (CRUD + bloqueos).
- HORARIOS: 4 → 7 RF (aprobacion RF-29, suspension RF-30, tipo actividad RF-31).
- Nuevo modulo RAP-SEGUIMIENTO (RF-52, RF-53).
- Todas las referencias a `tipo_contrato` eliminadas. Tabla RN-01 a RN-17 y LIMITES_HORAS incluidas.

**Documentacion:**
- `CONINS_Logica_Negocio_v5.md` → v5.4: 4 roles Title Case, RN-03 sin tipo_contrato, RN-12 reescrita (lider_programa no es rol), RN-15 RAPs heredados, schema 28 tablas, RF v8.0 en tabla de modulos.
- `CONINS_contexto_general.md` → v9.5: hitos al 15/07, 4 roles Title Case, 28 tablas, RF v8.0.

**Commits:** `c9402f5` (docs sesion 15/07). La sesion 14/07 quedo en `9d81e82`.

---

### 2026-07-21 — Jair Enrique Gonzalez Buelvas

**Rework por feedback del lider tecnico: RF v10.1 + RNF v1.0 + Logica de Negocio v5.6**

Feedback del lider tecnico (21/07/2026) sobre el modelo de asignacion y la
gestion de catalogos. Reestructuracion documental completa antes de tocar
codigo. Todas las decisiones de negocio quedaron adoptadas en documentos;
la implementacion en backend abre la Fase 1 y 2 (pendientes P29-P36).

**Decisiones de negocio adoptadas:**
- **RAP directo al instructor:** se revierte la herencia automatica. La
  asignacion llega hasta el RAP (instructor → grupo → competencia → RAP),
  con maximo un instructor por RAP en cada grupo. RN-15 redefinida, RN-06
  reforzada.
- **CRUD de competencias y RAPs:** dejan de ser solo precarga. Se conserva
  el seed de Sofia Plus como carga base y se habilita gestion administrativa
  (RF-25 a RF-28, RN-25 nueva).
- **Horario vinculado a RAP:** el bloque referencia el RAP que se dicta,
  validando que pertenezca al programa del grupo (RN-27 nueva).
- **Etapas del grupo con fechas propias:** RF-18 dedicado + RN-19.
- **Terminologia GRUPO:** "ficha" pasa a "grupo" en toda la UI. La BD
  conserva la tabla fichas; traduccion en frontend via terminology (RN-17,
  RNF-16).

**Documentos reestructurados:**
- `CONINS_Requisitos_Funcionales_v10_1.txt` — 62 RF en 12 modulos. Nuevo
  modulo Competencias y RAPs (RF-25 a RF-28). Grupos 5→6 RF (RF-18 etapas).
  Sintaxis normativa estandar "El sistema debe permitir a [rol]...".
- `CONINS_Requisitos_No_Funcionales_v1_0.txt` — NUEVO. 24 RNF en 8
  categorias. Consolida los 16 RNF del ERS v3 + los extraidos de los RF
  durante el rework (tokens, JWT, HTTP codes, terminologia, triggers).
- `CONINS_Logica_Negocio_v5_6.txt` — RN-15 redefinida, RN-25/26/27 nuevas,
  seccion 5 (RAP no heredado), seccion 8 (tabla asignacion_rap, rap_id en
  horarios, fecha_fin_productiva, capacidad ambientes), resumen RF v10.1.
  Reemplaza el intermedio v5.5 (basado en RF v9.0, RN-15 contradictoria).
- `CONINS_contexto_general.md` → v9.6.
- `CRONOGRAMA.md` → v4.7.

**Pendientes nuevos (rework — Fase 1 y 2):**
- P29: `fecha_fin_productiva` en fichas + verificar `capacidad` en ambientes.
- P29b: tabla nueva `asignacion_rap` (modelo RAP directo). Schema 28→29.
- P30: verificar 3 estados en `rap_ficha_seguimiento` + registro en bitacora.
- P31: confirmar/implementar bitacora de auditoria transversal (RF-59).
- P32: frontend terminologia GRUPO en todas las pantallas.
- P33: selector de rol activo al login para multi-rol (RF-11).
- P34: modulo CRUD Competencias y RAPs (RF-25 a RF-28).
- P35: asignacion explicita de RAP (RF-42, RN-15 redefinida).
- P36: horario vinculado a RAP (`rap_id`) + validacion RN-27.

**Plan de accion (orden sugerido):**
- FASE 0 (esta sesion): alinear documentacion. HECHO.
- FASE 1: cambios de schema (P29, P29b, P30, P31).
- FASE 2: backend nuevo (P34, P35, P36, P33).
- FASE 3: frontend (P32, P28).
- FASE 4: pendientes previos (P16, P17, P27).

**AVANCE BACKEND (misma sesion, tras reporte de frontend de Laura):**

Laura reporto el frontend del rework ya avanzado (terminologia GRUPO +20
archivos, paginas CRUD competencias, programas con referente, referente de
grupo) llamando endpoints placeholder. Se implementaron en backend las
piezas que su frontend ya consume y que NO requieren migracion de schema:

- **P34 — CRUD Competencias y RAPs (RF-25 a RF-28):** modulo nuevo.
  `competencia.controller.ts` + `competencia.routes.ts`, registrado en
  `server.ts` bajo `/api/competencias`. Endpoints: GET/POST `/`, GET `/:id`,
  PATCH `/:id`, PATCH `/:id/estado`, GET/POST `/:id/raps`, PATCH
  `/:id/raps/:rapId`, PATCH `/:id/raps/:rapId/estado`. Tablas competencias
  y raps YA existian (seed). Se aliasa `raps.nombre AS descripcion` para
  casar con el frontend. Escritura restringida a ROLES_ADMIN.
- **RF-24 — Referente de programa:** decision adoptada = reusar
  `lider_programa` (no columna nueva). `ProgramaModel` expone `referente_id`
  y `referente_nombre` (subquery sobre lider_programa) en findAll/findById;
  nuevo `setReferente` fuerza 1:1 (borra previos, inserta uno). GET
  `/api/programas` ahora devuelve detalle + referente; PATCH
  `/api/programas/:id/referente`.
- **RF-44 — Referente de grupo:** decision adoptada = reusar `fichas.lider_id`
  (no columna nueva). `ficha.controller` mapea `referente_id → lider_id` en
  create/update. `ficha.model.findById` expone `lider_id`, `referente_id`,
  `referente_nombre`. Schema acepta ambos alias.
- **P29 — verificado, ya resuelto:** `fichas.fecha_fin_productiva` y
  `ambientes.capacidad` ya existen en el schema. No requiere cambio.

tsc --noEmit limpio (exit 0). Archivos nuevos: competencia.controller.ts,
competencia.routes.ts. Modificados: server.ts, programa.model.ts,
programa.controller.ts, programa.routes.ts, ficha.controller.ts,
ficha.model.ts, ficha.schema.ts.

Pendiente del rework (requiere schema): P29b (asignacion_rap), P35
(asignacion explicita de RAP), P36 (rap_id en horarios + RN-27), P30, P31,
P33.

**Nota:** el intermedio `CONINS_Logica_Negocio_v5_5_1.txt` debe eliminarse
del repo (superado por v5.6). El sandbox no pudo borrarlo por permisos.

**Commits:** pendiente al cierre de sesion

---

### 2026-06-30 (tarde) — Jair Enrique Gonzalez Buelvas

**Fix database.sql — triggers y stored procedure con columna inexistente + seed_data.sql v5**

Al intentar importar `database.sql` en phpMyAdmin, se producía el error `#1054 - La columna 'tipo_novedad' en NEW es desconocida`. Causa raíz: los tres triggers de `instructor_novedades` (INSERT, UPDATE, DELETE) y el stored procedure `sp_registrar_novedad` usaban `tipo_novedad` (nombre de columna de una versión anterior del schema), pero la tabla real tiene `tipo_novedad_id INT FK` desde que se normalizó con la tabla `tipos_novedad_instructor`. Identificado y corregido sobre el código:

- **Triggers `tr_instructor_novedades_after_insert/update/delete`:** referencias `NEW.tipo_novedad` / `OLD.tipo_novedad` → `NEW.tipo_novedad_id` / `OLD.tipo_novedad_id`.
- **`sp_registrar_novedad`:** parámetro `p_tipo_novedad VARCHAR(20)` → `p_tipo_novedad_id INT`; `INSERT` corregido a `tipo_novedad_id`; `motivo_suspension` en el `UPDATE` a `horarios` ahora resuelve el nombre via `SELECT nombre INTO v_tipo_nombre FROM tipos_novedad_instructor`.
- **`vw_instructores_con_novedad`:** agrega `JOIN tipos_novedad_instructor tni ON n.tipo_novedad_id = tni.id` y expone `tni.nombre AS tipo_novedad` en el SELECT, eliminando la referencia a la columna inexistente.

El backend TypeScript no llama a `sp_registrar_novedad` directamente (usa sus propias queries en `instructor.model.ts`), por lo que el bug no afectaba la API en ejecución — solo bloqueaba la importación del schema.

**`seed_data.sql` v4 → v5:**

- Usuario de prueba `instructor.prueba@sena.edu.co` (ID 23, password NULL — activar via crear-password).
- Corrección de rol: Rocio Medina → `coordinador_transversal` (asumido — confirmar P8/P9).
- `[TEST DATA]` secciones nuevas: `programas` (ADSO + Calzado + Asistencia Administrativa), `competencias` (2 por programa), `raps` (2 por competencia), `instructor_competencias_habilitadas` para todos los instructores (sin esto RN-13 bloquea toda asignación), `fichas` (1 por programa), `lider_programa` (Juliana Gómez → ADSO).

**CONINS_Logica_Negocio_v5.md — corrección P25 (parcial):**
- Schema corregido de v5.2/27 tablas → v5/25 tablas.
- `instructor_novedades` en el listado de tablas corregido a `tipo_novedad_id` (FK).

**Commit:** `671ce5d` — `fix(db): corregir tipo_novedad → tipo_novedad_id en triggers y sp_registrar_novedad`

---

### 2026-06-30 — Jair Enrique Gonzalez Buelvas

**Sincronizacion con feedback de Laura (semana del 22/06 al 30/06) + verificacion real del backend contra el codigo**

Laura reporto frontend sincronizado con backend, commits subidos a `dev/laura`. Cambios de frontend ya integrados:
- Modal de Novedades de Instructores: `tipo_novedad_id` via dropdown dinamico (antes texto libre)
- Modales de Usuarios: campos `tipo_documento` (select) y `documento` (input)
- Modal de Bloqueo de Ambientes: dropdown `tipo_novedad_id` (igual que novedades de instructores)
- Nueva pagina Novedades de Fichas (RF-47): tipo, fechas, observacion
- Nuevo rol "Lider de Programa" visible en modales de crear/editar usuarios y en la tabla de usuarios (el rol ya existia en BD desde schema v4 — tabla `lider_programa` — esta sincronizacion solo lo expone en frontend)
- Campo "Lider de programa" en modales de crear/editar fichas (select dinamico con usuarios del rol Lider Programa)
- Modal nuevo "Asignar programas a lider" — agregar/quitar programas
- Boton "Suspender" en tabla de horarios con motivo obligatorio y trazabilidad
- Boton "Exportar PDF" en horarios — genera la malla completa con `jspdf` (100% cliente, no requiere endpoint backend)

**Verificacion directa sobre el codigo del backend (no solo sobre lo que decian los documentos anteriores):**

Confirmado implementado y operativo:
- `GET /api/catalogo/tipos-novedad-instructor` / `tipos-novedad-ambiente` / `tipos-novedad-ficha` — `catalogo.routes.ts`
- `PATCH /api/horarios/:id/aprobar` y `PATCH /api/horarios/:id/rechazar` (motivo obligatorio)
- `PATCH /api/horarios/:id/suspender` (RF-36, motivo obligatorio) — commit `6c2a6f4`
- `PUT /api/auth/usuarios/:id/programas` — asigna programas a un lider (RF-26) — commit `6c2a6f4`
- `POST /api/fichas` y `PATCH /api/fichas/:id` aceptan `lider_id` — commit `6c2a6f4`
- `PUT /api/auth/usuarios/:id` acepta `tipo_documento` y `documento`
- `GET /api/auth/usuarios` devuelve `rol` como texto (`usuario.model.ts` — `rol: roles[0] || 'Sin rol'`)
- RF-35 (mismo RAP no puede quedar asignado a 2 instructores en la misma ficha) — implementado en `asignacion.service.ts` via `AsignacionModel.hasRapEnFicha` (RN-06), HTTP 409
- Tabla `notificaciones` existe con `id, usuario_id, tipo, mensaje, leida, generada_en` (+ `correo_enviado` para RF-38)
- `GET /api/notificaciones` (notificaciones del usuario autenticado segun JWT) y `PATCH /api/notificaciones/:id/leida`

Gaps reales encontrados en el codigo, no documentados hasta ahora:

1. **`ultimo_acceso` no se devuelve en `GET /api/auth/usuarios`.** La columna existe y se actualiza en cada login (`UsuarioModel.updateUltimoAcceso`), pero el `SELECT` de `findAll()` / `findAllActive()` en `usuario.model.ts` no incluye `u.ultimo_acceso` y tampoco se mapea en el objeto de respuesta. Falta agregarlo (2 lineas: SELECT + mapeo).
2. **No hay filtrado por rol en los listados generales.** `GET /api/horarios`, `GET /api/fichas`, `GET /api/asignaciones` y `GET /api/alertas` solo exigen `verifyToken` (cualquier usuario autenticado) y llaman a `getAll()` sin pasar `req.user` — devuelven el dataset completo del CDMC sin importar el rol, incluyendo a Instructor y Lider de Programa. El frontend filtra visualmente, pero el backend no impone el alcance. Es el pendiente de seguridad mas critico antes de probar con usuarios reales no administradores.
3. **RF-37 cubierto solo parcialmente.** `horario.service.ts: update()` revalida RN-04 (solapamiento, hard) y RN-09 (bloqueo de ambiente) cuando cambian dia u hora, pero no recalcula las alertas soft RN-05 (ambiente ocupado) ni RN-03 (jornada restringida) al editar — esas solo se calculan en `create()`. Tampoco permite reasignar `instructor_id` desde el PATCH de edicion. Falta confirmar con Laura si el alcance esperado de RF-37 cubre estos casos o si el RF ya se considera satisfecho con lo existente.
4. **Discrepancia de ruta en notificaciones.** El backend expone `GET /api/notificaciones` (ya filtrado por el usuario del JWT), pero el pendiente reportado por Laura pide explicitamente `GET /api/notificaciones/mis`. Hay que alinear: o se le indica a Laura que use la ruta real, o se agrega un alias `/mis`.
5. **Version real del schema SQL inconsistente con la documentacion.** El archivo `database.sql` tiene comentario interno `Schema: v5` y 25 `CREATE TABLE` (verificado por conteo directo), no 27 como registra `CONINS_contexto_general.md` v9.2. `lider_id` (en `fichas`) y `ultimo_acceso` (en `usuarios`) son columnas agregadas a tablas existentes, no tablas nuevas — el conteo de "27 tablas / v5.2" fue un error de registro en una actualizacion anterior. Pendiente unificar la nomenclatura de version entre el archivo SQL y la documentacion.

**Credenciales de prueba entregadas por Laura (rol Instructor, solo entorno local de pruebas):**
- Correo: `instructor.prueba@sena.edu.co`
- Permite validar sidebar limitado y vistas filtradas en frontend — sirve tambien para probar manualmente el gap #2 (filtrado por rol) una vez se corrija en backend.

**Commit relacionado:**
- `6c2a6f4` (30/06/2026, 07:40) — `feat: endpoints Laura - suspender horarios, programas lider, lider_id fichas, ultimo_acceso`

> Nota de trazabilidad: los commits reales en git de los endpoints de catalogo/aprobacion/rol-texto (`b5d0833`, `c48633b`, `8394318`) tienen fecha del 20, 21 y 22 de junio segun `git log`, no 09–11 de junio como quedo registrado en las entradas de abajo. Se deja constancia aqui sin reescribir las entradas historicas.

**Respuesta de Laura (30/06/2026) — cierre de pendientes:**
- P22: Laura confirma que mantiene el filtro visual en frontend mientras no haya filtrado por rol en backend. Sin cambio aun en backend.
- P23 (alcance confirmado): Laura necesita que al editar un horario se revaliden TODAS las reglas, tanto duras (RN-04, RN-09) como suaves (RN-03 `JORNADA_RESTRINGIDA`, RN-05 `AMBIENTE_OCUPADO`). Ejemplo concreto dado por ella: si un coordinador cambia la jornada de "Manana" a "Noche" para un instructor de planta, la alerta RN-03 debe dispararse en ese momento. La implementacion de `update()` en `horario.service.ts` sigue pendiente.
- P24 (cerrado): Laura usara `GET /api/notificaciones` (la ruta real); ajusta el frontend por su cuenta. Sin cambio en backend.
- P25 (cerrado): Laura alinea la documentacion de su lado.

**Limpieza de duplicado — RF v6.1:** la carpeta tenia dos copias byte-a-byte identicas del documento de Requisitos Funcionales: `CONINS_Requisitos_Funcionales_v6.txt` y `CONINS_Requisitos_Funcionales_v6_1.txt` (mismo MD5, mismo contenido — encabezado interno dice "v6.1", 47 RF). Se elimino `CONINS_Requisitos_Funcionales_v6.txt` y se deja `CONINS_Requisitos_Funcionales_v6_1.txt` como unico archivo vigente, porque su nombre coincide con la version declarada dentro del propio documento. Las menciones historicas a `_v6.txt` en entradas fechadas de este changelog y en CRONOGRAMA.md (Fase 1, evidencia con 45 RF) no se modificaron — reflejan el nombre real del archivo en ese momento.

### 2026-06-11 — Jair Enrique Gonzalez Buelvas

**Endpoints para frontend de Laura + schema v5.2**

**Nuevos endpoints:**
- `PATCH /api/horarios/:id/suspender` — Suspende horario con motivo obligatorio
- `PUT /api/auth/usuarios/:id/programas` — Asigna programas a un lider de programa
- `GET /api/catalogo/tipos-novedad-instructor` — 6 tipos con seed
- `GET /api/catalogo/tipos-novedad-ambiente` — 5 tipos con seed
- `GET /api/catalogo/tipos-novedad-ficha` — 5 tipos con seed
- `GET /api/catalogo/jornadas` — Implementado (antes TODO)
- `GET /api/catalogo/ambientes` — Implementado (antes TODO)

**Cambios en tablas existentes:**
- `fichas` — Agregada columna `lider_id INT NULL` con FK a `usuarios`
- `usuarios` — Agregada columna `ultimo_acceso DATETIME NULL`

**Cambios en endpoints existentes:**
- `POST /api/fichas` — Ahora acepta `lider_id` en el body
- `PATCH /api/fichas/:id` — Ahora acepta `lider_id` en el body
- `POST /api/auth/login` — Ahora actualiza `ultimo_acceso` automaticamente

**Modelos y servicios actualizados:**
- `ficha.model.ts` — create y update aceptan `lider_id`
- `ficha.service.ts` — create y update aceptan `lider_id`
- `horario.model.ts` — nuevo metodo `suspender(id, motivo)`
- `horario.service.ts` — nuevo metodo `suspender(id, motivo)`
- `horario.controller.ts` — nuevo endpoint `suspender`
- `horario.routes.ts` — ruta `PATCH /:id/suspender`
- `auth.service.ts` — nuevo metodo `assignProgramasToLider`, `updateUltimoAcceso` en login
- `usuario.model.ts` — nuevo metodo `updateUltimoAcceso`
- `auth.controller.ts` — nuevo endpoint `assignProgramasToLider`
- `auth.routes.ts` — ruta `PUT /usuarios/:id/programas`
- `catalogo.controller.ts` — implementados todos los endpoints que estaban como TODO

**Schema v5.2:** 27 tablas (25 anteriores + `lider_id` en fichas + `ultimo_acceso` en usuarios)

### 2026-06-10 (noche) — Jair Enrique Gonzalez Buelvas

**Schema v5.1 — Tipos de novedades, documento de identidad, ficha_novedades**

**Nuevas tablas:**
- `tipos_novedad_instructor` — Catalogo de tipos de novedad (licencia, incapacidad, comision, calamidad, ceso_sindical, otro) con seed de 6 tipos
- `tipos_novedad_ambiente` — Catalogo de tipos de novedad para ambientes (mantenimiento, cerrado_administrativo, danos_infraestructura, evento_especial, otro) con seed de 5 tipos
- `tipos_novedad_ficha` — Catalogo de tipos de novedad para fichas (comite, paro, actividad_fuera, suspension_clases, otro) con seed de 5 tipos
- `ficha_novedades` — Novedades administrativas de fichas con FK a tipos_novedad_ficha

**Cambios en tablas existentes:**
- `usuarios` — Agregadas columnas `tipo_documento ENUM('cc','ce','ti','pasaporte')` y `documento VARCHAR(20) UNIQUE`
- `instructor_novedades` — Cambiada columna `tipo_novedad` de ENUM a FK `tipo_novedad_id INT` hacia `tipos_novedad_instructor`

**Modelos y servicios actualizados:**
- `usuario.model.ts` — Interfaces y queries incluyen tipo_documento y documento
- `instructor.model.ts` — `crearNovedad` usa `tipoNovedadId` en vez de ENUM; query de novedades hace JOIN con `tipos_novedad_instructor`
- `instructor.service.ts` — `registrarNovedad` usa `tipoNovedadId`
- `auth.service.ts` — `updateUser` acepta tipo_documento y documento
- `auth.controller.ts` — Pasa nuevos campos a updateUser
- `schemas/instructor.schema.ts` — `registrarNovedadSchema` usa `tipo_novedad_id: number` en vez de enum
- `schemas/auth.schema.ts` — `updateUserSchema` incluye tipo_documento y documento

**Nuevos Requisitos Funcionales (RF v6.1):**
- **RF-46** — Permitir a los administradores registrar y consultar el tipo y numero de documento de identidad de cada usuario (CC, CE, TI, pasaporte)
- **RF-47** — Registrar una novedad administrativa de una ficha activa (comite, paro, actividad fuera, suspension de clases), excluyendola de asignaciones mientras este vigente

**Documentos actualizados:**
- `CONINS_Requisitos_Funcionales_v6.txt` → v6.1 (47 RF)
- `CONINS_contexto_general.md` → v9.1 (schema v5.1, 25 tablas, RF-46, RF-47)

### 2026-06-10 (tarde) — Jair Enrique Gonzalez Buelvas

**Flujo de aprobacion de horarios + campo rol en usuarios (feedback Laura)**

**Horarios — Flujo de aprobacion:**
- Schema: columna `estado ENUM('pendiente','aprobado','rechazado') DEFAULT 'pendiente'` en tabla `horarios`
- Schema: columna `motivo_rechazo TEXT NULL` en tabla `horarios`
- `PATCH /api/horarios/:id/aprobar` — Cambia estado a 'aprobado' y activo = TRUE
- `PATCH /api/horarios/:id/rechazar` — Cambia estado a 'rechazado', activo = FALSE, guarda motivo
- `GET /api/horarios` ahora retorna TODOS los horarios (pendientes, aprobados, rechazados) con campo `estado` en texto capitalizado
- `findAll` y `findById` actualizados para usar columna `estado` en vez de calcular desde `activo`

**Usuarios — Campo rol como texto:**
- `GET /api/auth/usuarios` ahora devuelve campo `rol` (string) con el rol de mayor jerarquia (ej: "subdirector", "coordinador_medular")
- Mantiene compatibilidad con `roles: string[]` y `rol_ids: number[]`
- Frontend de Laura espera `rol: string` para mostrar en la tabla de usuarios

**Nuevos archivos en frontend de Laura (merge pendiente):**
- `usuarios.tsx` — Pagina de gestion de usuarios con CRUD
- `consultas.tsx` — Pagina de consultas y reportes
- `CrearUsuarioModal.tsx`, `EditarUsuarioModal.tsx` — Modales de usuarios
- `Footer.tsx` — Footer del layout

### 2026-06-10 — Jair Enrique Gonzalez Buelvas

**Actualizacion de equipo directivo:**
- Nuevo instructor líder técnico: Luis Eladio Porras Camargo (lporras@sena.edu.co, lporras567@gmail.com)
- Nueva coordinadora académica: Leidy Johana Ruiz Cortés (ljruizc@sena.edu.co)
- Wilmar Alexander Zapata pasa a ser instructor líder anterior
- Juan Pablo Hoyos Maya pasa a ser coordinador académico transversal anterior

**Cambios técnicos del día anterior consolidados:**
- RN-09 implementada: bloqueo de ambiente vigente valida al crear/editar horarios
- RN-13 implementada: validacion de competencia habilitada por contrato al asignar
- Endpoint GET /api/alertas implementado con filtros y marcadores
- Merge frontend Laura integrado: 11 paginas, 18 componentes modulares
- Frontend y backend corriendo estable con DB v5

### 2026-06-09 (noche) — Jair Enrique Gonzalez Buelvas

**Reglas de negocio RN-09 y RN-13 implementadas**

- **RN-09:** Bloqueo de ambiente vigente — validacion al crear/editar horarios. Si el ambiente tiene un bloqueo temporal activo en la semana del horario, se rechaza con HTTP 400. Aplica en `horario.service.ts`: `create`, `update`, `updateMultiDia`. Nuevo `AmbienteModel.hasBloqueoVigente()`.
- **RN-13:** Competencia habilitada por contrato — validacion al crear asignaciones. Si el instructor no tiene la competencia en `instructor_competencias_habilitadas`, se rechaza con HTTP 400. Aplica en `asignacion.service.ts`: `create` (y por extension `registrarProvisional`).

**Merge frontend Laura integrado:**
- 3 paginas nuevas: `/alertas`, `/ambientes`, `/consultas`
- 4 modales ambientes: Crear, Editar, Bloquear, VerAgenda
- `api.ts` actualizado (282 lineas)
- Paginas actualizadas: fichas, asignaciones, horarios, instructores, index
- Header, Sidebar, DashboardLayout actualizados
- 11 paginas totales (antes 8)

### 2026-06-09 (noche) — Jair Enrique Gonzalez Buelvas

**Endpoints de Consultas/Reportes (RF-41 a RF-45)**

- `GET /api/consultas/carga-horaria` — Carga de trabajo por instructor (total_horas, fichas_count, competencias_count, estado: Normal/Sobrecarga/Bajo carga)
- `GET /api/consultas/horarios-ficha` — Horario semanal consolidado por ficha (lunes a sabado con competencia)
- `GET /api/consultas/ocupacion-ambientes` — Porcentaje de uso de cada ambiente (horas_ocupadas, horas_totales, porcentaje)

**Limpieza de archivos:**
- Eliminado admin hardcodeado de `database.sql` — credenciales solo en `.env`
- Unificados 4 archivos database en uno solo: `database.sql` (v5)
- Collation cambiado a `utf8mb4_general_ci` para soporte de ñ y caracteres especiales

### 2026-06-09 (tarde) — Jair Enrique Gonzalez Buelvas

**Endpoints pendientes de Laura implementados**

**Ambientes (RF-31):**
- `POST /api/ambientes` — Crear ambiente (nombre, tipo, capacidad, area_id)
- `PUT /api/ambientes/:id` — Editar ambiente
- `POST /api/ambientes/:id/bloquear` — Registrar bloqueo (fecha_inicio, fecha_fin, motivo)
- `GET /api/ambientes/:id/bloqueos` — Listar bloqueos de un ambiente

**Asignaciones (RF-42):**
- `GET /api/asignaciones/historicas` — Listado de asignaciones desactivadas (activo = FALSE)
- Fix en `asignacion.model.ts`: `findAll` ya no filtra por `ac.activo = TRUE`

**Horarios (RF-22):**
- `PUT /api/horarios/:id` — Edicion de dias multiples (dia_ids: [1,3,5])
- Logica de diff: elimina dias quitados, crea dias nuevos, actualiza existentes
- Validacion de solapamiento (RN-04) para cada dia nuevo

**UTF-8:**
- Script `scripts/fix-utf8.sql` — Convierte todas las tablas a `utf8mb4_unicode_ci`

### 2026-06-09 — Jair Enrique Gonzalez Buelvas

**Limpieza de codigo muerto, consolidacion y correccion de bugs**

**Archivos eliminados:**
- `frontend/src/pages/api/hello.ts` — scaffold default de Next.js sin uso

**Consolidacion:**
- `getLunesSemanaActual()` extraida a `backend/utils/date.ts` — eliminada duplicacion en `instructor.service.ts` y `horario.service.ts`

**Correcciones:**
- Bug en `notificacion.service.ts:onNovedadRegistrada` — `notificarLideresPrograma` recibia `instructor.id` en vez de `fichaId`. Ahora consulta las fichas activas del instructor y notifica lideres por cada una.
- Eliminado default export redundante en `middleware/errorHandler.ts`

**Base de datos (Fase 1 — implementado):**
- Tabla `auditoria` — bitacora de auditoria con datos JSON antes/despues
- 24 triggers de auditoria (INSERT/UPDATE/DELETE) para 8 tablas criticas
- 2 triggers de validacion: `tr_validar_solapamiento` (RN-04), `tr_validar_ambiente_ocupado` (RN-05)
- 5 procedimientos almacenados: `sp_crear_instructor`, `sp_asignar_competencias`, `sp_registrar_novedad`, `sp_desactivar_asignacion`, `sp_finalizar_ficha`
- 5 vistas: `vw_carga_horaria_instructor`, `vw_ambientes_ocupados`, `vw_asignaciones_activas`, `vw_instructores_con_novedad`, `vw_alertas_pendientes`
- Scripts `db-backup.bat` y `db-restore.bat` + scripts npm `db:backup`, `db:restore`
- Middleware de auditoria API (`audit.ts`) + controller + routes (`GET /api/auditoria`)

**Frontend:**
- `.env.local` creado con `NEXT_PUBLIC_API_URL`
- `api.ts` ahora usa variable de entorno en vez de URL hardcodeada
- `.env.example` creado para frontend

**Backend merges de Laura (dev/laura):**
- `config/db.ts` — `charset: 'utf8mb4'` + `connectTimeout: 10000`
- `asignacion.model.ts` — FK IDs en `findAll` + `ER_DUP_ENTRY` handling
- `ficha.model.ts` — `programa_id` en interface y queries
- `ambiente.controller.ts` — `getAll` funcional
- `ambiente.routes.ts` — auth middleware + GET route
- `horario.model.ts` — fix SQL bug (GROUP BY correcto + WHERE activo)
- `SUPER_USER` en `.env` ahora se usa en login como fallback prioritario

---

### 2026-05-28 — Jair González Buelvas

**Fase 3 — Backend completo: módulos Fichas, Horarios, Asignaciones + validaciones RN + notificaciones**

**Endpoints implementados:**
- `GET/POST /api/fichas`, `PATCH /api/fichas/:id`, `PATCH /api/fichas/:id/finalizar`, `PATCH /api/fichas/:id/estado`
- `GET/POST /api/horarios`, `PATCH /api/horarios/:id`, `PATCH /api/horarios/:id/estado`
- `GET/POST /api/asignaciones`, `PATCH /api/asignaciones/:id`, `PATCH /api/asignaciones/:id/desactivar`, `POST /api/asignaciones/provisional`
- `GET /api/programas` (lista simple para dropdowns)
- `GET /api/instructores/:id/detalle` (detalle completo con asignaciones, horarios, competencias, novedades)
- `GET /api/notificaciones`, `GET /api/notificaciones/no-leidas/count`, `PATCH /api/notificaciones/:id/leida`, `PATCH /api/notificaciones/marcar-todas`

**Reglas de negocio implementadas:**
- **RN-03:** Alerta `JORNADA_RESTRINGIDA` si instructor de planta en jornada nocturna o fin de semana (soft, no bloquea)
- **RN-04:** Hard block HTTP 409 si instructor tiene horarios superpuestos en mismo día y hora
- **RN-05:** Alerta `AMBIENTE_OCUPADO` si ambiente ya ocupado en misma jornada (soft, no bloquea)
- **RN-06:** Hard block HTTP 409 si RAP de competencia ya asignado a otro instructor en misma ficha
- **RN-08:** Bloqueo de asignación si instructor tiene novedad activa vigente
- **RN-12:** Validación de alcance — líder solo asigna en sus programas, coordinador solo en su línea, líder no registra provisionales
- **RN-14:** Fichas virtuales sin ambiente físico obligatorio
- **RN-16:** Trazabilidad de cambio de instructor en `asignacion_competencia` (`instructor_anterior_id` + `fecha_cambio`)
- **RN-17:** Nomenclatura configurable — `frontend/src/lib/terminology.ts` con constantes para "Ficha"/"Grupo"

**Schema actualizado:**
- `horarios` — agregada columna `ambiente_id INT NULL` con FK a `ambientes` (ON DELETE SET NULL)
- `alertas` — agregada columna `leida BOOLEAN NOT NULL DEFAULT FALSE`

**Notificaciones (RF-38 a RF-40):**
- `NotificacionService` con triggers automáticos: `onAsignacionCreada`, `onNovedadRegistrada`, `onAlertaCargaHoraria`, `onAsignacionProvisional`
- Notificaciones internas para instructor, líderes de programa, coordinadores y subdirector
- Correo electrónico al instructor vía Nodemailer (condicional — solo si SMTP configurado en `.env`)
- `PermisoService` con validaciones de alcance: `validarAlcanceLider`, `validarNoLiderParaProvisional`, `validarAlcanceCoordinador`

**Frontend integrado (desde rama dev/laura de Laura Posada):**
- Páginas: `/auth`, `/` (dashboard), `/instructores`, `/fichas`, `/horarios`, `/asignaciones`
- Componentes modulares: `CreateInstructorModal`, `EditInstructorModal`, `DetailInstructorModal`, `NovedadModal`, `CrearFichaModal`, `EditFichaModal`, `DetailFichaModal`, `CrearHorarioModal`, `EditarHorarioModal`, `CrearAsignacionModal`, `EditAsignacionModal`, `DetailAsignacionModal`, `RegistrarProvisionalModal`, `ConfirmDialog`
- `useProtectedRoute` hook para protección de rutas
- `AuthContext` con persistencia en localStorage
- `ToastContext` para notificaciones toast
- `api.ts` — cliente HTTP con Fetch nativo (eliminado `auth.register` no documentado)
- `terminology.ts` — constantes de nomenclatura configurable

**Correcciones:**
- Fix SQL `GROUP BY` en `asignacion.model.ts` para cumplir con `only_full_group_by` de MySQL
- `GET /api/instructores` ahora incluye `tiene_novedad: boolean` y `horas_semana: number`
- `horario.service.ts` valida hora_fin > hora_inicio
- `asignacion.service.ts` valida ficha no finalizada antes de crear asignación
- `instructor.service.ts` valida email único al crear instructor (transacción con rollback)

**Commits:**
- `546dc62` — Fase 1: Schema y validaciones críticas (RN-04, RN-05, RN-06, RN-14)
- `0874376` — Fase 2 y 3: Roles, alcance y notificaciones (RN-12, RN-16, RF-38 a RF-40)
- `a7c681d` — Fixes de inconsistencias pendientes (items 1-5)
- `1e312f0` — Fix GROUP BY en asignacion.model.ts

**Repositorios actualizados:**
- `https://github.com/DarkerJB/ConIns_Project` (rama `main`)
- `https://github.com/Soywaz/conins` (rama `dev/Jair`)

---

### 2026-05-06 — Jair González Buelvas

**Stack frontend actualizado — Next.js 15 (Pages Router):**
- Vite eliminado. Frontend migra a **Next.js 15 con Pages Router**, confirmado en feedback con Juan Pablo Hoyos Maya, Wilmar Zapata y Gloria Eugenia Jaramillo.
- Pages Router seleccionado sobre App Router — decisión deliberada por simplicidad y tiempo disponible.
- Lucide React confirmado como biblioteca de íconos.
- Zustand en revisión — evaluar en Fase 3 si se mantiene o se reemplaza con solución nativa de Next.js.
- Stack completo confirmado: Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · Lucide React · Fetch nativo · Node.js · Express 5 · TypeScript · MVC · ESM6 · JWT · bcrypt · Nodemailer · MySQL · phpMyAdmin · Laragon · Git · GitHub · VS Code.
- Descripción oficial del sistema actualizada con el nuevo stack.
- P11 creado: definir gestión de estado en Next.js 15.

**Documentos actualizados:**
- `CONINS_contexto_general.md` → v7.0
- `CHANGELOG.md` → entrada 06/05/2026
- `CRONOGRAMA.md` → referencia de stack en actividad 12 actualizada a Next.js 15

---

### 2026-05-04 — Jair González Buelvas (`dev/Jair`)

**Fase 2 completada. Schema v4 cerrado. 5 bloqueadores resueltos.**

- Diagramas PlantUML RF-01 al RF-45 completos e integrados al ERS v3.0.
- Revisión técnica aprobada por Wilmar Zapata.
- Schema `database.sql` cerrado con 20 tablas.
- Correcciones aplicadas: `operario` en `programas.tipo_formacion`, `fichas.etapa = ('lectiva','productiva')`, tablas `instructor_novedades` / `ambiente_bloqueos` / `notificaciones` agregadas, roles limpios (5 exactos).
- BD local sincronizada.

Resueltos: ~~P1~~ (horas: 20–40h) · ~~P2~~ (etapa: `productiva`) · ~~P3~~ (login: correo en BD) · ~~P5~~ (3 tablas nuevas) · ~~P6~~ (`operario` en ENUM)

---

### 2026-04-28

- `lider_ficha` eliminado de `roles` → campo `es_lider_ficha BOOLEAN` en `asignacion`.
- Pantalla `/auth` con dos tabs definida como flujo definitivo.
- Axios → Fetch nativo.
- RF v5 (42) → v6 (45): RF-38/39/40 nuevos de notificaciones.
- Lógica de negocio v5.0.

### 2026-04-24

- 61 archivos .puml generados para módulos Instructores, Fichas, Asignaciones, Ambientes, Alertas y Consulta.

### 2026-04-23

- Bloqueadores B1–B8 resueltos. Schema v3. RF v3 (33) → v4 (40).

### 2026-04-22

- Módulos de datos precargados eliminados del ERS. RF v1 (43) → v2 (33). CONINS definido como sistema de control de malla de horarios.

### 2026-04-21

- ERS_CONINS_v1.docx generado. Módulo AUTH completo. 14 RNF. Glosario.

### 2026-04-20

- Validación pre-existente en registro. `authController` con HTTP 403. Migración controllers a schema v3.

### 2026-04-14

- Identidad Visual SENA. Topbar con dropdown. Sidebar. Bug fichas resuelto. `Usuarios.tsx`. `Perfil.tsx`. 10 violaciones arquitectónicas corregidas.

### 2026-04-10

- BD `instruplan` → `conIns`. 13 tablas iniciales. Backend completo. Auth multi-rol. Paleta SENA frontend. `LAURA_GUIDE.md`.
