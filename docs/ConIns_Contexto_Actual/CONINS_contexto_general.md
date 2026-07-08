# CONINS — Contexto General
### Sistema de Control de Instructores · SENA CDMC
**Versión:** 9.4 · **Fecha:** Julio 2026
**Basado en:** RF v6.1 · ERS v3.0 · Lógica de Negocio v5.2 · CRONOGRAMA v4.3 · CHANGELOG al 02/07/2026

---

## ⚡ Estado actual del proyecto

| Fase | Período | Estado |
|---|---|---|
| F1 — Análisis y requisitos | 09/04 – 30/04/2026 | ✅ Completada |
| F2 — Modelado y diseño | 04/05 – 15/05/2026 | ✅ Completada anticipadamente (sem. 5 — 04/05/2026) |
| F3 — Construcción | 19/05 – 06/08/2026 | 🔄 En curso (semana 01/07: restructuración de roles Title Case, schema v27 con tipos_actividad y rap_ficha_seguimiento, fixes B1/B2/I3) |
| F4 — Pruebas y ajustes | 10/08 – 28/08/2026 | ⬜ Pendiente |
| F5 — Documentación y despliegue | 31/08 – 18/09/2026 | ⬜ Pendiente |

**Hitos cerrados al 02/07/2026:**
- **Roles restructurados:** 5 roles snake_case → 4 roles Title Case. `lider_programa` pasa a dato informacional. `instructor` cambia de ID 5 → 4.
- **Schema v27 (27 tablas):** nuevas tablas `tipos_actividad` (9 tipos de actividad con flag `suma_carga_horaria`) y `rap_ficha_seguimiento`; columnas `fecha_inicio_productiva`/`fecha_fin_productiva` en `fichas`; `tipo_actividad_id` FK en `horarios`
- **Fixes B1/B2/I3:** `ficha.schema.ts`, `ficha.service.ts`, `ficha.model.ts` propagados con fechas productivas; `horario.model.ts`, `horario.service.ts`, `horario.schema.ts` propagados con `tipo_actividad_id` y JOIN a `tipos_actividad`; `permiso.service.ts` sin dead code `validarAlcanceLider`. tsc --noEmit: 0 errores. Commit `617bdfd`
- Nueva usuaria: Laura Jaramillo Ospina (`ljaramilloo@sena.edu.co`) — rol `Asistente Coordinacion` (ID 3)

**Hitos cerrados al 30/06/2026:**
- Sincronización completa con frontend de Laura (commits en `dev/laura`): dropdowns dinámicos de tipos de novedad (instructor/ambiente/ficha), campos `tipo_documento`/`documento` en usuarios, página de Novedades de Fichas (RF-47), campo `lider_id` en fichas, modal "Asignar programas a líder", botón "Suspender" en horarios, exportación a PDF con `jspdf` (100% cliente, sin endpoint backend)
- Endpoints nuevos verificados en código: catálogos de tipos de novedad, `PATCH /api/horarios/:id/suspender`, `PUT /api/auth/usuarios/:id/programas`, `lider_id` en `POST/PATCH /api/fichas`, `tipo_documento`/`documento` en `PUT /api/auth/usuarios/:id` — commit `6c2a6f4`
- RF-35 (RAP único por ficha) confirmado implementado en `asignacion.service.ts` (RN-06, HTTP 409)
- Tabla `notificaciones` y `GET /api/notificaciones` / `PATCH /api/notificaciones/:id/leida` confirmados operativos
- **Verificación directa del código encontró 5 gaps reales (P21–P25).** El más crítico: ninguno de los listados generales filtra por rol en backend — solo exigen `verifyToken`
- Corrección de inventario: `database.sql` real tenía **25 tablas** y schema `v5` (no 27/v5.2 como se documentó antes)

