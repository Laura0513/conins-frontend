# CONINS — Registro de Contexto y Cambios
**Centro del Diseño y Manufactura del Cuero (CDMC) — SENA**
*Última actualización: 2026-07-06 (RF v7.0 + seed_data v6 + gitignores fix)*

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
> La solución incorpora un modelo de control de acceso basado en roles jerárquicos (Subdirector, Coordinadora Académica, Asistente de Coordinación e Instructores), con soporte para múltiples roles por usuario. Incluye funcionalidades de consulta, filtrado, alertas automáticas, notificaciones internas y por correo electrónico, y generación de reportes exportables en PDF para la toma de decisiones por parte de los directivos del centro.
>
> La solución se implementa mediante una arquitectura web cliente-servidor: frontend desarrollado con Next.js 15 (Pages Router), React 19, TypeScript y Tailwind CSS 4, consumiendo una API REST construida con Node.js, Express 5 y TypeScript bajo arquitectura MVC con módulos ESM6. La persistencia de datos se gestiona en una base de datos relacional MySQL (25 tablas, schema v5), administrada desde phpMyAdmin, garantizando integridad referencial, trazabilidad de asignaciones y disponibilidad de la información mediante eliminación lógica universal.

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

> **Vite eliminado.** Frontend migra a Next.js 15 con Pages Router (confirmado 06/05/2026).

---

## Modelo de datos — BD `conIns` (schema v5 — 25 tablas — verificado 30/06/2026)

> Nota: la tabla siguiente resume los grupos principales. Para el detalle de tablas agregadas tras el cierre de v4 (tipos_novedad_instructor, tipos_novedad_ambiente, tipos_novedad_ficha, ficha_novedades, lider_id en fichas, ultimo_acceso en usuarios, tipo_documento/documento en usuarios), ver las entradas del 09/06, 10/06 y 11/06 en el Historial de cambios más abajo.
>
> **Corrección 30/06/2026:** el encabezado anterior decía "v5.2 — 27 tablas". Conteo directo de `CREATE TABLE IF NOT EXISTS` en `database.sql` (cuyo comentario interno dice `Schema: v5`) confirma 25 tablas — `lider_id` y `ultimo_acceso` son columnas agregadas a tablas existentes, no tablas nuevas. Ver entrada del 30/06/2026 abajo para el detalle completo.

| Tabla | Propósito |
|---|---|
| `roles` | 4 entradas: Subdirector · Coordinadora Academica · Asistente Coordinacion · Instructor |
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
│   ├── roles.ts                 ROLES.SUBDIRECTOR, COORDINADORA_ACADEMICA, etc.
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

**RF v7.0 + seed_data v6 + gitignores fix**

**Requisitos Funcionales v7.0 (Opcion A aprobada):**
- `lider_programa` pasa a figura informativa sin rol del sistema. RF-30 (lider asigna instructores) y RF-43 (lider consulta sus programas) eliminados — funcionalidad absorbida por Coordinadora Academica en RF-27, RF-28 y RF-41.
- RF-39 reescrito: notificaciones de cambio de asignacion ahora van a Coordinadora Academica y Asistente de Coordinacion (antes al lider de programa).
- RF-40 ajustado: "coordinadores y subdirector" corregido a "Coordinadora Academica, Asistente de Coordinacion y Subdirector".
- RF-08 al RF-13: "lideres e instructores" simplificado a "instructores".
- RF-17: eliminada referencia a "lideres previamente registrados" en creacion de fichas.
- RF-20 y RF-45: "administradores y lideres" corregido a "administradores".
- RF-25 y RF-26: reescritos para reflejar gestion informativa de lider_programa sin impacto en permisos.
- Nuevos RF-48 (filtrado por rol — P22 critico), RF-49 (tipos actividad — P29), RF-50 (seguimiento RAPs — P28), RF-51 (auditoria — ya implementada).
- Nuevo archivo: `CONINS_Requisitos_Funcionales_v7_0.txt` (49 RF en 9 modulos).
- Resumen doble heredado de v6.x unificado en uno solo.
- RN-12 marcada obsoleta en `CONINS_Logica_Negocio_v5.md` (v5.2).
- `CONINS_contexto_general.md` actualizado a v9.5 — seccion 12 con tabla RF v7.0.

