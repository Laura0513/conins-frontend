# CRONOGRAMA — CONINS
**Centro del Diseño y Manufactura del Cuero (CDMC) — SENA**
*Ultima actualizacion: 06/07/2026*

---

## Datos generales

| Campo | Valor |
|---|---|
| Proyecto | CONINS — Control de Instructores CDMC |
| Aprendiz backend / BD | Jair Enrique González Buelvas |
| Aprendiz frontend / diseño | Laura Sofía Posada |
| Instructor líder técnico | Luis Eladio Porras Camargo |
| Instructor líder anterior | Wilmar Alexander Zapata |
| Instructor de seguimiento | Gloria Eugenia Jaramillo |
| Coordinadora Académica | Leidy Johana Ruiz Cortés |
| Inicio Jair | 09/04/2026 |
| Inicio Laura | 07/04/2026 |
| Fin etapa productiva | 07/10/2026 |
| Jornada | Lunes a viernes, 7:00–17:30 (9h efectivas) |
| Días hábiles Jair | 121 días / 1.089 horas |
| Días hábiles Laura | 123 días / 1.107 horas |

---

## Festivos dentro del período (no se labora)

| Fecha | Día | Festivo |
|---|---|---|
| 17/04/2026 | Viernes | Día cívico decretado |
| 01/05/2026 | Viernes | Día del trabajo |
| 18/05/2026 | Lunes | Ascensión del Señor |
| 08/06/2026 | Lunes | Corpus Christi |
| 15/06/2026 | Lunes | Sagrado Corazón |
| 29/06/2026 | Lunes | San Pedro y San Pablo |
| 20/07/2026 | Lunes | Independencia de Colombia |
| 07/08/2026 | Viernes | Batalla de Boyacá |
| 17/08/2026 | Lunes | Asunción de la Virgen |

---

## Cronograma de fases y actividades

### FASE 1 — Análisis y requisitos
**Semanas 1–4 | 09/04/2026 – 30/04/2026**
**Responsable principal:** Jair y Laura (conjunta)
**Estado:** ✅ COMPLETADA

| # | Actividad | Responsable | Fecha inicio | Fecha fin | Estado |
|---|---|---|---|---|---|
| 1 | Caracterizar los procesos de gestión académica del CDMC | Jair + Laura | 09/04/2026 | 09/04/2026 | ✅ |
| 2 | Recolectar requisitos del sistema CONINS | Jair + Laura | 09/04/2026 | 13/04/2026 | ✅ |
| 3 | Establecer y documentar RF y RNF | Jair | 13/04/2026 | 16/04/2026 | ✅ |
| 4 | Validar informe de requisitos con el coordinador | Jair + Laura | 15/04/2026 | 28/04/2026 | ✅ |
| 5 | Planear actividades de análisis y construcción | Jair | 16/04/2026 | 28/04/2026 | ✅ |

**Evidencias generadas:**
- ✅ Acta de reunión kick-off (09/04/2026)
- ✅ ERS_CONINS_v3.docx bajo IEEE 830 (45 RF, 14 RNF, CU, HU, diagramas integrados)
- ✅ CONINS_contexto_general_v6.md
- ✅ CONINS_Requisitos_Funcionales_v6.txt (45 RF en 8 módulos)
- ✅ CONINS_Logica_Negocio_v5.md
- ✅ Plan de trabajo concertado (GFPI-F-023 V06 firmado 28/04/2026)

---

### FASE 2 — Modelado y diseño
**Semanas 5–6 | 04/05/2026 – 15/05/2026**
**Responsable principal:** Jair (BD) — Laura (interfaz gráfica)
**Estado:** ✅ COMPLETADA ANTICIPADAMENTE (sem. 5)

| # | Actividad | Responsable | Fecha inicio | Fecha fin | Estado |
|---|---|---|---|---|---|
| 6 | Modelar funciones con diagramas PlantUML (CU, ACT, SEQ, EST, DEP) | Jair | 04/05/2026 | 04/05/2026 | ✅ |
| 7 | Verificar modelos con instructor técnico y de seguimiento | Jair + Laura | 04/05/2026 | 04/05/2026 | ✅ Wilmar · 🔄 revisión administrativa pendiente hoy |
| 8 | Estructurar modelo de datos (20 tablas, relaciones, restricciones) | Jair + Laura | 04/05/2026 | 04/05/2026 | ✅ |

