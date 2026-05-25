export const ROLES = {
  SUBDIRECTOR: 'subdirector',
  COORDINADOR_MEDULAR: 'coordinador_medular',
  COORDINADOR_TRANSVERSAL: 'coordinador_transversal',
  LIDER_PROGRAMA: 'lider_programa',
  INSTRUCTOR: 'instructor',
} as const;

export type RoleKey = (typeof ROLES)[keyof typeof ROLES];

export const ROLES_ADMIN = [
  ROLES.SUBDIRECTOR,
  ROLES.COORDINADOR_MEDULAR,
  ROLES.COORDINADOR_TRANSVERSAL,
] as const;

export const ROLES_COORDINADOR = [
  ROLES.COORDINADOR_MEDULAR,
  ROLES.COORDINADOR_TRANSVERSAL,
] as const;
