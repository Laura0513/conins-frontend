# CONINS - Project Context & State
**Updated:** May 25, 2026
**Roles:** Laura (Frontend), Jair (Backend)

## 1. Tech Stack
- **Frontend:** Next.js 16 (Pages Router), React 19, TypeScript, Tailwind CSS 4, Lucide React.
- **Backend:** Node.js, Express 5, TypeScript, MySQL, JWT, bcrypt.
- **Structure:** Monorepo-style (Root contains `conins-frontend/` and `backend/`).

## 2. Frontend Progress (conins-frontend/)
- **Auth:** 
  - Login & Create Password forms connected to API.
  - `AuthContext` handles global state (user, token, login/logout).
  - Protected routes via `_app.tsx`.
- **UI Components:**
  - `Toast` system (success/error/info) replacing alerts.
  - `DashboardLayout` (Sidebar + Header).
- **Modules:**
  - **Dashboard:** Stats cards, Load chart table (mock data), Recent alerts (mock data).
  - **Instructors:** 
    - Table with real data from seed.
    - Filters (Search, Contract, Area).
    - Modals: "Create Instructor" & "Register Novedad".
    - Hours column with progress bars (Green/Yellow/Red logic).

## 3. Backend Integration (backend/)
- **API Client:** `src/lib/api.ts` handles all fetch requests.
- **Working Endpoints:**
  - `POST /api/auth/login`
  - `POST /api/auth/crear-password`
  - `GET /api/instructores`
- **Pending Endpoints (Jair):**
  - `POST /api/instructores` (Create).
  - `POST /api/instructores/:id/novedades` (Register Novedad).
  - Hours calculation logic in `horarioService`.

## 4. Database (MySQL)
- **Name:** `conins`
- **Seed:** Real CDMC personnel data injected via `seed_data.sql`.
- **Key Tables:** `usuarios`, `instructores`, `roles`, `usuario_roles`, `fichas`, `horarios`.

## 5. Business Rules
- **Roles:** Subdirector, Coordinador (Medular/Transversal), Lider Programa, Instructor.
- **Hours:** 20h min - 40h max per week.
- **Novedades:** Instructors with active novelties are excluded from assignments.
- **Soft Delete:** `activo` boolean field used everywhere.

## 6. Next Steps (To-Do)
1. **Safety:** Add "Are you sure?" confirmations for Novedades/Disable actions.
2. **Refactor:** Move Modals to `src/components/instructores/`.
3. **Features:** Implement "View Detail" (Eye) and "Edit" (Pencil) buttons.
4. **New Module:** Start `Fichas` page (List + Filters + Create).
5. **Backend Sync:** Connect Dashboard stats and real Hours calculation.
