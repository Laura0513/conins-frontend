# CONINS - Contexto del Proyecto para Continuar Desarrollo

## Fecha de corte: 10/06/2026

---

## 1. DESCRIPCIÓN DEL PROYECTO

**CONINS** (Control de Instructores SENA CDMC) es un sistema de gestión académica para el centro CDMC del SENA. Permite administrar instructores, ambientes, fichas de formación, asignaciones, horarios, alertas y reportes.

**Arquitectura:**
- **Frontend:** Next.js 16.2.4 + React 19 + Tailwind CSS 4 + TypeScript
- **Backend:** Node.js + Express + TypeScript + MySQL
- **Repositorio Frontend:** https://github.com/Soywaz/conins (rama `dev/laura`)
- **Repositorio Backend de Jair:** https://github.com/DarkerJB/ConIns_Project (rama `main`)

---

## 2. ESTADO ACTUAL DEL FRONTEND

### Módulos Completados (100% funcionales):
1. ✅ **Auth** - Login, protección de rutas, creación de contraseña
2. ✅ **Instructores** - CRUD completo, novedades, competencias, detalle
3. ✅ **Ambientes** - CRUD, bloqueos, agenda, tipos (aula/taller/laboratorio)
4. ✅ **Fichas** - CRUD, finalización, conexión con programas/competencias
5. ✅ **Asignaciones** - CRUD, provisionales, edición, pestañas (activas/provisionales/históricas)
6. ✅ **Horarios** - CRUD, edición por bloques de días, validación de cruces
7. ✅ **Alertas** - Listado, dropdown en header, badge persistente, marcar atendida
8. ✅ **Reportes** - 3 pestañas: Carga Horaria, Horario por Ficha, Ocupación de Ambientes
9. ✅ **Usuarios** - CRUD de cuentas de acceso, roles, activar/desactivar

### Mejoras de UI/UX Aplicadas:
- ✅ **Responsive completo** - Menú hamburguesa, filtros en 2 columnas, tablas adaptadas
- ✅ **Sidebar blanco** con acentos verdes (antes era verde completo)
- ✅ **Header blanco** con línea verde inferior (`border-b-2 border-sena`)
- ✅ **Footer blanco** con línea verde superior, fijo al final del contenido
- ✅ **Logo oficial del SENA** en sidebar y login
- ✅ **Nombres actualizados:** "Dashboard" → "Inicio", "Consultas" → "Reportes"
- ✅ **Badge de alertas** persistente (no reaparece al cambiar de página)
- ✅ **Manejo robusto de errores** en `api.ts` (no rompe la app si el backend falla)

---

## 3. TAREAS EN PROGRESO (Al momento de cortar este chat)

### A. Integración con Backend v5.1 de Jair (URGENTE)
Jair actualizó su backend a la versión 5.1 con 25 tablas y 47 RF. Hay cambios breaking que afectan el frontend:

**1. Modal de Novedades de Instructores - CAMBIO BREAKING**
- **Antes:** Enviaba `tipo: string` (texto libre: "licencia", "incapacidad")
- **Ahora:** Debe enviar `tipo_novedad_id: number` (ID del catálogo)
- **Estado:** ✅ YA SE AJUSTÓ el `NovedadModal.tsx` y `api.ts` para usar dropdown dinámico
- **Endpoint necesario:** `GET /api/catalogo/tipos-novedad-instructor` (Jair debe implementarlo)

**2. Módulo de Usuarios - NUEVOS CAMPOS**
- La tabla `usuarios` ahora tiene `tipo_documento` (ENUM: cc, ce, ti, pasaporte) y `documento` (VARCHAR UNIQUE)
- **Estado:** ✅ YA SE AJUSTARON los modales `CrearUsuarioModal.tsx` y `EditarUsuarioModal.tsx`
- **Endpoints afectados:** `PUT /api/auth/usuarios/:id` y `GET /api/auth/usuarios`

**3. Página de Novedades de Fichas (RF-47) - PENDIENTE**
- Nueva funcionalidad para registrar novedades administrativas de fichas (comités, paros, actividades fuera)
- **Estado:** ❌ NO SE HA EMPEZADO
- **Requiere:** Nueva página `/ficha-novedades`, modal de creación, endpoint `GET /api/catalogo/tipos-novedad-ficha`