**Notas:**
- Diagramas PlantUML completos para todos los módulos (RF-01 al RF-45), integrados al ERS.
- Schema `database.sql` **cerrado definitivamente** el 04/05/2026 con 20 tablas. Correcciones aplicadas: `curso_especial` en `programas.nivel`, `operario` en `programas.tipo_formacion`, roles limpios (5 exactos), `Lider Ficha` eliminado, `fichas.etapa` corregido a `('lectiva','productiva')`, tablas `instructor_novedades`, `ambiente_bloqueos` y `notificaciones` agregadas.
- BD local (Laragon/phpMyAdmin) migrada y sincronizada con el schema final. RF-01 al RF-45 cubiertos.
- Diagramas se revisarán periódicamente ante cambios en los RF (indicación de Wilmar Zapata).

**Evidencias generadas:**
- ✅ Diagramas PlantUML completos — rama dev/Jair
- ✅ Revisión técnica de modelos por instructor líder Wilmar Zapata (04/05/2026)
- ✅ Script `database.sql` schema v4 — 20 tablas, validado y corregido — rama dev/Jair

---

### FASE 3 — Construcción
**Semanas 7–18 | 19/05/2026 – 06/08/2026**
**Responsable:** Jair (backend + BD) — Laura (frontend)
**Estado:** 🔄 EN CURSO

| # | Actividad | Responsable | Fecha inicio | Fecha fin | Estado |
|---|---|---|---|---|---|
| 9 | Implementar database.sql v4 con fixes de consistencia (IC-01 a IC-09) | Jair | 19/05/2026 | 22/05/2026 | ✅ |
| 10 | Desarrollar backend (TypeScript + MVC + ESM6 + seguridad) | Jair | 19/05/2026 | 03/07/2026 | 🔄 (módulos Auth, Instructores, Fichas, Horarios, Asignaciones, Notificaciones, Ambientes, Consultas, Auditoria implementados) |
| 11 | Implementar módulo de autenticación y control de acceso JWT | Jair | 23/05/2026 | 30/05/2026 | ✅ |
| 12 | Construir vistas frontend (Next.js 15 + Pages Router + TS + Tailwind + Fetch) | Laura | 19/05/2026 | 10/07/2026 | 🔄 (11 páginas: auth, dashboard, instructores, ambientes, fichas, asignaciones, horarios, alertas, consultas) |
| 13 | Carga y normalización de datos reales desde Sofía Plus | Jair | 07/07/2026 | 17/07/2026 | ⬜ |
| 14 | Módulo de reportes PDF por área, instructor y jornada | Jair + Laura | 20/07/2026 | 06/08/2026 | ⬜ |

**Nota migración TS:** Backend reconstruido desde cero en **TypeScript + MVC + ESM6** (no migración incremental). Frontend migra de la base en JS a **Next.js 15 con Pages Router + TypeScript**, confirmado en feedback con Juan Pablo Hoyos, Wilmar Zapata y Gloria Jaramillo (06/05/2026).