**Gitignores fix + seed_data v6:**
- Fix critico: los tres `.gitignore` tenian CRLF y caracter em-dash que truncaban el archivo en disco — los patrones `.env` y `seed_data.sql` no estaban activos. Reescritos con LF y sin caracteres no-ASCII. Confirmado con `git check-ignore`: `backend/.env` y `backend/seed_data.sql` ahora muestran `!!` (ignorados).
- `seed_data.sql` actualizado a v6: Paul Tamayo sin rol (coordinacion medular fuera de alcance); instructores medulares (Calzado/Cuero) removidos de `instructores`, `usuario_roles` y `instructor_competencias_habilitadas`; programa 2 (Calzado), competencias 3-4, RAPs 5-8 y ficha 2 eliminados del test data. Rocio Medina sin rol (pendiente modulo juicios evaluativos). Luis Eladio Porras Camargo agregado como instructor ADSO (usuario 25, instructor 13).
- Pendiente manual: borrar `.git\index.lock` desde Windows y commitear los gitignores.

### 2026-07-01 al 2026-07-02 — Jair Enrique Gonzalez Buelvas

**Restructuracion de roles (feedback coordinadora 01/07/2026) + schema v27 + fixes B1/B2/I3**

**Contexto:** Sesion de revision con la coordinadora academica (Laura Jaramillo Ospina) del CDMC. Las conclusiones generaron un cambio de convención en los roles del sistema y la adicion de dos tablas nuevas al schema.

**Roles del sistema — BREAKING CHANGE:**

La convencion de nombres cambia de snake_case a Title Case con espacios. El sistema pasa de 5 roles a 4, eliminando `lider_programa` como rol funcional (se mantiene la tabla homónima solo como dato informacional):

| ID | Antes | Ahora |
|---|---|---|
| 1 | `subdirector` | `Subdirector` |
| 2 | `coordinador_medular` | `Coordinadora Academica` |
| 3 | `coordinador_transversal` | `Asistente Coordinacion` |
| 4 | `lider_programa` | *(eliminado del sistema de roles)* |
| 4 | `instructor` (ex ID 5) | `Instructor` |

Impacto: todos los JWT emitidos antes de este cambio quedan invalidos — los usuarios con sesion activa deben hacer login de nuevo. El instructor ID 5 (`instructor`) pasa a ser ID 4.

Nueva usuaria: Laura Jaramillo Ospina (`ljaramilloo@sena.edu.co`) — rol `Asistente Coordinacion` (ID 3).

**`constants/roles.ts`** — reescrito con comentario de ruptura de convencion, cuatro claves (`SUBDIRECTOR`, `COORDINADORA_ACADEMICA`, `ASISTENTE_COORDINACION`, `INSTRUCTOR`), grupos `ROLES_ADMIN` y `ROLES_COORDINACION`.

**Todas las rutas backend actualizadas:** los guards `requireRole([...])` en los 8 archivos de rutas reemplazaron los strings snake_case por los nuevos Title Case. `instructor.routes.ts` incluia guards de `COORDINADOR_MEDULAR` adicionales, todos actualizados.

**`auth.service.ts`:** SUPER_USER (`admin@conins.sena`) actualizado a `'Subdirector'`; check `actingRoles.includes('subdirector')` → `'Subdirector'`; `rol_ids.includes(5)` → `rol_ids.includes(4)`; `roles.includes('instructor')` → `roles.includes('Instructor')`; eliminado check de `lider_programa` en `assignProgramasToLider`.

**`seed_data.sql`** (gitignored): todos los instructores cambian de `rol_id = 5` → `rol_id = 4`; eliminada entrada `(6, 4)` de `usuario_roles` para Juliana (lider_programa); agregados usuario y rol de Laura Jaramillo Ospina (ID 24, `Asistente Coordinacion`); `UPDATE fichas SET fecha_inicio_productiva = '2026-07-14'` para fichas 3065123 y 3065121.

**`database.sql` — schema v27 (27 tablas):**
- `fichas`: columnas `fecha_inicio_productiva DATE NULL` y `fecha_fin_productiva DATE NULL` (entre `fecha_fin_lectiva` y `fecha_fin_ficha`)
- Roles: `INSERT IGNORE` reemplazado por bloque con `SET FOREIGN_KEY_CHECKS = 0; TRUNCATE usuario_roles; TRUNCATE roles; SET FOREIGN_KEY_CHECKS = 1;` seguido de `INSERT INTO roles` con los 4 nuevos roles en Title Case
- Nueva tabla `tipos_actividad` (tabla 26): `id, nombre, descripcion, suma_carga_horaria BOOLEAN`, con 9 filas seed (`Formacion`, `Planeacion`, `Seguimiento`, `Evaluacion`, `Reunion Institucional`, `Apoyo Complementario`, `Disponible`✗, `Permiso/Incapacidad`✗, `Otro`). Los marcados con ✗ tienen `suma_carga_horaria = FALSE` y no cuentan para el calculo 20-40h semanal
- `horarios`: nueva columna `tipo_actividad_id INT NULL` con FK a `tipos_actividad`
- Nueva tabla `rap_ficha_seguimiento` (tabla 27): seguimiento de RAPs por ficha con ENUMs `estado_evaluacion` y `estado_aprobacion`

