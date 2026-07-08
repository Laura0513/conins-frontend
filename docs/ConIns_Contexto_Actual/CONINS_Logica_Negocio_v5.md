# CONINS — Lógica de Negocio
## Centro del Diseño y Manufactura del Cuero · CDMC SENA
**Versión:** 5.2 · **Fecha:** 06 de Julio 2026
**Basado en:** RF v7.0 · sesiones 23/04 al 06/07/2026

---

## 1. Objetivo del sistema

CONINS es un sistema de **control de malla de horarios** del CDMC. Su pregunta central es:

> **¿Qué instructor cubre qué competencia, en qué ficha, en qué ambiente y en qué jornada?**

No es un sistema curricular, no es un gestor de infraestructura, no reemplaza a Sofía Plus.

**Lo que CONINS NO gestiona:**

| Dato | Quién lo gestiona |
|---|---|
| Notas y juicios evaluativos | Sofía Plus |
| Creación/edición de programas de formación | Datos oficiales SENA (seed, sin CRUD) |
| Competencias y RAPs como catálogo | Sofía Plus → seed, sin CRUD |
| Ambientes como infraestructura | Datos fijos (seed, sin CRUD) |
| Jornadas | Datos fijos e institucionales (seed, sin CRUD) |
| Estado del curso (EN EJECUCIÓN, TERMINADA) | Sofía Plus |

---

## 2. Datos precargados — sin CRUD en la UI

| Dato | Razón |
|---|---|
| Programas de formación | Definidos institucionalmente por el SENA |
| Competencias y RAPs | Datos normativos de Sofía Plus |
| Ambientes | Aulas 200–208 y talleres T1–T4 — fijos |
| Jornadas | Mañana, mixta, noche y virtual — fijas |
| Usuarios del arranque | El CDMC ya tiene correos y roles de todo el personal activo |

---

## 3. Acceso al sistema — onboarding de dos pasos

**Paso 1 (RF-13) — El administrador habilita la cuenta:**
Registra al usuario con correo, nombre y rol. La cuenta queda sin contraseña — el usuario aún no puede entrar.

**Paso 2 (RF-01 / RF-08) — El usuario crea su contraseña:**
Va a `/auth` → tab "Crear contraseña" → ingresa su correo. Si existe en BD → guarda contraseña → puede hacer login. Si no → alerta amarilla + HTTP 403.

**Paso 3 en adelante:** login normal con correo + contraseña.

### Pantalla pública `/auth`

```
Tab "Iniciar sesión"              Tab "Crear contraseña"
──────────────────────            ──────────────────────────────────
Campo: correo                     Campo: correo
Campo: contraseña (toggle)        Campo: contraseña nueva (toggle)
Botón: Iniciar sesión             Campo: confirmar contraseña (toggle)
Link: ¿Olvidaste contraseña?      Botón: Crear contraseña
                                  Alerta amarilla si correo no en BD
```

Sin selector de rol · sin campo nombre · sin registro con redes sociales.

### Estrategia de arranque

1. El seed carga todos los usuarios actuales del CDMC con correo, nombre y rol — sin contraseña.
2. El admin inicial (Subdirector) entra con contraseña definida en el seed.
3. RF-13 (crear usuarios desde dashboard) aplica para nuevos ingresos futuros.

**Campo de login:** correo electrónico registrado en BD. Puede ser `@sena.edu.co` o correo personal — sin restricción de dominio.

---

## 4. Roles del sistema — tabla `roles` (4 entradas — vigente al 01/07/2026)

> **Cambio 01/07/2026 (feedback coordinadora):** convención snake_case → Title Case. Sistema pasa de 5 a 4 roles. `lider_programa` deja de ser rol funcional (tabla permanece como dato informacional). La distinción medular/transversal fue eliminada.

| ID | Nombre técnico | Nivel | Descripción | Alcance |
|---|---|---|---|---|
| 1 | `Subdirector` | 1 | Consulta y reportes | CDMC completo |
| 2 | `Coordinadora Academica` | 2 | Administrador — todos los permisos | CDMC completo |
| 3 | `Asistente Coordinacion` | 3 | Mismos permisos que Coordinadora | CDMC completo |
| 4 | `Instructor` | 4 | Solo lectura de sus asignaciones | Sus fichas activas |