**Evidencias generadas:**
- ✅ Script `database.sql` schema v5 — 25 tablas, verificado 30/06/2026 por conteo directo (corrección: se documentó antes como "v5.2, 27 tablas"; `lider_id` y `ultimo_acceso` son columnas, no tablas nuevas) — fixes aplicados: password NULL, roles snake_case, motivo_suspension, ambiente_id en horarios, leida en alertas, auditoria, triggers, procedures, vistas, tipos_novedad_*, ficha_novedades, lider_id en fichas, ultimo_acceso en usuarios
- ✅ Backend TypeScript + MVC scaffold — 60+ archivos (controllers, services, models, routes, middleware, utils, constants, schemas)
- ✅ Capa de seguridad implementada — helmet, express-rate-limit, zod validation, audit logging
- ✅ Skills del proyecto actualizadas a v4 — paths corregidos, roles actualizados, RN-06 en service
- ✅ CLAUDE.md governance actualizado — sin bloqueadores resueltos, referencias .ts, limites confirmados
- ✅ Módulo de autenticación JWT con control de acceso por roles — login, crear-password, cambiar-contrasena, perfil
- ✅ Módulo de instructores — CRUD completo + competencias habilitadas + novedades + detalle completo
- ✅ Módulo de fichas — CRUD + finalizar + toggle estado + validación numero_ficha único
- ✅ Módulo de horarios — CRUD + toggle estado + validaciones RN-04/RN-05/RN-09/RN-14 + alertas
- ✅ Módulo de asignaciones — CRUD + desactivar + provisionales + validaciones RN-06/RN-08/RN-12/RN-13 + trazabilidad RN-16
- ✅ Módulo de notificaciones — RF-38 a RF-40 implementados (internas + correo Nodemailer)
- ✅ Módulo de ambientes — CRUD completo + bloqueo + listar bloqueos
- ✅ Módulo de consultas — carga horaria, horarios ficha, ocupacion ambientes
- ✅ Módulo de auditoria — bitacora con triggers automaticos + endpoint API
- ✅ Módulo de programas — GET lista simple para dropdowns
- ✅ PermisoService — validaciones de alcance líder/coordinador (RN-12)
- ✅ Frontend Next.js 15 integrado — 11 páginas, 18 componentes modulares, hooks de auth y toast
- ✅ terminology.ts — nomenclatura configurable (RN-17)
- ✅ RN-09 y RN-13 implementadas — reglas de negocio completas

**Evidencias pendientes:**
- ⬜ Código fuente frontend completo con todas las páginas conectadas al backend — rama dev/laura
- ⬜ Informe de carga y normalización de datos desde Sofía Plus
- ⬜ Módulo de reportes PDF — rama dev/Jair
- ⬜ Pruebas automatizadas (unitarias, integración, E2E)

---

### FASE 4 — Pruebas y ajustes
**Semanas 19–21 | 10/08/2026 – 28/08/2026**
**Responsable:** Jair y Laura (conjunta)
**Estado:** ⬜ PENDIENTE

| # | Actividad | Responsable | Fecha inicio | Fecha fin | Estado |
|---|---|---|---|---|---|
| 15 | Ejecutar pruebas funcionales sobre todos los módulos | Jair + Laura | 10/08/2026 | 14/08/2026 | ⬜ |
| 16 | Registrar defectos, corregir y re-probar | Jair + Laura | 17/08/2026 | 21/08/2026 | ⬜ |
| 17 | Sesiones de validación con directivos CDMC y actas | Jair + Laura | 24/08/2026 | 28/08/2026 | ⬜ |

**Evidencias a generar:**
- ⬜ Plan de pruebas funcionales por módulo con criterios de aceptación
- ⬜ Informe de pruebas con defectos registrados y correcciones por ciclo
- ⬜ Actas de sesiones de validación con directivos CDMC

---

### FASE 5 — Documentación y despliegue
**Semanas 22–24 | 31/08/2026 – 18/09/2026**
**Responsable:** Jair y Laura (conjunta)
**Estado:** ⬜ PENDIENTE

| # | Actividad | Responsable | Fecha inicio | Fecha fin | Estado |
|---|---|---|---|---|---|
| 18 | Elaborar manual técnico, de usuario y de despliegue | Jair + Laura | 31/08/2026 | 11/09/2026 | ⬜ |
| 19 | Despliegue en entorno de producción del CDMC | Jair | 14/09/2026 | 16/09/2026 | ⬜ |
| 20 | Entrega formal con acta y socialización a usuarios | Jair + Laura | 17/09/2026 | 18/09/2026 | ⬜ |

**Evidencias a generar:**
- ⬜ Manual técnico, manual de usuario y manual de despliegue del sistema CONINS
- ⬜ Sistema CONINS desplegado en producción con URL documentada
- ⬜ Acta de entrega formal firmada por coordinador e instructor líder

