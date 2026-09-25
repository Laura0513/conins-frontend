import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { ROLES_ADMIN } from '../constants/roles.js';
import * as auditoriaController from '../controllers/auditoria.controller.js';

const router = Router();

router.use(verifyToken);
// La bitacora es sensible: solo roles administrativos pueden leerla.
// Antes cualquier autenticado (incl. Instructor) podia consultarla.
router.use(requireRole([...ROLES_ADMIN]));

router.get('/', auditoriaController.listar);
router.get('/:tabla/:id', auditoriaController.getPorRegistro);

export default router;
