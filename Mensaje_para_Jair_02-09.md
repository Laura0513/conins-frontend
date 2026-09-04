# Endpoints faltantes — 02/09/2026

**De:** Laura · **Para:** Jair

---

Jair, ya integré todo lo que me mandaste en el frontend pero hay endpoints que mencionaste en tu reporte que no están en el código del backend:

### No están en las rutas:

1. **`GET /api/catalogo/enlaces`** — no está en `catalogo.routes.ts`. Dijiste que lo agregaste para los enlaces externos (Sofia Plus, SENA, Zajuna).

2. **`GET /api/consultas/rap-avance`** y **`GET /api/consultas/rap-avance/:fichaId`** — no están en `consulta.routes.ts`. Los necesito para mostrar el avance de RAPs por grupo en el dashboard.

3. **`GET /api/importar/historico`** — no está en `importar.routes.ts`. Lo necesito para la tabla de histórico de importaciones.

### Sí están y funcionan:
- `GET /api/consultas/excel` 
- `GET /api/consultas/calendario`
- `GET /api/consultas/correcciones`
- `PATCH /api/rap-seguimiento/asignacion-competencia/:acId/evaluar-todos`

Por favor verifica con `git status` que todo esté committeado antes de decirme que está listo. Del lado frontend ya está todo conectado, solo falta que el backend responda.
