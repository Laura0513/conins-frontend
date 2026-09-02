# Actualización Frontend — 01/09/2026 (sesión 2)

**De:** Laura · **Para:** Jair

---

## Lo que quedó listo

### 1. Modal simplificado de RAPs ✅
- Reescribí `RapSeguimientoModal.tsx` completo: ya no tiene formulario de registro manual.
- Solo muestra los RAPs agrupados por competencia con barra de progreso, botones Aprobar / No aprobar individuales, y **"Aprobar todos (N)"** por competencia.
- Estado vacío dice: "Los seguimientos se crean automáticamente al asignar competencias."
- El botón de evaluación RAPs (icono morado) está en la tabla de grupos, tanto para admin como para roles de solo lectura.

### 2. Botón Descargar Excel en Reportes ✅
- En la página de consultas ahora hay dos botones: **Excel** (borde verde) y **PDF**.
- El botón Excel llama a `api.consultas.descargarExcel(reporte)` que hace fetch al endpoint `GET /api/consultas/excel?reporte=carga|horarios|ocupacion` y dispara la descarga del `.xlsx`.

### 3. Helpers agregados en api.ts ✅
Ya que tus cambios en `lib/api.ts` no llegaron en el pull (otra vez no estaban committeados), los agregué yo:

- `api.rapSeguimiento.evaluarTodos(acId, estado_aprobacion)` → `PATCH /api/rap-seguimiento/asignacion-competencia/:acId/evaluar-todos`
- `api.consultas.descargarExcel(reporte, semana?)` → `GET /api/consultas/excel?reporte=...&semana=...` (manejo de blob + descarga automática)

**Importante:** por favor verifica que estos helpers coincidan con tus endpoints. Si cambió algo en el contrato, avísame.

---

## Pendiente de mi lado
- Correr el SQL de backfill que mandaste (para poblar seguimientos de asignaciones existentes)
- Commit y push

## Pendiente de tu lado
- **Commitear y pushear** los cambios que reportaste (evaluar-todos, excel, calendario, auto-creación de seguimientos). Otra vez no llegaron en el clone. Por favor verifica con `git status` antes de decir que están.

---

Avísame cuando hayas pusheado para hacer pull y probar la integración completa.