> `lider_ficha` NO es un rol. Es `es_lider_ficha BOOLEAN DEFAULT FALSE` en `asignacion`.
> `lider_programa` (tabla) permanece como dato informacional del líder de ficha ADSO — sin permisos.
> Soporte multi-rol vía tabla `usuario_roles` (N:M).

---

## 5. Reglas de negocio

### RN-01 · Onboarding obligatorio
```
Paso 1: admin crea cuenta (correo + nombre + rol) → sin contraseña
Paso 2: usuario crea contraseña desde /auth
Sin Paso 1 → HTTP 403 con mensaje descriptivo
```

### RN-02 · Correo como identificador único
```
Campo de login para todos los roles.
Puede ser @sena.edu.co o personal — sin restricción de dominio.
No se puede cambiar sin intervención del administrador.
```

### RN-03 · Jornada restringida para instructores de planta
```
Si instructor.tipo_contrato = 'de_planta'
Y (jornada = 'noche' O dia IN ('sábado', 'domingo'))
→ Alerta JORNADA_RESTRINGIDA (no bloquear)
```

### RN-04 · Conflicto de instructor — hard block
```
Si EXISTS(horario con instructor_id = ? Y bloque superpuesto)
→ Bloquear, HTTP 409 con error descriptivo
```

### RN-05 · Conflicto de ambiente — soft alert
```
Si EXISTS(horario con ambiente_id = ? Y jornada_id = ? Y fecha = ?)
→ Permitir pero emitir alerta AMBIENTE_OCUPADO
(Talleres: pueden albergar varias fichas simultáneamente)
```

### RN-06 · Unicidad de RAP por ficha
```
UNIQUE(ficha_id, rap_id) en asignacion_raps
Si viola → HTTP 409
Un RAP no puede tener dos instructores distintos en la misma ficha.
Sí puede repetirse en fichas diferentes del mismo programa.
RAPs heredados al asignar la competencia — no se asignan individualmente.
```

### RN-07 · Límite de horas semanales
```
Si SUM(horas_semana) < 20 O > 40
→ Alerta CARGA_HORARIA (no bloquear)
Rango 20–40h confirmado para todos los instructores
```

### RN-08 · Novedad administrativa del instructor (RF-16)
```
Si EXISTS(instructor_novedades con instructor_id = ?
  Y fecha_inicio <= HOY Y fecha_regreso >= HOY Y activo = TRUE)
→ Excluir instructor de asignaciones
→ Reincorporar automáticamente al vencer fecha_regreso
activo del instructor permanece TRUE — la cuenta sigue activa.
```

### RN-09 · Bloqueo temporal de ambiente (RF-31)
```
Si EXISTS(ambiente_bloqueos con ambiente_id = ?
  Y fecha_inicio <= HOY Y fecha_fin >= HOY Y activo = TRUE)
→ Excluir ambiente de asignaciones (RF-28 valida esto)
→ Reincorporar automáticamente al vencer fecha_fin
```

### RN-10 · Soft delete universal
```
Ningún registro se elimina físicamente.
activo BOOLEAN NOT NULL DEFAULT TRUE en todas las tablas.
Todas las queries de listado filtran WHERE activo = TRUE.
```

### RN-11 · Asignación provisional (RF-29)
```
Solo la registra un administrador.
Campos obligatorios: instructor_id, ficha_id o programa_id,
autorizante (autorizado_por_id), fecha_autorizacion, motivo.
Sin alguno → el sistema no registra la provisional.
```

### RN-12 · Alcance de coordinacion
```
Toda asignacion es realizada por Coordinadora Academica o Asistente de Coordinacion.
lider_programa es dato informativo — no otorga permisos ni modifica el flujo.
permisoService.validarAlcanceCoordinador() activo para escritura restringida.
```

### RN-13 · Competencia habilitada por contrato (RF-27)
```
Solo puede asignarse a competencias en instructor_competencias_habilitadas.
El sistema filtra y muestra solo las disponibles para ese instructor.
```