**Hitos cerrados al 11/06/2026:**
- Backend completo: módulos Auth, Instructores, Fichas, Horarios, Asignaciones, Notificaciones, Ambientes, Consultas, Auditoria, Catalogo
- Todas las reglas de negocio implementadas (RN-01 a RN-17) incluyendo RN-09 (bloqueo ambiente) y RN-13 (competencia habilitada)
- Notificaciones internas y por correo (RF-38 a RF-40)
- Flujo de aprobacion de horarios: estado pendiente/aprobado/rechazado, motivo de rechazo
- Suspension de horarios con motivo obligatorio
- Frontend Next.js 15 con 11 páginas y 18 componentes modulares
- Base de datos schema v5 (25 tablas): tipos_novedad_*, ficha_novedades, documento/tipo_documento en usuarios, lider_id en fichas, ultimo_acceso en usuarios
- 6 endpoints de catalogo para frontend: tipos de novedad, jornadas, ambientes, programas, competencias, raps, areas
- Endpoints de consultas y reportes: carga horaria, horarios por ficha, ocupacion de ambientes
- Endpoint PATCH /api/horarios/:id/suspender y PUT /api/auth/usuarios/:id/programas
- Integracion completa entre backend y frontend (dev/Jair + dev/laura sincronizadas)
- RF-46 (documento de identidad) y RF-47 (novedades de fichas) implementados
- Cambio de equipo directivo: nuevo instructor líder Luis Eladio Porras, nueva coordinadora Leidy Johana Ruiz

**Hitos cerrados al 04/05/2026:**
- Diagramas PlantUML RF-01 al RF-45 completos — integrados en ERS_CONINS_v3.docx
- Schema `database.sql` cerrado definitivamente con 20 tablas — validado por Wilmar Zapata
- P1, P2, P3, P5 y P6 del CHANGELOG resueltos
- Fase 2 completada. Siguiente: inicio de Fase 3 el 19/05/2026

**Cambio de stack confirmado (feedback Juan Pablo Hoyos + Wilmar Zapata + Gloria Jaramillo):**
El frontend migra de **React + Vite** a **Next.js 15 con Pages Router**. Ver sección 3.

---

## 1. Descripción oficial del sistema

> Desarrollar un sistema de información web que permita gestionar, controlar y optimizar la asignación académica y operativa de los instructores del Centro del Diseño y Manufactura del Cuero (CDMC) del SENA, mediante la administración estructurada de competencias, resultados de aprendizaje (RAPs), ambientes de formación, fichas y horarios. El sistema garantiza el cumplimiento de la carga horaria reglamentaria, previene inconsistencias como la duplicidad de asignaciones por ficha, y gestiona situaciones operativas como novedades administrativas de instructores y bloqueos temporales de ambientes.
>
> La solución incorpora un modelo de control de acceso basado en roles jerárquicos (Subdirector, Coordinadora Academica, Asistente Coordinacion e Instructor), con soporte para múltiples roles simultáneos por usuario. Incluye funcionalidades de consulta, filtrado, alertas automáticas, notificaciones internas y por correo electrónico, y generación de reportes exportables en PDF para la toma de decisiones por parte de los directivos del centro.
>
> La solución se implementa mediante una arquitectura web cliente-servidor: frontend desarrollado con Next.js 15 (Pages Router), React 19, TypeScript y Tailwind CSS 4, consumiendo una API REST construida con Node.js, Express 5 y TypeScript bajo arquitectura MVC con módulos ESM6. La persistencia de datos se gestiona en una base de datos relacional MySQL (27 tablas, schema v5.3 — actualizado 01/07/2026 con `tipos_actividad` y `rap_ficha_seguimiento`), administrada desde phpMyAdmin, garantizando integridad referencial, trazabilidad de asignaciones y disponibilidad de la información mediante eliminación lógica universal.

---

## 2. Equipo del proyecto

| Rol | Nombre | Contacto |
|---|---|---|
| Instructor líder técnico | Luis Eladio Porras Camargo | lporras@sena.edu.co · lporras567@gmail.com |
| Instructor líder anterior | Wilmar Alexander Zapata (Soywaz) | github.com/Soywaz/conins |
| Instructor de seguimiento | Gloria Eugenia Jaramillo | CDMC |
| Coordinadora Académica | Leidy Johana Ruiz Cortés | ljruizc@sena.edu.co |
| Aprendiz backend / BD / análisis | Jair Enrique González Buelvas | github.com/DarkerJB · rama `dev/Jair` |
| Aprendiz frontend / diseño | Laura Sofía Posada | github.com/Laura0513 · rama `dev/laura` |