---

### BUFFER — Cierre y bitácora SENA
**Semanas 25–27 | 21/09/2026 – 07/10/2026**

Semanas reservadas para:
- Ajustes post-entrega si el cliente solicita correcciones
- Consolidación y entrega de la bitácora mensual final (GFPI-F-147)
- Diligenciamiento del formato de evaluación final (GFPI-F-023 V06)
- Cierre administrativo de la etapa productiva

---

## Resumen visual del cronograma

```
ABR 2026        MAY 2026        JUN 2026        JUL 2026        AGO 2026        SEP 2026        OCT
S1 S2 S3 S4 | S5 S6 S7 S8 | S9 S10 S11 S12 | S13 S14 S15 S16 | S17 S18 S19 S20 S21 | S22 S23 S24 S25 S26 S27
[===FASE 1===] [F2] [===========FASE 3 — CONSTRUCCIÓN (12 semanas)=============] [=F4=] [===F5===] [BUFFER]
✅✅✅✅    ✅  🔄
```

| Fase | Semanas | Período | Duración | Estado |
|---|---|---|---|---|
| F1 — Análisis y requisitos | 1–4 | 09/04 – 30/04/2026 | 4 semanas | ✅ Completada |
| F2 — Modelado y diseño | 5–6 | 04/05 – 15/05/2026 | 2 semanas | ✅ Completada (sem. 5) |
| F3 — Construcción | 7–18 | 19/05 – 06/08/2026 | 12 semanas | 🔄 En curso |
| F4 — Pruebas y ajustes | 19–21 | 10/08 – 28/08/2026 | 3 semanas | ⬜ Pendiente |
| F5 — Documentación y despliegue | 22–24 | 31/08 – 18/09/2026 | 3 semanas | ⬜ Pendiente |
| Buffer / Cierre | 25–27 | 21/09 – 07/10/2026 | 3 semanas | ⬜ Reservado |

---

## Convenciones de estado

| Ícono | Significado |
|---|---|
| ✅ | Completado |
| 🔄 | En curso o parcialmente completado |
| ⬜ | Pendiente |
| ⚠️ | Bloqueado — requiere acción externa |

---

## Pendientes activos

| # | Pendiente | Impacto | Responsable | Prioridad |
|---|---|---|---|---|
| ~~P1~~ | ~~Confirmar límite exacto de horas semanales~~ | ~~Bloquea `horarioService` y RF-32~~ | ~~Resuelto 04/05/2026~~ | ✅ |
| ~~P2~~ | ~~Confirmar término oficial etapa de ficha~~ | ~~Bloquea seed y BD~~ | ~~Resuelto 04/05/2026~~ | ✅ |
| ~~P3~~ | ~~Confirmar campo de login en producción~~ | ~~Bloquea auth en producción~~ | ~~Resuelto 04/05/2026~~ | ✅ |
| P4 | Lista oficial de instructores con correo estandarizado del CDMC | Bloquea seed de instructores | CDMC → Jair | 🟡 Media |
| ~~P5~~ | ~~Crear tablas `instructor_novedades`, `ambiente_bloqueos` y `notificaciones`~~ | ~~RF-16, RF-31, RF-38/39/40~~ | ~~Resuelto 04/05/2026~~ | ✅ |
| ~~P6~~ | ~~Agregar `operario` al ENUM de `programas.tipo_formacion`~~ | ~~Bloquea seed completo~~ | ~~Resuelto 04/05/2026~~ | ✅ |
| ~~P7~~ | ~~Migración JS → TypeScript + MVC + ESM6 (backend y frontend)~~ | ~~Inicio Fase 3 sem. 7~~ | ~~Resuelto 19/05/2026 — rebuild desde cero en TS~~ | ✅ |
| P8 | Apellido completo del co-líder Rivera (Técnico Medular) | Bloquea seed de áreas | CDMC → Jair | 🟢 Baja |
| P9 | Apellido completo de Catalina (líder Talento Humano) | Bloquea seed de áreas | CDMC → Jair | 🟢 Baja |
| P10 | Revisar Resolución 1415/2012 y Acuerdo 0003/2017 | Validar reglas de negocio | Jair | 🟢 Baja |

