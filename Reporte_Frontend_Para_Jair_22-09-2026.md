# Reporte Frontend — Cambios Implementados
**Fecha:** 22 de septiembre de 2026  
**De:** Laura (Frontend)  
**Para:** Jair (Backend)

---

## Resumen

Jair, te cuento todo lo que se ha implementado en el frontend y lo que necesito de tu parte para un cambio adicional.

---

## 1. Formación Complementaria — Integración completa

### Lo que se hizo:

- **Modo dual en el wizard de asignaciones** (`CrearAsignacionModal`): ahora tiene un toggle "Formación regular" / "F. Complementaria" en la parte superior. El usuario puede crear ambos tipos desde el mismo lugar (página de Asignaciones).

- **Formulario complementaria en asignaciones**: incluye selección de instructor, programa (todos los programas disponibles, no solo los marcados como complementarios), modalidad (presencial/virtual), vigencia (fecha_inicio obligatorio + fecha_fin opcional), observaciones, horario (jornada + días + horas) y ambiente.

- **Modo complementaria en CrearHorarioModal** (página de Horarios): mismo toggle, mismos campos. Permite crear horarios complementarios directamente desde la grilla.

- **Payload que envía el frontend** al crear complementaria:
```json
{
  "es_complementaria": true,
  "instructor_id": 5,
  "programa_id": 1,
  "modalidad": "presencial",
  "observaciones": "Refuerzo de inglés",
  "fecha_inicio": "2026-09-22",
  "fecha_fin": "2026-12-15",
  "dia_semana": 1,
  "hora_inicio": "08:00",
  "hora_fin": "10:00",
  "jornada_id": 1,
  "ambiente_id": 3
}
```
- Se envía un request por cada día seleccionado (si selecciona Lun, Mie, Vie → 3 requests a `POST /api/horarios`).
- `fecha_fin` puede ser `null` (= una sola semana).
- **NO se envía `semana`** en complementaria, se usan `fecha_inicio` / `fecha_fin`.

### Visual en la grilla:

- Los bloques de complementaria en `GrillaHorarios` muestran:
  - Badge "Complementaria"
  - Nombre del programa
  - Modalidad
  - Rango de fechas (ej: "2026-09-22 → 2026-12-15")
  - Instructor y ambiente
- Todo en color verde SENA (mismo color que el resto de la app).

---

## 2. Fechas de Vigencia (`fecha_inicio` / `fecha_fin`)

Integré los campos de fecha que pediste en tu reporte de vigencia:

- `CrearAsignacionModal` → sección "Vigencia" con fecha_inicio (requerido) y fecha_fin (opcional)
- `CrearHorarioModal` → misma sección de vigencia
- `asignaciones.tsx` → handleCreate envía `fecha_inicio`/`fecha_fin` en el payload
- `horarios.tsx` → handleCreate envía `fecha_inicio`/`fecha_fin` en el payload
- `GrillaHorarios` → muestra el rango de fechas en bloques complementarios
- Tipo `Horario` actualizado con `fecha_inicio?: string` y `fecha_fin?: string | null`

---

## 3. Alertas Estructurales

La página de alertas (`alertas.tsx`) ya soporta los 3 tipos nuevos de tu script `alertas_estructurales.sql`:

| Tipo | Ícono | Color badge |
|------|-------|-------------|
| `CO_DOCENCIA` | Users (indigo) | Indigo |
| `RAP_COMPARTIDO` | AlertTriangle (rojo) | Rojo |
| `AMBIENTE_OCUPADO` | AlertTriangle (naranja) | Naranja |

- Cada tipo tiene su label legible, ícono, badge de color y filtro en el dropdown.
- La campanita del header ya muestra estos tipos también.

---

## 4. Otros cambios recientes

- **`api.rapSeguimiento`** agregado en `api.ts` — endpoints `getByFicha(fichaId)` y `evaluar(seguimientoId, estado)` para el componente `RapSeguimientoModal`.
- **Tipo de vinculación** del instructor (`contrato`/`planta`) integrado en la UI.
- **Filtro complementaria vs normal** en la página de horarios.
- **Todos los colores unificados** a verde SENA (ya no hay color diferente para complementaria).

---

## 5. SOLICITUD PARA EL BACKEND

### Soporte de `fecha_inicio` / `fecha_fin` en horarios REGULARES

Actualmente el backend solo acepta `fecha_inicio`/`fecha_fin` para horarios con `es_complementaria: true`. Para los regulares sigue usando `semana`.

**Necesito que el backend también acepte `fecha_inicio` y `fecha_fin` para horarios regulares** (donde `es_complementaria` es `false` o no se envía). La idea es que cualquier asignación tenga un rango de vigencia, no solo las complementarias.

El frontend ya tiene los campos listos (o los voy a agregar en cuanto confirmes). El payload sería igual que el de complementaria pero sin `es_complementaria`:

```json
{
  "instructor_id": 5,
  "ficha_id": 10,
  "competencia_id": 3,
  "rap_id": 7,
  "fecha_inicio": "2026-09-22",
  "fecha_fin": "2026-12-15",
  "dia_semana": 1,
  "hora_inicio": "08:00",
  "hora_fin": "10:00",
  "jornada_id": 1,
  "ambiente_id": 3
}
```

¿Puedes agregar ese soporte? Así dejamos de usar `semana` en ambos casos y todo queda unificado con rangos de fecha.

---

## Endpoints que usa el frontend actualmente

| Método | Ruta | Uso |
|--------|------|-----|
| `POST` | `/api/horarios` | Crear horario (regular o complementaria) |
| `GET` | `/api/horarios?semana=YYYY-MM-DD` | Listar horarios por semana |
| `GET` | `/api/alertas` | Listar todas las alertas |
| `PATCH` | `/api/alertas/:id/atender` | Marcar alerta como atendida |
| `GET` | `/api/rap-seguimiento/ficha/:fichaId` | RAPs por grupo |
| `PATCH` | `/api/rap-seguimiento/:id/evaluar` | Evaluar RAP |

---

Cualquier duda me avisas. Estoy lista para ajustar el frontend en cuanto tengas listo lo de las fechas en regulares.
