# CRONOGRAMA — CONINS
**Centro del Diseño y Manufactura del Cuero (CDMC) — SENA**
*Última actualización: 06/07/2026*

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
| 7 | Verificar modelos con instructor técnico y de seguimiento | Jair + Laura | 04/05/2026 | 04/05/2026 | ✅ |
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

**Nota migración TS:** Backend reconstruido desde cero en TypeScript + MVC + ESM6 (no migración incremental). Frontend migra a Next.js 15 con Pages Router + TypeScript (confirmado 06/05/2026).

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
| P4 | Lista oficial de instructores con correo estandarizado del CDMC | Bloquea seed de instructores | CDMC → Jair | 🟡 Media |
| P8 | Apellido completo del co-líder Rivera (Técnico Medular) | Fuera de alcance ADSO inicial (ver P26) | CDMC → Jair | 🟢 Baja |
| P9 | Apellido completo de Catalina (líder Talento Humano) | Fuera de alcance ADSO inicial (ver P26) | CDMC → Jair | 🟢 Baja |
| P10 | Revisar Resolución 1415/2012 y Acuerdo 0003/2017 | Validar reglas de negocio | Jair | 🟢 Baja |

---

## Semana en curso

### Semana del 30/06/2026 al 06/07/2026
**Feedback coordinadora (01/07) — restructuración de roles + schema v27 + fixes B1/B2/I3 + actualizacion de documentos**

| Prioridad | Tarea |
|---|---|
| ✅ 01/07 | Roles restructurados: snake_case → Title Case, 5 → 4 roles, `lider_programa` eliminado del sistema |
| ✅ 01/07 | Schema v5.3: tabla `tipos_actividad` (26) + `rap_ficha_seguimiento` (27) + columnas nuevas en `fichas` y `horarios` |
| ✅ 01/07 | `constants/roles.ts`, todos los route guards, `auth.service.ts` actualizados — commits `2998245`, `717be2b` |
| ✅ 02/07 | Fixes B1 (fichas + fechas productivas), B2 (horarios + tipo_actividad_id), I3 (dead code) — tsc clean — commit `617bdfd` |
| ✅ 02/07 | Nueva usuaria: Laura Jaramillo Ospina (Asistente Coordinacion, `ljaramilloo@sena.edu.co`) |
| ✅ 02/07 | Reporte de cambios para Laura Posada (frontend) — `REPORTE_CAMBIOS_BACKEND_01072026_frontend.md` |
| ✅ 06/07 | Documentos de contexto actualizados: CHANGELOG, contexto_general v9.4, CRONOGRAMA v4.3, Logica_Negocio_v5 |
| ✅ 06/07 | Gitignores fix: CRLF + em-dash truncaban los patrones — reescritos con LF puro. `backend/.env` y `seed_data.sql` ahora ignorados correctamente |
| ✅ 06/07 | `seed_data.sql` v6: Paul Tamayo y medulares sin rol; Rocio Medina sin rol; Luis Eladio Porras agregado; Calzado eliminado del test data |
| ✅ 06/07 | **RF v7.0 aprobado** — `CONINS_Requisitos_Funcionales_v7_0.txt` (49 RF en 9 modulos). Opcion A: lider_programa pasa a figura informativa. RF-30/RF-43 eliminados, RF-39 reescrito, RF-48 a RF-51 nuevos |
| ✅ 06/07 | `CONINS_contexto_general.md` actualizado a v9.5, `CONINS_Logica_Negocio_v5.md` a v5.2 |
| 🔴 Pendiente — Alta | **P22 (= RF-48): backend sin filtrado por rol** en GET /api/horarios, /fichas, /asignaciones, /alertas — implementar antes de pruebas con usuarios reales |
| 🔴 Pendiente — Alta | **P26: reducción de alcance a ADSO** — filtros y vistas contextualizados al programa ADSO |
| 🔴 Pendiente — Alta | **P27: vista día a día** — fichas, instructores, ambientes con filtros cruzados |
| 🔴 Pendiente — Alta | **P28 (= RF-50): endpoints RAP seguimiento** — `rap_ficha_seguimiento` (tabla creada, falta backend) |
| 🟡 Pendiente | P21: agregar `ultimo_acceso` al SELECT/mapeo de `GET /api/auth/usuarios` |
| 🟡 Pendiente | P23 (= RF-37 gap): revalidación completa RN-03/RN-05 en `horario.service.ts: update()` |
| 🟡 Pendiente | P29 (= RF-49): endpoint `GET /tipos-actividad` + selector en frontend |
| 🟡 Pendiente | P30: validar soporte lunes-sábado en horarios |
| 🟡 Pendiente | Laura Posada: aplicar cambios del reporte frontend (roles, fechas productivas, tipo_actividad_id) |

---

### Semana del 22/06/2026 al 30/06/2026
**Sincronizacion endpoints con frontend Laura (dev/laura) + verificacion directa del backend contra el codigo**

| Prioridad | Tarea |
|---|---|
| ✅ 30/06 | Commit `6c2a6f4`: suspender horarios, programas-lider, lider_id en fichas, ultimo_acceso |
| ✅ 30/06 | Confirmado en codigo: catalogo tipos-novedad-*, aprobar/rechazar/suspender horarios, RF-35 (RN-06) |
| ✅ 30/06 | Confirmado en codigo: tabla `notificaciones` + GET /api/notificaciones + PATCH /:id/leida |
| ✅ 30/06 | Credenciales de prueba (rol Instructor) recibidas de Laura para validar sidebar/vistas filtradas |
| ✅ 30/06 | Corregido conteo real de `database.sql`: 25 tablas, schema v5 (no 27 / v5.2 como se documentaba) |
| ✅ 30/06 | Documentos de contexto actualizados a v9.3 / CRONOGRAMA v4.2 |
| ✅ 30/06 | P23 confirmado por Laura: revalidar RN-03/RN-05 al editar horarios |
| ✅ 30/06 | P24 cerrado: Laura usa ruta real `/api/notificaciones` sin cambio |
| ✅ 30/06 | P25 cerrado: schema corregido a 25 tablas / v5 en documentación |

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
| 02/07/2026 | v4.3 — Roles restructurados a Title Case (4 roles), schema v5.3 con tipos_actividad y rap_ficha_seguimiento, fixes B1/B2/I3, nueva usuaria Laura Jaramillo. Nuevos pendientes P26-P31. |
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

*CONINS · SENA CDMC · Cronograma v4.4 · 06 de Julio 2026*