### RN-14 · Fichas virtuales
```
Si ficha.modalidad = 'virtual'
→ No se asigna ni valida ambiente físico
Lógica derivada de modalidad, no de jornada.
```

### RN-15 · Fichas HUI FORMACION (LMS)
```
Cursos autogestionados sin instructor presencial.
Entran al seed sin asignación.
El administrador puede asignar un líder administrativo si el CDMC lo decide.
No requieren horario ni ambiente.
```

### RN-16 · Cambio de instructor en competencia activa
```
Nuevo instructor → asignacion_competencia actualizada.
Anterior → instructor_anterior_id con fecha_cambio.
RAPs ya evaluados permanecen en Sofía Plus.
```

### RN-17 · Nomenclatura configurable
```
"Ficha" → próximamente "grupo".
No hardcodear en frontend. Usar constante configurable.
```

---

## 6. Reglas de arquitectura

| Regla | Descripción |
|---|---|
| **Controller → solo HTTP** | `req/res`. Cero lógica de negocio. |
| **Service → lógica de negocio** | Validaciones, cálculos, reglas de negocio. |
| **DB → solo queries** | Sin lógica de negocio. |
| **Horas en backend** | `horarioService` calcula carga horaria. El frontend nunca calcula horas. |
| **Validaciones en backend** | El frontend nunca valida unicidad de RAP, roles ni reglas de negocio. |
| **JWT en header** | `Authorization: Bearer <token>`. Sin token → HTTP 401. |
| **Dos capas de autorización** | `requireRole([])` para roles globales + `permisoService` para acceso contextual. |
| **Errores descriptivos** | Los mensajes del backend se muestran en UI sin modificación. |
| **HTTP client: Fetch** | El frontend usa Fetch nativo. No Axios. |

---

## 7. Stack tecnológico (objetivo Fase 3)

| Capa | Tecnología |
|---|---|
| Frontend | **Next.js 15** (Pages Router) · React 19 · TypeScript · Tailwind CSS 4 · Lucide React |
| HTTP client | Fetch nativo |
| Backend | Node.js · Express 5 · TypeScript · MVC · ESM6 |
| Auth | JWT + bcrypt |
| Correo | Nodemailer |
| Base de datos | MySQL — `conIns` · phpMyAdmin · Laragon |
| IDE / VCS | VS Code · Git + GitHub |


---

## 8. Modelo de datos — schema v5.3 (27 tablas — actualizado 01/07/2026)

> Nota de actualización: este documento describe la versión funcional original del modelo (v4, 20 tablas). El schema evolucionó hasta 27 tablas al 01/07/2026. Adiciones principales: `tipos_novedad_instructor`, `tipos_novedad_ambiente`, `tipos_novedad_ficha`, `ficha_novedades`, `auditoria` (schema v5 — 25 tablas); `tipos_actividad` y `rap_ficha_seguimiento` (schema v5.3 — 27 tablas, 01/07/2026). Columnas nuevas en tablas existentes: `lider_id`/`fecha_inicio_productiva`/`fecha_fin_productiva` en `fichas`; `tipo_actividad_id` en `horarios`; `ultimo_acceso`/`tipo_documento`/`documento` en `usuarios`. Ver `CHANGELOG.md` y `CONINS_contexto_general.md` §11 para el modelo vigente completo.

```
instructor
  └── asignacion  (instructor_id, ficha_id, es_lider_ficha, es_provisional)
        └── asignacion_competencia  (asignacion_id, competencia_id, ambiente_excepcion_id)
              └── competencia
                    └── raps  ← heredados automáticamente
```

**Catálogos base (seed):**
```sql
roles, programas, competencias, raps, ambientes, jornadas, fichas
-- programas.tipo_formacion ENUM('titulada','complementaria','operario')
-- fichas.etapa ENUM('lectiva','productiva')  ← confirmado 04/05/2026
```

**Usuarios y roles:**
```sql
usuarios, usuario_roles, instructores, lider_programa,
instructor_competencias_habilitadas
```