---

## Semana en curso

### Semana del 21/07/2026
**Rework por feedback lider tecnico: RF v10.1 + RNF v1.0 + Logica de Negocio v5.6**

| Prioridad | Tarea |
|---|---|
| ✅ 21/07 | **RF v10.1:** 62 RF en 12 modulos. Nuevo modulo Competencias y RAPs (RF-25 a RF-28). Sintaxis normativa estandar |
| ✅ 21/07 | **RNF v1.0 (NUEVO):** 24 RNF en 8 categorias — separados de los RF |
| ✅ 21/07 | **Logica de Negocio v5.6:** RN-15 redefinida (RAP directo, sin herencia), RN-25/26/27 nuevas, tabla asignacion_rap |
| ✅ 21/07 | `CONINS_contexto_general.md` → v9.6 · `CRONOGRAMA.md` → v4.7 · CHANGELOG entrada 21/07 |
| ✅ 21/07 | Decisiones adoptadas: RAP directo, CRUD competencias/RAPs, horario-RAP, terminologia GRUPO, etapas con fechas |
| ✅ 21/07 | **P34 (backend):** modulo CRUD Competencias y RAPs (RF-25 a RF-28) — competencia.controller/routes, /api/competencias |
| ✅ 21/07 | **RF-24:** referente de programa via lider_programa (setReferente 1:1) + GET detalle con referente |
| ✅ 21/07 | **RF-44:** referente de grupo mapeado a fichas.lider_id (sin columna nueva) |
| ✅ 21/07 | **P29 verificado:** fecha_fin_productiva y capacidad ya existian en schema — sin cambio |
| ✅ 21/07 | **P32 (Laura):** terminologia GRUPO aplicada en +20 archivos frontend |
| ✅ 21/07 | tsc --noEmit limpio (exit 0) |
| 🔴 FASE 1 | **P29b:** schema — tabla asignacion_rap (modelo RAP directo) |
| 🔴 FASE 1 | **P30/P31:** estados RAP en rap_ficha_seguimiento + bitacora auditoria transversal (RF-59) |
| 🔴 FASE 2 | **P35:** asignacion explicita de RAP (RF-42, RN-15 redefinida) |
| 🔴 FASE 2 | **P36:** horario vinculado a RAP (rap_id) + validacion RN-27 |
| 🟡 FASE 2 | **P33:** selector de rol activo al login para multi-rol (RF-11) |
| 🟡 FASE 3 | **P28:** fix CrearBloqueHorarioModal (ficha.id → ficha.programa_id) |
| 🟡 FASE 3 | Frontend: selectores de RAP en asignaciones (RF-42) y horarios (RF-34) — esperan P35/P36 |
| 🟡 FASE 4 | **P16/P17/P27:** pruebas automatizadas, seguridad, SMTP |
| 🟡 Pendiente | Eliminar `CONINS_Logica_Negocio_v5_5_1.txt` del repo (superado por v5.6) |
| 🟡 Pendiente | Commit y push del rework (docs + backend) |

---

### Semana del 14/07/2026 (historico)
**tipo_contrato cleanup (DB + backend) + RF v8.0 + documentacion v5.4/v9.5**