### Repositorios y rutas locales

| Ruta | Descripción |
|---|---|
| `https://github.com/Soywaz/conins` | Repo principal — rama `dev/Jair` (backend) y `dev/laura` (frontend) |
| `https://github.com/DarkerJB/ConIns_Project` | Repo de Jair — rama `main` (backend + frontend integrado) |
| `D:\2_ConIns\ConIns_Project\` | Workspace principal Jair — backend + frontend |
| `D:\2_ConIns\Jair_ConIns\` | Workspace anterior Jair — rama `dev/Jair` |
| `D:\2_ConIns\WAZ_ConIns\` | Referencia instructor — rama `main` |
| `D:\2_ConIns\Laura_Lovable\` | Diseño Lovable de Laura (referencia UI) |
| `D:\2_ConIns\Jair_ConIns\.agents\skills\conins-core\` | 5 skills de Claude Code |
| `D:\2_ConIns\Jair_ConIns\.claude\CLAUDE.md` | Governance del proyecto |

### Datos de etapa productiva

| Campo | Jair | Laura |
|---|---|---|
| Inicio | 09/04/2026 | 07/04/2026 |
| Fin | 07/10/2026 | 07/10/2026 |
| Días hábiles | 121 días / 1.089 h | 123 días / 1.107 h |
| Jornada | Lun–Vie 7:00–17:30 (9h efectivas) | ídem |

---

## 3. Stack tecnológico — vigente (confirmado en feedback 04/05/2026)

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | **Next.js 15** · React 19 · TypeScript · Tailwind CSS 4 | Pages Router · migra desde Vite en Fase 3 |
| Íconos | Lucide React | — |
| HTTP client | Fetch nativo | Axios eliminado el 28/04 |
| Backend | Node.js · Express 5 · TypeScript | Arquitectura MVC · ESM6 · migra desde JS en Fase 3 |
| Auth | JWT + bcrypt | — |
| Correo | Nodemailer | RF-38 — notificaciones al instructor |
| Base de datos | MySQL — `conIns` | 27 tablas · schema v5.3 — actualizado 01/07/2026 (`tipos_actividad` + `rap_ficha_seguimiento`) |
| Administración BD | phpMyAdmin · Laragon | Entorno local de desarrollo |
| Control de versiones | Git + GitHub | — |
| IDE | VS Code | — |

> **Nota Next.js 15 / Pages Router:** El cambio de Vite a Next.js fue confirmado en el feedback con Juan Pablo Hoyos, Wilmar Zapata y Gloria Jaramillo. Se usa **Pages Router** (`pages/`) por decisión deliberada del equipo — más sencillo y mejor documentado para el nivel y el tiempo disponible. **Zustand (`authStore`) queda en revisión:** Next.js tiene su propio sistema de gestión de sesión; evaluar si se mantiene o se reemplaza al iniciar Fase 3.

---

## 4. Directivos del CDMC y roles en CONINS

| Cargo | Nombre | Rol en CONINS | Alcance |
|---|---|---|---|
| Subdirector (e) | Dyron Javier Ramírez Osorio | `Subdirector` | CDMC completo — administrador principal |
| Coordinadora Académica | Leidy Johana Ruiz Cortés | `Coordinadora Academica` | CDMC completo |
| Coordinador Académico Medular | Paul Ernesto Tamayo Caviedes | — (sin acceso — fuera del alcance ADSO inicial) | Calzado, marroquinería, curtición |
| Coordinador Académico Transversal (anterior) | Juan Pablo Hoyos Maya | — (ya no está en CDMC) | — |
| Asistente Coordinación | Laura Jaramillo Ospina | `Asistente Coordinacion` | ljaramilloo@sena.edu.co |

---

## 5. Vocabulario SENA — crítico para variables, tablas y UI

| Término | Significado | Implementación |
|---|---|---|
| **Ficha** | Grupo de aprendices. Próximamente "grupo" | `numero_ficha` en BD — etiqueta configurable en frontend |
| **Programa medular** | Razón de ser del CDMC: calzado, marroquinería, curtición | Fuera del alcance ADSO inicial (ver P26) |
| **Programa transversal** | Programas de apoyo: ADSO, bilingüismo, diseño | Coordinado por `Coordinadora Academica` |
| **Competencia** | Equivalente a asignatura. Agrupa RAPs | Unidad de asignación |
| **RAP** | Resultado de Aprendizaje. Se hereda al asignar competencia | Solo para conteo y validación de unicidad |
| **Ambiente** | Aula o taller físico | Aulas 200–208 · Talleres T1–T4 |
| **Líder de ficha** | Responsable administrativo del grupo | Campo `es_lider_ficha BOOLEAN` en `asignacion` — NO es rol |
| **Novedad administrativa** | Ausencia temporal del instructor (licencia, incapacidad, comisión) | Tabla `instructor_novedades` — excluye del sistema mientras vigente |
| **Bloqueo de ambiente** | Espacio no disponible temporalmente | Tabla `ambiente_bloqueos` — excluye mientras vigente |
| **Sofía Plus** | Plataforma oficial SENA | CONINS no la reemplaza |
| **HUI FORMACION** | Cursos LMS autogestionados | Fichas sin instructor presencial — seed sin asignación |

> ⚠️ **Dos ejes independientes — NO mezclar:**
> - **Medular / Transversal** = clasificación de *programas del centro*
> - **Técnica / Transversal** = clasificación de *áreas y competencias de instructores*

---

## 6. Roles del sistema — tabla `roles` (4 entradas — vigente al 01/07/2026)

> **Roles vigentes desde 01/07/2026:** 4 roles en Title Case. `lider_programa` es dato informacional sin permisos.

| ID | Nombre | Nivel | Permisos | Alcance |
|---|---|---|---|---|
| 1 | `Subdirector` | 1 | Consulta y generación de reportes | CDMC completo |
| 2 | `Coordinadora Academica` | 2 | Administrador (todos los permisos) | CDMC completo |
| 3 | `Asistente Coordinacion` | 3 | Mismos permisos que Coordinadora | CDMC completo |
| 4 | `Instructor` | 4 | Solo lectura de sus asignaciones | Sus fichas activas |

> `lider_ficha` NO existe en `roles`. Es `es_lider_ficha BOOLEAN DEFAULT FALSE` en la tabla `asignacion`. No otorga permisos adicionales.
> `lider_programa` (tabla) permanece como dato informativo del instructor referente de programa — sin permisos, sin rol del sistema (Opcion A aprobada 06/07/2026).
> Un usuario puede tener múltiples roles simultáneos vía tabla `usuario_roles` (N:M).
> La distinción medular / transversal fue eliminada: `Coordinadora Academica` y `Asistente Coordinacion` gestionan todas las fichas sin restricción de línea.

---

## 7. Flujo de autenticación — definitivo

### Pantalla pública `/auth` — dos tabs

```
Tab "Iniciar sesión"              Tab "Crear contraseña"
──────────────────────            ──────────────────────────────────
Campo: correo                     Campo: correo
Campo: contraseña (toggle)        Campo: contraseña nueva (toggle)
Botón: Iniciar sesión             Campo: confirmar contraseña (toggle)
Link: ¿Olvidaste contraseña?      Botón: Crear contraseña
                                  Alerta amarilla si correo no en BD
