# CONINS — Sesión 30/06/2026: sincronización de contexto + feedback para Laura

**Autor:** Jair Enrique González Buelvas (con asistencia de Claude)
**Fecha:** 30/06/2026
**Propósito de este archivo:** (1) resumen de sesión para pegar en un chat de Claude o archivar como referencia del proyecto, (2) mensaje listo para enviar a Laura con el estado real del backend.

---

## 1. Resumen ejecutivo

Laura entregó 4 mensajes de feedback (frontend sincronizado con `dev/laura`, endpoints nuevos requeridos, validaciones RF-35/RF-37, sistema de notificaciones RF-38 a RF-40, y credenciales de prueba del rol Instructor). En vez de dar por buena la documentación existente, se verificó **directamente sobre el código del backend** qué de eso ya está implementado, qué falta y qué quedó mal documentado.

**Documentos actualizados como resultado:**

| Archivo | Cambio |
|---|---|
| `CHANGELOG.md` | Nueva entrada 30/06/2026 con verificación completa + limpieza de duplicado RF |
| `CONINS_contexto_general.md` | v9.2 → **v9.3** — hitos, schema corregido, 5 pendientes nuevos (P21–P25) |
| `CRONOGRAMA.md` | v4.1 → **v4.2** — semana actual actualizada, historial de cambios |
| `.claude/CLAUDE.md` (proyecto) | Contenido corregido entregado en `CLAUDE_actualizado_30-06-2026.md` (la ruta `.claude/` está protegida contra edición directa por el agente — hay que copiar el contenido manualmente) |
| `CONINS_Requisitos_Funcionales_v6.txt` | **Eliminado** — era copia idéntica (mismo MD5) de `CONINS_Requisitos_Funcionales_v6_1.txt`. Queda un solo archivo vigente. |