| Prioridad | Tarea |
|---|---|
| ✅ 14/07 | **L4:** `tipo_contrato` eliminado del backend (model, schemas, services, controllers) — RN-03 aplica a todos |
| ✅ 14/07 | **L5:** endpoints recuperar/resetear-contrasena + tabla `password_reset_tokens` (token 1h, single-use) |
| ✅ 14/07 | **L1:** fichas `findById` amplido — fechas lectiva/productiva + ambiente_nombre + lider_nombre |
| ✅ 14/07 | **L2/RF-47:** novedades de fichas — GET/POST/PATCH `/api/fichas/:id/novedades` |
| ✅ 14/07 | **L6:** `onAlertaCargaHoraria` conectado en `horario.controller.ts` |
| ✅ 14/07 | Frontend Laura: `exportPDF` null fix + `api.ts` metodos alineados |
| ✅ 14/07 | **SEED-ADSO:** competencias y RAPs reales ADSO 228118 — 22 competencias, 79 RAPs |
| ✅ 15/07 | `database.sql` — 8 fixes tipo_contrato (DDL + 3 triggers + sp_crear_instructor + 2 views + INSERT IGNORE tipos_actividad) |
| ✅ 15/07 | `seed_data.sql` — tipo_contrato eliminado de INSERT instructores (C9) |
| ✅ 15/07 | **RF v8.0:** `CONINS_Requisitos_Funcionales_v8_0.txt` — 53 RF en 11 modulos, numeracion secuencial |
| ✅ 15/07 | `CONINS_Logica_Negocio_v5.md` → v5.4: 4 roles Title Case, RN-03/12/15 actualizadas, 28 tablas |
| ✅ 15/07 | `CONINS_contexto_general.md` → v9.5: hitos al 15/07, 4 roles, 28 tablas, RF v8.0 |
| 🟡 Pendiente | Commit y push de sesiones 14/07 y 15/07 (pendiente tsc limpio) |
| 🟡 Pendiente | Configurar SMTP (P27) para activar recuperar-contrasena y notificaciones por correo |
| 🟡 Pendiente | Fix CrearBloqueHorarioModal — usa ficha.id en lugar de ficha.programa_id (P28) |
| 🟡 Pendiente | Revisar seguridad: xss-clean, CSRF, validacion en rutas pendientes (P17) |
| 🟡 Pendiente | Configurar infraestructura de pruebas automatizadas (P16) |

---

### Semana del 06/07/2026 (historico)
**RF v7.0 (roles finales) + skills v5 + revision dev/laura + gap items implementados**

| Prioridad | Tarea |
|---|---|
| ✅ 06/07 | RF v7.0: 4 roles definitivos (Title Case), lider_programa absorbido por Coordinadora Academica |
| ✅ 06/07 | Skills conins-core actualizadas a v5: auth-multirole, RBAC, asignacion, horario, arquitectura |
| ✅ 06/07 | Revision completa de rama dev/laura — gap items confirmados e implementados |
| ✅ 06/07 | **P22 (CRITICO):** filtrado por rol en GET /horarios, /fichas, /asignaciones, /alertas — Instructor ve solo sus datos |
| ✅ 06/07 | **P23 (RF-37):** horario update() revalida RN-03, RN-04, RN-05, RN-09 — alertas propagadas en respuesta |
| ✅ 06/07 | **P28 (RF-50):** modulo rap-ficha-seguimiento completo (model + service + controller + routes + schema) |
| ✅ 06/07 | **P29 (RF-49):** GET /api/catalogo/tipos-actividad implementado |
| ✅ 06/07 | **P24:** alias GET /api/notificaciones/mis agregado — frontend ya puede llamar esa ruta |
| ✅ 06/07 | **P21:** ultimo_acceso incluido en SELECT y mapeo de findAll()/findAllActive() en usuario.model.ts |
| ✅ 06/07 | database.sql: sp_crear_instructor corregido (rol_id 5 → 4) |
| ✅ 06/07 | tsc limpio al cierre de sesion |

---

### Semana del 22/06/2026 al 30/06/2026 (historico)
**Sincronizacion endpoints con frontend Laura (dev/laura) + verificacion directa del backend contra el codigo**

| Prioridad | Tarea |
|---|---|
| ✅ 30/06 | Commit `6c2a6f4`: suspender horarios, programas-lider, lider_id en fichas, ultimo_acceso |
| ✅ 30/06 | Confirmado en codigo: catalogo tipos-novedad-*, aprobar/rechazar/suspender horarios, RF-35 (RN-06) |
| ✅ 30/06 | Confirmado en codigo: tabla `notificaciones` + GET /api/notificaciones + PATCH /:id/leida |
| ✅ 30/06 | Corregido conteo real de `database.sql`: 25 tablas, schema v5 (no 27 / v5.2 como se documentaba) |
| ✅ 30/06 | Documentos de contexto actualizados a v9.3 / CRONOGRAMA v4.2 |

