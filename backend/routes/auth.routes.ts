import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  loginSchema,
  crearPasswordSchema,
  registerSchema,
  changePasswordSchema,
  updateUserSchema,
} from '../schemas/auth.schema.js';
import * as authController from '../controllers/auth.controller.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Public endpoints
router.post('/login', validate(loginSchema), authController.login);
router.post('/crear-password', validate(crearPasswordSchema), authController.crearPassword);
router.post('/register', validate(registerSchema), authController.register);

// Authenticated endpoints
router.get('/perfil', verifyToken, authController.getOwnProfile);
router.put('/perfil', verifyToken, validate(updateUserSchema), authController.updateOwnProfile);
router.patch('/cambiar-contrasena', verifyToken, validate(changePasswordSchema), authController.changePassword);

// Admin endpoints
router.get('/usuarios', verifyToken, requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADOR_MEDULAR, ROLES.COORDINADOR_TRANSVERSAL]), authController.getAllUsers);
router.put('/usuarios/:id', verifyToken, requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADOR_MEDULAR, ROLES.COORDINADOR_TRANSVERSAL]), validate(updateUserSchema), authController.updateUser);
router.patch('/usuarios/:id/estado', verifyToken, requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADOR_MEDULAR, ROLES.COORDINADOR_TRANSVERSAL]), authController.toggleUserEstado);

export default router;