```

### Flujo de dos pasos obligatorios

```
Paso 1 (admin):   Crea cuenta → correo + nombre + rol → sin contraseña
Paso 2 (usuario): /auth → tab "Crear contraseña" → ingresa correo
                  ¿Existe en BD? Sí → guarda contraseña → puede login
                                 No → alerta amarilla → HTTP 403
Paso 3 en adelante: login normal con correo + contraseña
```

**Arranque:** seed carga todos los usuarios actuales con correo, nombre y rol sin contraseña. Admin inicial (Subdirector) entra con contraseña definida en el seed. RF-13 para nuevos ingresos futuros.

---

## 8. Infraestructura física del CDMC

| Tipo | Identificadores | Notas |
|---|---|---|
| Aulas | 200 al 208 (9 aulas) | Formación general |
| Talleres | T1 al T4 (4 talleres) | Formación práctica — pueden albergar varias fichas simultáneamente |

| Jornada | Horario | Valida ambiente físico |
|---|---|---|
| Mañana | 06:00 – 12:00 | Sí |
| Mixta | 12:00 – 18:00 | Sí |
| Noche | 18:00 – 22:00 | Sí |
| Virtual | Sin horario fijo | No |

---

## 9. Áreas y líderes del CDMC

| Área | Líder(es) | Línea |
|---|---|---|
| ADSO | Carlos Álvarez | Transversal |
| Talento Humano | Catalina (apellido pendiente — P9) | Transversal |
| Contabilidad | Andrés Pareja | Transversal |
| Logística | William Ramírez | Transversal |
| SIG | Luis María Arango | Transversal |
| Transversales | Anderson Silva | Transversal |
| Bilingüismo | Juan Pablo Hoyos Maya | Transversal |
| Virtualidad | Paula Isaza | Transversal |
| Técnico Medular | Gloria Pabón + Rivera (apellido pendiente — P8) | Medular |
| Tecnólogo Medular | Freddy Calderón + Luisa Nieves | Medular |

---

## 10. Reglas de negocio vigentes

| RN | Regla | Tipo | Estado Backend |
|---|---|---|---|
| RN-01 | Onboarding dos pasos — sin paso 1 → HTTP 403 | Hard | ✅ Implementado |
| RN-02 | Correo como identificador único — sin restricción de dominio | Hard | ✅ Implementado |
| RN-03 | Alerta `JORNADA_RESTRINGIDA` si instructor de planta en jornada nocturna o fin de semana | Soft | ✅ Implementado |
| RN-04 | Hard block si instructor tiene horarios superpuestos — HTTP 409 | Hard | ✅ Implementado |
| RN-05 | Soft alert `AMBIENTE_OCUPADO` si ambiente ya ocupado en la misma jornada | Soft | ✅ Implementado |
| RN-06 | `UNIQUE(ficha_id, rap_id)` — mismo RAP no puede tener dos instructores en la misma ficha — HTTP 409 | Hard | ✅ Implementado |
| RN-07 | Alerta `CARGA_HORARIA` si instructor fuera del rango de horas (20–40h semanales) | Soft | ✅ Implementado |
| RN-08 | Instructor excluido mientras novedad vigente — reincorporación automática al vencer `fecha_regreso` | Auto | ✅ Implementado |
| RN-09 | Ambiente excluido mientras bloqueo vigente — reincorporación automática al vencer `fecha_fin` | Auto | ✅ Implementado |
| RN-10 | Soft delete universal — `activo BOOLEAN DEFAULT TRUE` en todas las tablas | Hard | ✅ Implementado |
| RN-11 | Asignación provisional — requiere autorizante, fecha y motivo — solo la registra un administrador | Hard | ✅ Implementado |
| RN-12 | Líder solo asigna dentro de sus programas — no registra provisionales | Hard | ✅ Implementado |
| RN-13 | Instructor solo asignable a competencias en `instructor_competencias_habilitadas` | Hard | ✅ Implementado |
| RN-14 | Fichas virtuales — sin asignación ni validación de ambiente físico | Hard | ✅ Implementado |
| RN-15 | RAPs heredados al asignar competencia — no se asignan individualmente | Hard | ✅ Implementado |
| RN-16 | Nomenclatura "ficha" configurable en frontend — no hardcodear | Soft | ✅ Implementado |

> **Nota (30/06/2026):** las RN de esta tabla están implementadas, pero RF-37 (más amplio que cualquier RN individual — "verificar que cambios en horarios/jornadas/instructores/ambientes no generen conflictos") solo se cubre completamente en `create()`. En `update()` de horario solo se revalidan RN-04 y RN-09; RN-03 y RN-05 no se recalculan al editar. Ver P23.

---

## 11. Modelo de datos — schema v5.3 (27 tablas — actualizado 01/07/2026)

> **Historial de versiones del schema:**
> - v5 (25 tablas, verificado 30/06/2026): `jornadas, roles, areas, usuarios, usuario_roles, instructores, programas, competencias, raps, ambientes, fichas, asignacion, asignacion_competencia, lider_programa, instructor_competencias_habilitadas, horarios, alertas, tipos_novedad_instructor, instructor_novedades, ambiente_bloqueos, tipos_novedad_ambiente, tipos_novedad_ficha, ficha_novedades, notificaciones, auditoria`
> - v5.3 (27 tablas, 01/07/2026): agrega `tipos_actividad` (tabla 26) y `rap_ficha_seguimiento` (tabla 27); `horarios` + columna `tipo_actividad_id FK`; `fichas` + columnas `fecha_inicio_productiva` y `fecha_fin_productiva`; roles truncados y reimplantados en Title Case con 4 entradas

**Tablas nuevas (01/07/2026):**
- `tipos_actividad (id, nombre, descripcion, suma_carga_horaria BOOLEAN)` — catálogo de 9 tipos: Formacion, Planeacion, Seguimiento, Evaluacion, Reunion Institucional, Apoyo Complementario, **Disponible** (no suma), **Permiso/Incapacidad** (no suma), Otro
- `rap_ficha_seguimiento (id, asignacion_competencia_id, rap_id, estado_evaluacion ENUM, estado_aprobacion ENUM, fecha_inicio, fecha_fin, activo)` — seguimiento de RAPs por ficha (estados: pendiente/evaluado, aprobado/no_aprobado)

```
instructor
  └── asignacion  (instructor_id, ficha_id, es_lider_ficha, es_provisional)
        └── asignacion_competencia  (asignacion_id, competencia_id, ambiente_excepcion_id)
              └── competencia
                    └── raps  ← heredados automáticamente
