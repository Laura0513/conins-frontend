import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import * as competenciaController from '../controllers/competencia.controller.js';
import { ROLES_ADMIN } from '../constants/roles.js';

const router = Router();

router.use(verifyToken);

// --- Competencias (RF-25, RF-26) ---
router.get('/', competenciaController.getAll);
router.get('/:id', competenciaController.getById);

router.post('/', requireRole([...ROLES_ADMIN]), competenciaController.create);
router.patch('/:id', requireRole([...ROLES_ADMIN]), competenciaController.update);
router.patch('/:id/estado', requireRole([...ROLES_ADMIN]), competenciaController.toggleEstado);

// --- RAPs de la competencia (RF-27, RF-28) ---
router.get('/:id/raps', competenciaController.getRaps);
router.post('/:id/raps', requireRole([...ROLES_ADMIN]), competenciaController.createRap);
router.patch('/:id/raps/:rapId', requireRole([...ROLES_ADMIN]), competenciaController.updateRap);
router.patch('/:id/raps/:rapId/estado', requireRole([...ROLES_ADMIN]), competenciaController.toggleRapEstado);

export default router;
