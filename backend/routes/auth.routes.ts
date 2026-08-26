import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  loginSchema,
  crearPasswordSchema,
  changePasswordSchema,
  updateUserSchema,
  recuperarContrasenaSchema,
  resetearContrasenaSchema,
} from '../schemas/auth.schema.js';
import * as authController from '../controllers/auth.controller.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Public endpoints
router.post('/login', validate(loginSchema), authController.login);
// Onboarding (RN-01, paso 2): setear contrasena a un usuario preexistente activo.
// Camino unico. El antiguo /register (equivalente y sin uso en el frontend) fue
// retirado en la auditoria 25/08 para evitar dos rutas publicas redundantes.
router.post('/crear-password', validate(crearPasswordSchema), authController.crearPassword);

router.post('/recuperar-contrasena', validate(recuperarContrasenaSchema), authController.recuperarContrasena);
router.post('/resetear-contrasena', validate(resetearContrasenaSchema), authController.resetearContrasena);

// Authenticated endpoints
router.get('/perfil', verifyToken, authController.getOwnProfile);
router.put('/perfil', verifyToken, validate(updateUserSchema), authController.updateOwnProfile);
router.patch('/cambiar-contrasena', verifyToken, validate(changePasswordSchema), authController.changePassword);

// Admin endpoints
router.get('/usuarios', verifyToken, requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]), authController.getAllUsers);
router.put('/usuarios/:id', verifyToken, requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]), validate(updateUserSchema), authController.updateUser);
router.patch('/usuarios/:id/estado', verifyToken, requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]), authController.toggleUserEstado);
router.put('/usuarios/:id/programas', verifyToken, requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]), authController.assignProgramasToLider);

export default router;
