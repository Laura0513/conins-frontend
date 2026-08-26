// ⚠ CAMBIO DE CONVENCIÓN 01/07/2026: snake_case → Title Case con espacios.
// Los valores de los roles cambiaron (ej. 'instructor' → 'Instructor').
// IMPACTO: todos los JWT emitidos antes de este cambio quedan INVÁLIDOS
// porque el campo `rol` en el payload ya no coincide con las constantes.
// → Laura (y cualquier usuario con sesión activa) debe hacer login de nuevo.
export const ROLES = {
  SUBDIRECTOR:             'Subdirector',
  COORDINADORA_ACADEMICA:  'Coordinadora Academica',
  ASISTENTE_COORDINACION:  'Asistente Coordinacion',
  INSTRUCTOR:              'Instructor',
  // Super-usuario del sistema (cuenta de despliegue/administracion, SUPER_USER
  // del .env, id 0 virtual). NO es uno de los 4 roles operativos del negocio;
  // es el tier de administracion total, por encima del Subdirector.
  ADMINISTRADOR:           'Administrador',
} as const;

export type RoleKey = (typeof ROLES)[keyof typeof ROLES];

// Todos los roles con acceso de escritura (CRUD completo). Incluye al
// super-usuario Administrador (control total del sistema).
export const ROLES_ADMIN = [
  ROLES.ADMINISTRADOR,
  ROLES.SUBDIRECTOR,
  ROLES.COORDINADORA_ACADEMICA,
  ROLES.ASISTENTE_COORDINACION,
] as const;

// Solo los roles de coordinacion (sin subdirector)
export const ROLES_COORDINACION = [
  ROLES.COORDINADORA_ACADEMICA,
  ROLES.ASISTENTE_COORDINACION,
] as const;