```

**Catálogos base (seed — sin CRUD en UI):**
```sql
roles, programas, competencias, raps, ambientes, jornadas, fichas
```
`programas.tipo_formacion ENUM('titulada','complementaria','operario')`
`fichas (numero_ficha, programa_id, etapa, lider_id, activo)`
`fichas.etapa ENUM('lectiva','productiva')`

**Usuarios y roles:**
```sql
usuarios (id, nombre, email, password, tipo_documento, documento, ultimo_acceso, activo, created_at)
usuario_roles, instructores, lider_programa,
instructor_competencias_habilitadas
```

**Novedades y bloqueos:**
```sql
tipos_novedad_instructor (id, nombre, descripcion, activo) — seed: 6 tipos
tipos_novedad_ambiente   (id, nombre, descripcion, activo) — seed: 5 tipos
tipos_novedad_ficha      (id, nombre, descripcion, activo) — seed: 5 tipos
instructor_novedades (id, instructor_id, tipo_novedad_id, fecha_inicio, fecha_regreso, observacion, activo)
ficha_novedades      (id, ficha_id, tipo_novedad_id, fecha_inicio, fecha_regreso, observacion, activo)
ambiente_bloqueos    (id, ambiente_id, fecha_inicio, fecha_fin, motivo, activo)
```

**Asignaciones:**
```sql
asignacion            (instructor_id, ficha_id, es_lider_ficha, es_provisional,
                       autorizado_por_id, fecha_autorizacion, motivo_provisional, activo)