> Nota aparte: existe un tercer archivo `CONINS_Requisitos_Funcionales_v6.1.txt` (con punto, no guion bajo) en la raíz `D:\2_ConIns\` — fuera de la carpeta de documentación. No se tocó porque no estaba dentro del alcance pedido ("esa carpeta"), pero conviene revisarlo en otro momento para no terminar con un cuarto archivo suelto.

---

## 2. Qué se confirmó implementado (verificado en código, no solo en docs)

- `GET /api/catalogo/tipos-novedad-instructor` / `tipos-novedad-ambiente` / `tipos-novedad-ficha` — `catalogo.routes.ts`
- `PATCH /api/horarios/:id/aprobar` y `/:id/rechazar` (motivo obligatorio)
- `PATCH /api/horarios/:id/suspender` (RF-36, motivo obligatorio)
- `PUT /api/auth/usuarios/:id/programas` — asigna programas a un líder (RF-26)
- `POST /api/fichas` y `PATCH /api/fichas/:id` aceptan `lider_id`
- `PUT /api/auth/usuarios/:id` acepta `tipo_documento` y `documento`
- `GET /api/auth/usuarios` devuelve `rol` como texto
- RF-35 (mismo RAP no puede quedar en 2 instructores en la misma ficha) — `asignacion.service.ts`, HTTP 409
- Tabla `notificaciones` + `GET /api/notificaciones` + `PATCH /api/notificaciones/:id/leida`
- Rol "Líder de Programa" — ya existía en BD desde schema v4 (tabla `lider_programa`); lo nuevo es que Laura lo expuso en frontend
- `database.sql`: **25 tablas reales, `Schema: v5`** (no 27 / v5.2 como se documentaba — error de conteo, `lider_id` y `ultimo_acceso` son columnas, no tablas)

## 3. Gaps reales encontrados (P21–P25)

| # | Gap | Prioridad | Por qué importa |
|---|---|---|---|
| P22 | `GET /api/horarios`, `/fichas`, `/asignaciones`, `/alertas` no filtran por rol — solo exigen `verifyToken` | 🔴 Alta | Cualquier Instructor o Líder autenticado puede pedir el dataset completo del CDMC directo a la API. El frontend filtra visualmente, pero eso no es seguridad real |
| P21 | `ultimo_acceso` se guarda en login pero `GET /api/auth/usuarios` no lo devuelve | 🟡 Media | Fix de 2 líneas en `usuario.model.ts` |
| P23 | RF-37: `update()` de horario revalida RN-04/RN-09 pero no RN-03/RN-05, y no permite reasignar `instructor_id` | 🟡 Media | Falta confirmar si ese es el alcance esperado del RF |
| P24 | Laura pidió `GET /api/notificaciones/mis`; la ruta real es `GET /api/notificaciones` | 🟢 Baja | Solo hay que alinear el nombre |
| P25 | `database.sql` real (v5, 25 tablas) vs. documentación previa (v5.2, 27 tablas) | 🟢 Baja | Ya corregido en `CONINS_contexto_general.md` y `CHANGELOG.md`; falta alinear `CONINS_Logica_Negocio_v5.md` |

---

## 4. Mensaje para Laura

> Copia y pega lo de abajo (o adáptalo) para enviárselo directamente.

Hola Laura, ya revisé tu feedback completo (los 4 mensajes) y verifiqué todo directamente contra el código del backend, no solo contra la documentación. Esto es lo que encontré:

**Ya está listo y funcionando, puedes usarlo:**
- Los 3 endpoints de catálogo (`tipos-novedad-instructor`, `tipos-novedad-ambiente`, `tipos-novedad-ficha`)
- `PATCH /horarios/:id/aprobar`, `/rechazar` y `/suspender`
- `PUT /auth/usuarios/:id/programas` (asignar programas a líder)
- `POST` y `PATCH /fichas` ya aceptan `lider_id`
- `PUT /auth/usuarios/:id` ya acepta `tipo_documento` y `documento`
- `GET /auth/usuarios` ya devuelve `rol` como texto
- RF-35 (RAP único por ficha) está validado, te devuelve 409 si hay conflicto
- Notificaciones: la tabla existe y `GET /api/notificaciones` ya filtra por el usuario logueado (ojo: pediste `/notificaciones/mis`, pero el path real es `/notificaciones` sin el `/mis` — usa esa ruta, hace exactamente lo mismo)

**Importante — todavía no toques esto del lado del frontend:**
El backend **aún no filtra por rol** en los listados generales (`/horarios`, `/fichas`, `/asignaciones`, `/alertas`). O sea: hoy, si un Instructor pide esos endpoints, le llega el dataset completo del CDMC, no solo lo suyo. Tu filtro visual en frontend sigue siendo necesario — **no lo quites todavía**, porque mientras yo no implemente el filtrado real en backend, es la única protección que existe. Esto es justo lo que mencionaste en tu último resumen (instructor solo ve lo suyo, líder solo sus programas), lo tengo identificado como el pendiente más urgente.

**Pendiente de confirmar contigo:**
RF-37 (detectar conflictos al editar horarios) hoy solo recalcula las alertas duras (solapamiento, bloqueo de ambiente) al editar, pero no las alertas suaves (ambiente ocupado, jornada restringida) — esas solo se calculan al crear. ¿Eso es suficiente para lo que necesitas o esperabas que se revalidara todo al editar también?

**`ultimo_acceso`:** se está guardando en cada login pero todavía no lo devuelve `GET /auth/usuarios` — lo agrego en el próximo push, es un cambio chico.

Ya probé el `database.sql` — son 25 tablas con `Schema: v5` (el "27 tablas / v5.2" que decía la doc estaba mal contado, ya lo corregí). Listo para importar.

Gracias por las credenciales de prueba del Instructor — las voy a usar justo para validar el filtrado por rol cuando lo tenga implementado en backend.

---

---

## 5. Respuesta de Laura — cierre de pendientes (30/06/2026)

| Pendiente | Resolución |
|---|---|
| P22 — filtrado por rol | Frontend mantiene el filtro visual. Backend lo implementa en próximo push. |
| P23 — RF-37 alcance | **Confirmado: implementar revalidación completa al editar** (RN-03 + RN-04 + RN-05 + RN-09). Ejemplo de Laura: si un coordinador cambia la jornada de "Mañana" a "Noche" para un instructor de planta, la alerta RN-03 debe dispararse en ese momento, no solo al crear. |
| P24 — ruta notificaciones | ✅ Cerrado — Laura ajusta frontend para usar `GET /api/notificaciones`. |
| P25 — versión schema | ✅ Cerrado — Laura alinea su documentación. |
| P21 — ultimo_acceso | Pendiente, no bloqueante. Jair lo agrega en próximo push. |

**Próximos pasos de backend (por prioridad):**
1. 🔴 Implementar filtrado por rol en `GET /horarios`, `/fichas`, `/asignaciones`, `/alertas` (P22)
2. 🟡 Completar `horario.service.ts: update()` para revalidar RN-03 y RN-05 (P23 — alcance confirmado)
3. 🟡 Agregar `ultimo_acceso` al `SELECT` y mapeo en `usuario.model.ts` (P21 — 2 líneas)

---

## 6. Segunda respuesta de Laura — confirmación por pendiente (30/06/2026)

| Pendiente 