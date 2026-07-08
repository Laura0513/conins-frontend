# Cambios de Backend — Implementación Frontend
**Sesión:** 01-02/07/2026  
**Para:** Laura Posada (Frontend)  
**De:** Jair González (Backend)  
**Commit final:** `617bdfd` (rama `main`)

---

## 1. Cambio de roles — BREAKING CHANGE

Los strings de roles cambiaron. Cualquier comparación hardcodeada en el frontend debe actualizarse.

### Tabla de cambio

| ID | Antes (snake_case) | Ahora (Title Case) |
|----|---|---|
| 1 | `subdirector` | `Subdirector` |
| 2 | `coordinador_medular` | `Coordinadora Academica` |
| 3 | `coordinador_transversal` | `Asistente Coordinacion` |
| 4 | `lider_programa` | *(eliminado — ya no existe como rol)* |
| 4 | `instructor` | `Instructor` ← **cambió de ID 5 → 4** |

> El rol `lider_programa` desaparece del sistema. Usuarios que lo tenían quedan sin ese rol.

### Impacto en el frontend

El JWT payload ahora lleva los nuevos strings. El campo `roles: string[]` en `User` (AuthContext) recibirá los valores en Title Case.

**Buscar y reemplazar en todo el frontend:**

```
'subdirector'              →  'Subdirector'
'coordinador_medular'      →  'Coordinadora Academica'
'coordinador_transversal'  →  'Asistente Coordinacion'
'lider_programa'           →  eliminar cualquier lógica que lo use
'instructor'               →  'Instructor'
```

**Header.tsx línea 109** — ya muestra `user?.roles?.[0]` dinámicamente, no necesita cambio en la lógica, pero si hay algún fallback hardcodeado con el string anterior hay que actualizarlo.

**Tokens activos invalidos** — todos los usuarios deben hacer logout/login. El frontend no necesita cambio para esto, pero es útil saberlo para no confundir errores 401 con bugs.

---

## 2. Fichas — dos campos nuevos opcionales

### Campos añadidos al modelo

```typescript
fecha_inicio_productiva: string | null  // formato YYYY-MM-DD
fecha_fin_productiva:    string | null  // formato YYYY-MM-DD
```

### API — POST /fichas y PATCH /fichas/:id

Ahora aceptan (opcionales):

```json
{
  "fecha_inicio_productiva": "2026-07-14",
  "fecha_fin_productiva":    "2026-12-05"
}
```

### API — GET /fichas y GET /fichas/:id

La respuesta ya incluye ambos campos (pueden ser `null`).

### Qué implementar en el frontend

- **CrearFichaModal / EditFichaModal**: añadir dos campos de fecha opcionales. Sugerido: mostrarlos solo cuando `etapa === 'productiva'` o siempre con label claro.
- **DetailFichaModal**: mostrar las fechas si no son null.
- **Tipo sugerido para los forms**: `string` en formato `YYYY-MM-DD` (input type="date" devuelve ese formato directamente).

---

## 3. Horarios — campo nuevo `tipo_actividad_id`

### Campo añadido

```typescript
tipo_actividad_id: number | null   // referencia a tabla tipos_actividad
```

### API — POST /horarios

Acepta `tipo_actividad_id` opcional:

```json
{
  "ficha_id": 1,
  "instructor_id": 3,
  "competencia_id": 5,
  "dia_semana": 2,
  "hora_inicio": "07:00",
  "hora_fin": "10:00",
  "jornada_id": 1,
  "semana": "2026-07-06",
  "tipo_actividad_id": 2
}
```

### API — PATCH /horarios/:id

También acepta `tipo_actividad_id` en el body.

### API — GET /horarios y GET /horarios/:id

La respuesta ahora incluye:

```json
{
  "tipo_actividad": "Planeación"
}
```

(string con el nombre, o `null` si no tiene tipo asignado)

### Catálogo de tipos de actividad

Hay que consultar el endpoint (o puede entregarse como constante). Los 9 tipos disponibles son:

| ID | Nombre | ¿Cuenta para carga horaria? |
|----|--------|---|
| 1 | Formación | ✅ Sí |
| 2 | Planeación | ✅ Sí |
| 3 | Seguimiento | ✅ Sí |
| 4 | Evaluación | ✅ Sí |
| 5 | Reunión Institucional | ✅ Sí |
| 6 | Apoyo Complementario | ✅ Sí |
| 7 | Disponible | ❌ No (bloque libre) |
| 8 | Permiso / Incapacidad | ❌ No |
| 9 | Otro | ✅ Sí |

**Los bloques marcados como "Disponible" o "Permiso/Incapacidad" no suman a la carga horaria 20-40h.** El backend ya maneja esta lógica; el frontend solo necesita mostrar el selector.

### Qué implementar en el frontend

- **CrearHorarioModal / EditarHorarioModal**: añadir un `<select>` con los tipos de actividad (llamar al endpoint o usar la tabla hardcodeada arriba).
- Si el tipo es "Disponible", considerar mostrar indicador visual diferente en la vista de horarios (bloque no computa horas).

---

## 4. Permisos simplificados — sin cambio de API

La distinción entre `coordinador_medular` y `coordinador_transversal` fue eliminada. Ahora **Coordinadora Academica** y **Asistente Coordinacion** ven y gestionan exactamente lo mismo.

Si el frontend tenía lógica para mostrar/ocultar secciones diferenciando entre esos dos roles, se puede unificar. Ambos roles deben tener acceso idéntico a fichas, horarios y asignaciones.

---

## 5. Nuevo endpoint sugerido — GET /tipos-actividad

Para el selector del punto 3, se puede usar la tabla hardcodeada arriba **o** crear un endpoint `GET /tipos-actividad` (aún no implementado — confirmar con backend si es necesario o se usa la constante).

---

## Resumen de cambios de API

| Endpoint | Método | Campo nuevo |
|---|---|---|
| `/fichas` | POST | `fecha_inicio_productiva`, `fecha_fin_productiva` |
| `/fichas/:id` | PATCH | `fecha_inicio_productiva`, `fecha_fin_productiva` |
| `/fichas` | GET | respuesta incluye ambos campos |
| `/horarios` | POST | `tipo_actividad_id` |
| `/horarios/:id` | PATCH | `tipo_actividad_id` |
| `/horarios` | GET | respuesta incluye `tipo_actividad` (string) |

---

## Checklist de implementación

- [ ] Reemplazar strings de roles en todo el frontend (buscar los 5 strings de la tabla §1)
- [ ] CrearFichaModal: añadir campos `fecha_inicio_productiva` y `fecha_fin_productiva`
- [ ] EditFichaModal: ídem
- [ ] DetailFichaModal: mostrar fechas productivas si no son null
- [ ] CrearHorarioModal: añadir selector `tipo_actividad_id`
- [ ] EditarHorarioModal: ídem
- [ ] Vista de horarios: indicador visual para bloques "Disponible" / "Permiso"
- [ ] Logout forzado o mensaje a usuarios con sesión activa (tokens inválidos)