**`permiso.service.ts` (fix I3):** eliminada funcion dead code `validarAlcanceLider` (sin callers). `validarNoLiderParaProvisional` y `validarAlcanceCoordinador` conservadas como no-ops con comentario de contexto.

**`ficha.model.ts`, `ficha.service.ts`, `ficha.schema.ts` (fix B1):** `FichaRecord` incluye `fecha_inicio_productiva` y `fecha_fin_productiva`; INSERT y UPDATE propagados; schemas Zod actualizados en `crearFichaSchema` y `actualizarFichaSchema`.

**`horario.model.ts`, `horario.service.ts`, `horario.schema.ts` (fix B2):** `HorarioRecord` incluye `tipo_actividad_id`; `HorarioDetail` incluye `tipo_actividad` (string, nombre resuelto via JOIN); `findAll` y `findById` con `LEFT JOIN tipos_actividad ta ON h.tipo_actividad_id = ta.id`; INSERT con 10 valores; `update()` maneja `tipo_actividad_id`; `getHorasPorInstructor` con `LEFT JOIN tipos_actividad` y condicion `(ta.suma_carga_horaria = TRUE OR h.tipo_actividad_id IS NULL)`; schema Zod `crearHorarioSchema` incluye `tipo_actividad_id` optional nullable; `create()` y `update()` del service propagados.

**Nuevo modelo:** `models/rap-ficha-seguimiento.model.ts` — interfaces `RapFichaSeguimientoRecord` y `RapFichaSeguimientoDetail`, metodos `findByAsignacionCompetencia`, `findById`, `create`, `update`, `toggleActivo`.

**tsc --noEmit:** 0 errores tras reconstruccion de archivos truncados via Python.

**Commits:**
- `2998245` — `feat(roles+schema): Title Case roles, schema v27, fichas productivas, tipos_actividad`
- `717be2b` — `fix(auth): SUPER_USER y auth.service.ts actualizados a nuevos strings de rol`
- `617bdfd` — `fix(B1/B2/I3): reconstruct truncated files, tsc clean`

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

**Nuevos Requisitos Funcionales agregados:**
- RF-46: tipo y numero de documento de identidad por usuario (CC, CE, TI, pasaporte)
- RF-47: novedad administrativa de ficha activa

**Documentos actualizados:** CONINS_Requisitos_Funcionales (→ v6.1, 47 RF), contexto_general (→ v9.1)

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
- `GET /api/auth/usuarios` ahora devuelve campo `rol` (string) con el rol de mayor jerarquia
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
- Bug en `notificacion.service.ts:onNovedadRegistrada` — `notificarLideresPrograma` recibia `instructor.id` en vez de `fichaId`. Corregido: consulta fichas activas del instructor y notifica coordinadores por cada una.
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
- **RN-12:** Validación de alcance — lider_programa es dato informativo, permisos de escritura controlados por Coordinadora Academica y Asistente Coordinacion
- **RN-14:** Fichas virtuales sin ambiente físico obligatorio
- **RN-16:** Trazabilidad de cambio de instructor en `asignacion_competencia` (`instructor_anterior_id` + `fecha_cambio`)
- **RN-17:** Nomenclatura configurable — `frontend/src/lib/terminology.ts` con constantes para "Ficha"/"Grupo"

**Schema actualizado:**
- `horarios` — agregada columna `ambiente_id INT NULL` con FK a `ambientes` (ON DELETE SET NULL)
- `alertas` — agregada columna `leida BOOLEAN NOT NULL DEFAULT FALSE`

**Notificaciones (RF-38 a RF-40):**
- `NotificacionService` con triggers automáticos: `onAsignacionCreada`, `onNovedadRegistrada`, `onAlertaCargaHoraria`, `onAsignacionProvisional`
- Notificaciones internas para instructor, Coordinadora Academica, Asistente Coordinacion y Subdirector
- Correo electrónico al instructor vía Nodemailer (condicional — solo si SMTP configurado en `.env`)
- `PermisoService` con validaciones de alcance por rol (lider_programa es informacional — no otorga permisos)

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
- `asignacion.service.ts` valida ficha no finalizada ante