**4. Modal de Bloqueo de Ambientes - PENDIENTE**
- Similar al cambio de novedades de instructores, debe usar dropdown con `tipo_novedad_id`
- **Estado:** ❌ NO SE HA AJUSTADO
- **Endpoint necesario:** `GET /api/catalogo/tipos-novedad-ambiente`

### B. Flujo de Aprobación de Horarios (Coordinador)
- Se implementó en frontend: estados "Pendiente", "Aprobado", "Rechazado"
- Botones de Aprobar (check verde) y Rechazar (X roja) cuando está pendiente
- **Estado:** ✅ FRONTEND LISTO
- **Backend pendiente:** Jair debe implementar `PATCH /api/horarios/:id/aprobar` y `PATCH /api/horarios/:id/rechazar`

---

## 4. LO QUE NECESITAMOS DE JAIR (BACKEND)

### Endpoints Pendientes de Implementar:
1. `GET /api/catalogo/tipos-novedad-instructor` → Array de tipos de novedad para instructores
2. `GET /api/catalogo/tipos-novedad-ambiente` → Array de tipos de novedad para ambientes
3. `GET /api/catalogo/tipos-novedad-ficha` → Array de tipos de novedad para fichas
4. `PATCH /api/horarios/:id/aprobar` → Aprueba horario pendiente
5. `PATCH /api/horarios/:id/rechazar` → Rechaza horario con motivo

### Ajustes en Endpoints Existentes:
6. `GET /api/auth/usuarios` → Debe devolver campo `rol` como TEXTO (ej: "Coordinador"), no solo ID
7. `GET /api/auth/usuarios` → Debe incluir campo `ultimo_acceso` (fecha del último login)
8. `PUT /api/auth/usuarios/:id` → Debe aceptar `tipo_documento` y `documento` en el body

### Base de Datos:
9. Importar `database.sql` v5.1 (25 tablas) en phpMyAdmin para tener el schema actualizado

---

## 5. ARCHIVOS CLAVE DEL PROYECTO

### Estructura del Frontend:
```
conins-frontend/
├── src/
│   ├── pages/
│   │   ├── auth.tsx                    # Login y crear contraseña
│   │   ├── index.tsx                   # Dashboard/Inicio
│   │   ├── instructores.tsx            # CRUD Instructores
│   │   ├── ambientes.tsx               # CRUD Ambientes
│   │   ├── fichas.tsx                  # CRUD Fichas
│   │   ├── asignaciones.tsx            # CRUD Asignaciones
│   │   ├── horarios.tsx                # CRUD Horarios + Aprobación
│   │   ├── alertas.tsx                 # Gestión de Alertas
│   │   ├── consultas.tsx               # Reportes (Carga, Horarios, Ocupación)
│   │   └── usuarios.tsx                # Gestión de Usuarios
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx             # Menú lateral responsive
│   │   │   ├── Header.tsx              # Barra superior con notificaciones
│   │   │   └── Footer.tsx              # Pie de página
│   │   ├── instructores/               # Modales de instructores
│   │   ├── ambientes/                  # Modales de ambientes
│   │   ├── fichas/                     # Modales de fichas
│   │   ├── asignaciones/               # Modales de asignaciones
│   │   ├── horarios/                   # Modales de horarios
│   │   ├── usuarios/                   # Modales de usuarios
│   │   └── ui/                         # Componentes reutilizables
│   ├── layouts/
│   │   └── DashboardLayout.tsx         # Layout principal con sidebar
│   └── lib/
│       ├── api.ts                      # Cliente API con todos los endpoints
│       ├── AuthContext.tsx             # Contexto de autenticación
│       ├── ToastContext.tsx            # Sistema de notificaciones
│       └── useProtectedRoute.ts        # Hook de protección de rutas
```

### Archivos Recién Modificados (NO SUBIDOS AÚN):
- `conins-frontend/src/lib/api.ts` → Agregado `getTiposNovedadInstructor()`
- `conins-frontend/src/components/instructores/NovedadModal.tsx` → Cambiado a dropdown dinámico con `tipo_novedad_id`
- `conins-frontend/src/pages/instructores.tsx` → Actualizado `handleNovedadSubmit` para usar nuevo formato
- `conins-frontend/src/components/usuarios/CrearUsuarioModal.tsx` → Agregados campos `tipo_documento` y `documento`
- `conins-frontend/src/components/usuarios/EditarUsuarioModal.tsx` → Agregados campos `tipo_documento` y `documento`

