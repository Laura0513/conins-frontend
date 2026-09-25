import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { ROLES_ADMIN } from '../constants/roles.js';
import * as alertaController from '../controllers/alerta.controller.js';

const router = Router();

router.use(verifyToken);

router.get('/', alertaController.listar);

// Conteo de alertas no atendidas visibles (badge de la campanita).
router.get('/no-atendidas/count', alertaController.contarNoAtendidas);

// Atender una alerta es una decision de coordinacion: solo roles admin
// (Subdirector/Coordinadora/Asistente/Administrador). El rol Instructor NO puede
// atender alertas (feedback 16/09).
router.patch('/:id/atendida', requireRole([...ROLES_ADMIN]), alertaController.marcarAtendida);

router.patch('/:id/leida', alertaController.marcarLeida);

router.patch('/marcar-todas', alertaController.marcarTodasLeidas);

export default router;