**Novedades y bloqueos:**
```sql
instructor_novedades (id, instructor_id, tipo_novedad_id FK, fecha_inicio,
                      fecha_regreso, observacion, activo)
ambiente_bloqueos    (id, ambiente_id, fecha_inicio, fecha_fin, motivo, activo)
```

**Asignaciones:**
```sql
asignacion (id, instructor_id, ficha_id,
            es_lider_ficha BOOLEAN DEFAULT FALSE,
            es_provisional BOOLEAN DEFAULT FALSE,
            autorizado_por_id, fecha_autorizacion, motivo_provisional, activo)

asignacion_competencia (id, asignacion_id, competencia_id,
                        instructor_anterior_id, fecha_cambio,
                        ambiente_excepcion_id, observacion, activo)
```

**Horarios, alertas y notificaciones:**
```sql
horarios       (instructor_id, ficha_id, competencia_id, ambiente_id,
                 jornada_id, fecha, hora_inicio, hora_fin,
                 estado, motivo_rechazo, motivo_suspension, activo)
alertas        (instructor_id, tipo, mensaje, leida, generada_en)
notificaciones (usuario_id, tipo, mensaje, leida, generada_en)
```

---

## 9. Resumen de RF v7.0 — 49 RF en 9 modulos (vigente al 06/07/2026)

| Modulo | Rango | Total | Notas |
|---|---|---|---|
| AUTH | RF-01 al RF-13, RF-46 | 14 | Roles actualizados |
| Instructores | RF-14 al RF-16 | 3 | Sin cambios |
| Fichas | RF-17 al RF-20, RF-47 | 5 | RF-17 sin lider en firma |
| Horarios | RF-21 al RF-24 | 4 | Sin cambios |
| Asignaciones | RF-25 al RF-29 | 5 | RF-30 eliminado |
| Ambientes | RF-31 | 1 | Sin cambios |
| Alertas, Validaciones y Notificaciones | RF-32 al RF-40 | 9 | RF-39 reescrito, RF-40 ajustado |
| Consulta y Visualizacion | RF-41, RF-42, RF-44, RF-45 | 4 | RF-43 eliminado |
| Seguridad y Trazabilidad | RF-48 al RF-51 | 4 | Nuevos en v7.0 |
| **Total** | | **49** | RF v7.0 — 06/07/2026 |

---

## 10. Pendientes activos

| # | Pendiente | Responsable | Prioridad |
|---|---|---|---|
| P4 | Lista oficial de instructores con correo estandarizado | CDMC → Jair | 🟡 Media |
| P10 | Revisar Resolución 1415/2012 y Acuerdo 0003/2017 | Jair | 🟢 Baja |
| P11 | Definir gestión de estado en Next.js 15 (¿Zustand o nativo?) | Jair + Laura | 🟡 Media — Fase 3 |

---

## 11. Historial de versiones

| Versión | Fecha | Cambios principales |
|---|---|---|
| v1 | Abril 2026 | Modelo inicial |
| v2 | Abril 2026 | Reestructuración — dos coordinadores, `asignacion → asignacion_competencia` |
| v3 | 23/04/2026 | Bloqueadores B1–B8 resueltos |
| v4 / v4.1 | 28/04/2026 | Flujo `/auth`, `lider_ficha` eliminado de roles, RF v6 |
| v5.0 | 28/04/2026 | Consolidación lineal — RN-08, RN-09, schema 19 tablas |
| **v5.2** | **06/07/2026** | **RF v7.0: lider_programa pasa a figura informativa. RF-30 y RF-43 eliminados. RF-39 reescrito. RF-48 a RF-51 agregados. RN-12 marcada obsoleta. Pendientes P8/P9 fuera de alcance.** |
| v5.1 | 06/05/2026 | **Stack actualizado: Vite → Next.js 15 (Pages Router). Lucide React confirmado. P11 creado. P1–P3, P5–P6 marcados como resueltos. Schema v4 cerrado con 20 tablas.** |

| **v5.2** | **11/06/2026** | **Correcciones de consistencia: horarios (estado, motivo_rechazo, motivo_suspension), P7 marcado resuelto. Conteos 