asignacion_competencia (asignacion_id, competencia_id, instructor_anterior_id,
                        fecha_cambio, ambiente_excepcion_id, observacion, activo)
```

**Horarios, alertas y notificaciones:**
```sql
horarios       (instructor_id, ficha_id, competencia_id, ambiente_id, jornada_id, fecha,
                 hora_inicio, hora_fin, estado, motivo_rechazo, motivo_suspension, activo)
alertas        (instructor_id, tipo, mensaje, leida, generada_en)
notificaciones (usuario_id, tipo, mensaje, leida, generada_en)
```

---

## 12. Requisitos Funcionales v7.0 — 49 RF en 9 módulos

> Actualizado 06/07/2026: RF-30 y RF-43 eliminados (lider_programa pasa a figura informativa).
> RF-39 reescrito. RF-48 a RF-51 nuevos. Ver `CONINS_Requisitos_Funcionales_v7_0.txt`.

| Módulo | Rango | Total | Notas |
|---|---|---|---|
| AUTH | RF-01 al RF-13, RF-46 | 14 | Roles actualizados |
| Instructores | RF-14 al RF-16 | 3 | Sin cambios |
| Fichas | RF-17 al RF-20, RF-47 | 5 | RF-17 ajustado |
| Horarios | RF-21 al RF-24 | 4 | Sin cambios |
| Asignaciones | RF-25 al RF-29 | 5 | RF-30 eliminado |
| Ambientes | RF-31 | 1 | Sin cambios |
| Alertas, Validaciones y Notificaciones | RF-32 al RF-40 | 9 | RF-39 reescrito, RF-40 ajustado |
| Consulta y Visualización | RF-41, RF-42, RF-44, RF-45 | 4 | RF-43 eliminado |
| Seguridad y Trazabilidad | RF-48 al RF-51 | 4 | Nuevos v7.0 |
| **Total** | | **49** | RF v7.0 — 06/07/2026 |

---

## 13. Skills de Claude Code — `.agents/skills/conins-core/`

| Skill | Propósito |
|---|---|
| `asignacion-competencia-integrity` | Integridad: instructor → ficha → competencia → RAPs heredados |
| `auth-multirole` | JWT multirol · flujo `/auth` dos tabs · registro de dos pasos |
| `backend-clean-architecture` | Controller / service / model — validaciones solo en service |
| `horario-carga-validation` | Cálculo de carga horaria — siempre en backend |
| `role-based-access-control` | Dos capas: `requireRole` + `permisoService` · `lider_ficha` no es rol · `lider_programa` no es rol (v7.0) |

---

## 14. Pendientes activos

| # | Pendiente | Responsable | Prioridad |
|---|---|---|---|
| P4 | Lista oficial de instructores ADSO con correo estandarizado | CDMC → Jair | 🟡 Media — bloquea seed instructores |
| P10 | Revisar Resolución 1415/2012 y Acuerdo 0003/2017 | Jair | 🟢 Baja |
| P11 | Definir si Zustand se mantiene o se reemplaza en Next.js 15 | Jair + Laura | 🟡 Media — evaluar en Fase 4 |
| P16 | Configurar infraestructura de pruebas automatizadas | Jair + Laura | 🟡 Media — Fase 4 |
| P17 | Implementar seguridad: xss-clean, CSRF, validacion en rutas pendientes | Jair | 🟡 Media |
| P18 | Continuous Integration (GitHub Actions) | Jair | 🟢 Baja — Fase 4 |
| P19 | Docker (Dockerfile + docker-compose) | Jair | 🟢 Baja — Fase 5 |
| P20 | Migración a PostgreSQL | Jair | 🟢 Baja — Fase 6 |
| P21 | `ultimo_acceso` no se devuelve en `GET /api/auth/usuarios` — la columna existe y se actualiza en login, pero el `SELECT` en `usuario.model.ts` no la incluye | Jair | 🟡 Media — fix de 2 líneas |
| P22 | **Sin filtrado por rol en listados generales** — `GET /api/horarios`, `/api/fichas`, `/api/asignaciones`, `/api/alertas` solo exigen `verifyToken` y devuelven el dataset completo sin filtrar por rol | Jair | 🔴 Alta — seguridad crítica antes de pruebas con usuarios reales |
| P23 | **Revalidación completa en `horario.service.ts: update()`** — deben recalcularse RN-03 y RN-05 al editar (confirmado por coordinadora 30/06/2026: un cambio de jornada debe disparar alerta si aplica) | Jair | 🟡 Media |
| P26 | **Reducción de alcance a programa ADSO** (feedback 01/07/2026) — el sistema se implementa inicialmente solo para el programa de ADSO (tecnólogo), diseñado para ser expandible. Implica filtros y vistas contextualizados a ADSO en esta fase | Jair + Laura | 🔴 Alta — decisión de arquitectura |
| P27 | **Vista día a día de fichas, instructores y ambientes** — mostrar qué actividad se realiza, en qué horas, quién y dónde; filtros cruzados (por ficha muestra instructor/ambiente; por ambiente muestra instructor/ficha; por instructor muestra ficha/ambiente) | Jair + Laura | 🔴 Alta — requisito nuevo |
| P28 | **RAPs con estados y fechas de seguimiento** — `rap_ficha_seguimiento` ya creado en schema; falta implementar endpoints, service y model completos. Estados: evaluado/pendiente, aprobado/no_aprobado. Con fechas inicio/fin por ficha para control de avance | Jair | 🔴 Alta — tabla creada, falta backend |
| P29 | **Endpoint y UI para tipos_actividad** — la tabla ya existe con 9 tipos; falta `GET /tipos-actividad` y selector en el frontend (CrearHorarioModal, EditarHorarioModal) | Jair + Laura | 🟡 Media |
| P30 | **Jornadas ampliadas a lunes-sábado** — validar que `dia_semana` ya soporta 1-6 (Lunes-Sábado); la jornada de sábado existe en seeds; confirmar UI de horarios | Jair | 🟡 Media |
| P31 | **Tipos de instructor** — un instructor puede enseñar para: técnico, tecnólogo, complementaria, investigación, desarrollo curricular, etapa productiva, aseguramiento de calidad, actividades de apoyo. Evaluar si esto se modela como `tipo_contrato` ampliado o como campo adicional | Jair | 🟡 Media — diseño |

> P1–P3, P5–P7, P14, P15, P24, P25 resueltos. P8 y P9 fuera de alcance inicial (linea medular — P26).

**Cuentas de prueba (QA, entorno local):**
- Rol Instructor: `instructor.prueba@sena.edu.co`
- Rol Asistente Coordinacion: `ljaramilloo@sena.edu.co` (activar via crear-password)

---

## 15. Archivos de referencia del proyecto

| Archivo | Versión | Descripción |
|---|---|---|
| `CONINS_contexto_general.md` | v9.5 | Este documento — contexto completo actualizado |
| `CONINS_Requisitos_Funcionales_v7_0.txt` | v7.0 | 49 RF en 9 módulos — fuente de verdad (06/07/2026) |
| `CONINS_Logica_Negocio_v5.md` | v5.2 | Reglas de negocio, schema, reglas de arquitectura (actualizado 06/07/2026) |
| `CRONOGRAMA.md` | v4.3 | 20 actividades, 5 fases, fechas y estados |
| `CHANGELOG.md` | 02/07/2026 | Historial detallado de cambios |
| `ERS_CONINS_v3.docx` | v3.0 | ERS IEEE 830-1998 — 45 RF originales + adenda RF-46, RF-47 (47 vigentes) |
| `SENA_identidad_visual_resumen_tecnico.md` | — | Paleta, tipografía y logosímbolo SENA 2024 |
| `.agents/skills/conins-core/` | — | 5 skills de Claude Code |
| `.claude/CLAUDE.md` | — | Governance del proyecto |

---

## 16. Referencia de chats del proyecto

| Chat | Última actualización | Tema principal |
|---|---|---|
| Contexto General (este) | 02/07/2026 | Contexto completo del proyecto |
| RF, RNF, CU, HU ConINs | 04/05/2026 | RF v6 (45 RF) · ERS v3 completo |
| Bitácora etapa productiva | 04/05/2026 | Bitácora mensual GFPI-F-147 |
| DB Laragon para phpMyAdmin | 02/07/2026 | Schema v5.3 · 27 tablas · roles en Title Case · tipos_actividad · rap_ficha_seguimiento |
| GitHub ConIns | 04/05/2026 | 