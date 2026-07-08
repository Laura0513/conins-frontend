# CONINS — Guía de configuración de variables de entorno
**Para:** Laura Sofía Posada (Frontend)
**De:** Jair González (Backend)
**Fecha:** 06/07/2026

---

## 1. Backend — crear tu `.env`

En la carpeta `backend/` existe el archivo `backend/.env.example`.
Cópialo con el nombre `.env` y completa los valores:

```bash
cp backend/.env.example backend/.env
```

Los valores que debes ajustar para tu entorno local son:

| Variable | Valor por defecto | Qué poner |
|---|---|---|
| `PORT` | `5000` | Dejar igual |
| `DB_HOST` | `localhost` | Dejar igual |
| `DB_PORT` | `3306` | Dejar igual |
| `DB_USER` | `root` | Tu usuario de MySQL en Laragon |
| `DB_PASSWORD` | *(vacío)* | Tu contraseña de MySQL (normalmente vacía en Laragon) |
| `DB_NAME` | `conIns` | Dejar igual — es el nombre de la BD |
| `JWT_SECRET` | `cambia-esto-en-produccion` | Puedes usar cualquier cadena larga en local |
| `JWT_EXPIRES_IN` | `24h` | Dejar igual |
| `FRONTEND_URL` | `http://localhost:3000` | Dejar igual |
| `SMTP_*` | *(vacío)* | Dejar vacío — el sistema funciona sin correo |
| `SUPER_USER` | `admin@conins.sena` | Dejar igual |
| `SUPER_USER_PASSWORD` | *(pedir a Jair en privado)* | Credencial de admin — no va en este archivo |

> El archivo `.env` real NUNCA se commitea. El `.env.example` (sin credenciales) sí está en el repo como referencia.

---

## 2. Frontend — crear tu `.env.local`

En la carpeta `frontend/` crea el archivo `.env.local` con este contenido:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

> En Next.js, `.env.local` es el archivo de variables locales del desarrollador. Nunca se commitea. El `.env.example` del frontend (que sí está en el repo) ya tiene este valor de referencia.

---

## 3. Credenciales de prueba (entorno local)

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin@conins.sena` | *(pedir a Jair)* | Subdirector (super usuario) |
| `ljaramilloo@sena.edu.co` | *(activar via /auth → "Crear contraseña")* | Asistente Coordinacion |
| `instructor.prueba@sena.edu.co` | *(activar via /auth → "Crear contraseña")* | Instructor |

> Para activar una cuenta nueva: ir a `/auth`, pestaña "Crear contraseña", ingresar el correo y definir una contraseña.

---

## 4. Cambio importante — roles (01/07/2026)

Los strings de roles cambiaron. Si tienes tokens JWT anteriores al 01/07/2026 guardados en `localStorage`, **debes cerrar sesión y volver a iniciarla**.

Los nuevos roles del sistema son:

| ID | Nombre exacto en el sistema |
|---|---|
| 1 | `Subdirector` |
| 2 | `Coordinadora Academica` |
| 3 | `Asistente Coordinacion` |
| 4 | `Instructor` |

Si en el frontend compares `user.roles` con strings hardcodeados, actualiza según la tabla anterior.

---

## 5. Importar la base de datos

Antes de levantar el backend por primera vez (o cuando el backend indique error de tablas):

1. Abrir phpMyAdmin en Laragon
2. Crear la base de datos `conIns` si no existe
3. Importar `backend/database.sql` (schema v5.3 — 27 tablas)
4. Pedir el archivo `backend/seed_data.sql` a Jair (contiene datos reales — no está en el repo)
5. Importar `seed_data.sql`

---

## 6. Levantar el proyecto

Desde la raíz del proyecto:

```bash
npm run install:all   # primera vez — instala dependencias de backend y frontend
npm run dev           # levanta backend (puerto 5000) y frontend (puerto 3000) en paralelo
```

O por separado:

```bash
npm run dev:backend
npm run dev:frontend
```