---

## 6. CONVENCIONES Y DECISIONES TÉCNICAS

### Estilo de Código:
- TypeScript estricto
- Tailwind CSS para estilos (clases utilitarias)
- Componentes funcionales con hooks
- Modales extraídos en archivos separados
- API client centralizado en `lib/api.ts`

### Patrones de Diseño:
- Soft delete: `activo = false` (nunca DELETE físico)
- Formato de respuesta backend: `{ success, message, data, alertas? }`
- Manejo de errores: Try/catch con toasts, fallback a mocks si backend falla
- IDs de días: 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
- IDs de jornadas: 1=Mañana, 2=Mixta, 3=Noche, 4=Virtual

### Responsive:
- Sidebar: Oculto en móvil, hamburguesa en header
- Filtros: Grid de 2 columnas en móvil, flex en desktop
- Tablas: `overflow-x-auto` con padding reducido en móvil (`px-3 py-3 md:px-6 md:py-4`)
- Modales: `w-full max-w-md` con padding adaptativo (`p-4 md:p-6`)

---

## 7. PRÓXIMOS PASOS RECOMENDADOS

### Prioridad Alta (Bloquean funcionalidad):
1. **Subir cambios pendientes al repo** (NovedadModal, Usuarios, api.ts)
2. **Pedirle a Jair los 3 endpoints de catálogo** (tipos-novedad-*)
3. **Ajustar Modal de Bloqueo de Ambientes** (cambiar a dropdown como Novedades)

### Prioridad Media:
4. **Crear Página de Novedades de Fichas** (RF-47)
5. **Implementar flujo de aprobación de horarios en backend** (Jair)
6. **Importar database.sql v5.1** en phpMyAdmin

### Prioridad Baja:
7. Agregar botón "Exportar a Excel" en Reportes
8. Página de "Mi Perfil" (opcional, se removió anteriormente)

---

## 8. MENSAJE PARA JAIR (PARA ENVIAR)

"Hola Jair, te paso el resumen de lo que necesitamos para sincronizar frontend con tu backend v5.1:

**Cambios que ya hicimos en frontend:**
1. Modal de Novedades de Instructores → Ahora usa `tipo_novedad_id` (dropdown) en vez de texto libre
2. Modales de Usuarios → Agregamos campos `tipo_documento` (select) y `documento` (input)

**Endpoints que necesitamos que implementes:**
1. `GET /api/catalogo/tipos-novedad-instructor` → Para llenar el dropdown de novedades
2. `GET /api/catalogo/tipos-novedad-ambiente` → Para el modal de bloqueos de ambientes
3. `GET /api/catalogo/tipos-novedad-ficha` → Para la nueva página de novedades de fichas
4. `PATCH /api/horarios/:id/aprobar` → Aprueba horario pendiente
5. `PATCH /api/horarios/:id/rechazar` → Rechaza horario con motivo

**Ajustes en endpoints existentes:**
6. `GET /api/auth/usuarios` → Debe devolver `rol` como TEXTO (ej: "Coordinador") y campo `ultimo_acceso`
7. `PUT /api/auth/usuarios/:id` → Debe aceptar `tipo_documento` y `documento`

**Base de datos:**
8. Confirma que el `database.sql` v5.1 está listo para importar (25 tablas)

Quedo atento para probar la conexión apenas tengas esos endpoints. ¡Gracias!"

---

## 9. NOTAS ADICIONALES

- El proyecto está en la rama `dev/laura` del repo `Soywaz/conins`
- Jair tiene su backend en `DarkerJB/ConIns_Project` (rama `main`)
- Se dejó de subir al repo al final del día por instrucción de Laura
- El chat anterior se volvió pesado/lento, por eso se crea este archivo de contexto
- Laura prefiere subir todo al repo al final del día, no commit por commit
- El footer debe ser blanco con línea verde superior (ya aplicado)
- El header debe ser blanco con línea verde inferior (ya aplicado)