---

### Semana 10 — 09/06/2026 al 13/06/2026 (histórico)
**Backend completo + frontend 11 paginas + RN-09 y RN-13 implementadas + cambio de equipo directivo**

| Prioridad | Tarea |
|---|---|
| ✅ 09/06 | RN-09 implementada: bloqueo de ambiente vigente valida al crear/editar horarios |
| ✅ 09/06 | RN-13 implementada: validacion de competencia habilitada por contrato al asignar |
| ✅ 09/06 | Endpoint GET /api/alertas implementado con filtros y marcadores |
| ✅ 09/06 | Merge frontend Laura integrado: 11 paginas, 18 componentes modulares |
| ✅ 09/06 | Endpoints de consultas: carga-horaria, horarios-ficha, ocupacion-ambientes |
| ✅ 09/06 | Ambientes CRUD completo: POST, PUT, bloquear, listar bloqueos |
| ✅ 09/06 | Asignaciones historicas: GET /api/asignaciones/historicas |
| ✅ 09/06 | Horarios dias multiples: PUT /api/horarios/:id (dia_ids array) |
| ✅ 10/06 | Cambio de equipo directivo: nuevo instructor Luis Eladio Porras, nueva coordinadora Leidy Johana Ruiz |
| ✅ 10/06 | Documentos de contexto actualizados a v9.1 |
| ✅ 10/06 | Schema v5.1: tipos_novedad_*, ficha_novedades, documento/tipo_documento en usuarios. RF-46 y RF-47 |
| ✅ 10/06 | Flujo aprobacion horarios: estado pendiente/aprobado/rechazado, PATCH aprobar/rechazar |
| ✅ 10/06 | GET /api/auth/usuarios retorna rol como texto |
| ✅ 11/06 | Schema v5.2: lider_id en fichas, ultimo_acceso en usuarios |
| ✅ 11/06 | Endpoints catalogo: tipos-novedad-*, jornadas, ambientes, programas, competencias, raps, areas |
| ✅ 11/06 | PATCH /api/horarios/:id/suspender — suspension de horarios con motivo |
| ✅ 11/06 | PUT /api/auth/usuarios/:id/programas — asignar programas a lider |
| ✅ 11/06 | POST/PATCH /api/fichas aceptan lider_id |
| ✅ 11/06 | ultimo_acceso se actualiza automaticamente en login |
| ✅ 11/06 | Documentos de contexto actualizados a v9.2 |
| 🟡 Esta semana | Importar database.sql v5.2 (Laura), adaptar frontend para tipo_novedad_id, documento |
| 🟡 Esta semana | Revisar seguridad: xss-clean, CSRF, validacion en rutas pendientes |
| 🟡 Esta semana | Configurar infraestructura de pruebas automatizadas |

---

## Historial de actualizaciones

| Fecha | Cambio |
|---|---|
| 21/07/2026 | v4.7 — Rework por feedback lider tecnico. RF v10.1 (62 RF, 12 modulos, nuevo modulo Competencias y RAPs). RNF v1.0 nuevo (24 RNF). Logica de Negocio v5.6 (RN-15 redefinida RAP directo, RN-25/26/27, tabla asignacion_rap). Contexto General v9.6. Decisiones: RAP directo, CRUD competencias/RAPs, horario-RAP, terminologia GRUPO. Pendientes P29-P36 abren Fase 1 y 2. |
| 15/07/2026 | v4.6 — database.sql + seed_data.sql: tipo_contrato eliminado (DDL, 3 triggers, sp_crear_instructor, 2 views, seed INSERT). RF v8.0: 53 RF en 11 modulos, numeracion secuencial. Logica de Negocio v5.4. Contexto General v9.5. CHANGELOG entradas 14/07 y 15/07. |
| 14/07/2026 | v4.5b — tipo_contrato eliminado del backend. recuperar/resetear-contrasena + password_reset_tokens. fichas findById ampliado. novedades RF-47 (GET/POST/PATCH). onAlertaCargaHoraria conectado. Frontend Laura: exportPDF fix + api.ts. Seed ADSO 228118: 22 competencias, 79 RAPs reales. |
| 06/07/2026 | v4.5 — RF v7.0: 4 roles definitivos (lider absorbido), skills v5. Gap items de dev/laura: P22 (filtrado por rol), P23 (update() RN-03/RN-05), P28 (rap-seguimiento), P29 (tipos-actividad), P24 (alias /mis), P21 (ultimo_acceso), database.sql sp_crear_instructor. tsc limpio. |
| 30/06/2026 | v4.2 — Sincronizacion con feedback Laura (commit `6c2a6f4`): suspender horarios, programas-lider, lider_id en fichas, ultimo_acceso confirmados en codigo. Corregido conteo real de `database.sql`: 25 tablas / schema v5 (antes documentado como 27 tablas / v5.2 por error). Gap critico detectado: backend sin filtrado por rol en listados generales (P22). Documentos de contexto actualizados a v9.3. |
| 11/06/2026 | v4.1 — Schema v5.2: lider_id en fichas, ultimo_acceso en usuarios. 6 endpoints de catalogo tipificados. Patch suspender horario. PUT programas a lider. Login actualiza ultimo_acceso. Documentos de contexto actualizados a v9.2. |
| 10/06/2026 | v4.0 — Cambio de equipo directivo: nuevo instructor líder Luis Eladio Porras Camargo, nueva coordinadora Leidy Johana Ruiz Cortés. RN-09 y RN-13 implementadas. Frontend 11 paginas. DB v5 con auditoria, triggers, procedures, vistas. Endpoints de alertas, consultas, ambientes CRUD. Documentos actualizados. |
|---|---|
| 28/04/2026 | Creación del cronograma v1.0. Fase 1 completada. Stack actualizado a TypeScript + MVC + ESM6 + Fetch. GFPI-F-023 V06 firmado por ambos aprendices y coordinador Juan Pablo Hoyos. |
| 04/05/2026 | v2.0 — Fase 2 completada anticipadamente (sem. 5). Actividades 6, 7 y 8 en ✅. Diagramas PlantUML completos integrados al ERS. `database.sql` cerrado definitivamente: 20 tablas, RF-01 al RF-45 cubiertos, P1–P3 y P5–P6 resueltos. `fichas.etapa` = `('lectiva','productiva')`, `operario` en tipo_formacion, 3 tablas nuevas agregadas, BD local sincronizada. Pendientes restantes: P4 (instructores), P7 (migración TS), P8–P10 (datos y normativa). |
| 06/05/2026 | v2.1 — Stack frontend actualizado: Vite eliminado, frontend migra a **Next.js 15 con Pages Router** (confirmado en feedback con Juan Pablo Hoyos, Wilmar Zapata y Gloria Jaramillo). Lucide React confirmado como biblioteca de íconos. Actividad 12 y evidencias de Fase 3 actualizadas. P11 creado: definir gestión de estado en Next.js 15. |
| 19/05/2026 | v3.0 — **Fase 3 iniciada.** Backend reconstruido desde cero en TypeScript + MVC + ESM6 (52 archivos). database.sql v4 con 9 fixes de consistencia aplicados. Capa de seguridad implementada (helmet, rate-limit, zod, xss-clean, audit logging). Skills del proyecto actualizadas a v4. CLAUDE.md governance actualizado. P7 resuelto (rebuild en TS). |
| 28/05/2026 | v3.1 — **Backend completo: módulos Fichas, Horarios, Asignaciones + validaciones RN + notificaciones.** Actividad 11 (Auth JWT) completada. Actividad 10 avanzada: módulos Auth, Instructores, Fichas, Horarios, Asignaciones, Notificaciones implementados con todas las reglas de negocio (RN-03 a RN-17). Actividad 12 (frontend) avanzada: 6 páginas integradas desde rama dev/laura. Schema actualizado con ambiente_id en horarios y leida en alertas. Informe de avances backend generado. |

---

*CONINS · SENA CDMC · Cronograma v4.7 · 21 de Julio 2026*
