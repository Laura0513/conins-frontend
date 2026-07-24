import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import * as competenciaController from '../controllers/competencia.controller.js';
import { ROLES_COORDINACION } from '../constants/roles.js';

const router = Router();

router.use(verifyToken);

// Escritura de competencias/RAPs: solo Coordinadora Academica y Asistente
// Coordinacion. El Subdirector queda en solo lectura (confirmado por Laura
// 21/07/2026 — frontend ya lo bloquea).
const ESCRITURA = ROLES_COORDINACION;

// --- Competencias (RF-25, RF-26) ---
router.get('/', competenciaController.getAll);
router.get('/:id', competenciaController.getById);

router.post('/', requireRole([...ESCRITURA]), competenciaController.create);
router.patch('/:id', requireRole([...ESCRITURA]), competenciaController.update);
router.patch('/:id/estado', requireRole([...ESCRITURA]), competenciaController.toggleEstado);

// --- RAPs de la competencia (RF-27, RF-28) ---
router.get('/:id/raps', competenciaController.getRaps);
router.post('/:id/raps', requireRole([...ESCRITURA]), competenciaController.createRap);
router.patch('/:id/raps/:rapId', requireRole([...ESCRITURA]), competenciaController.updateRap);
router.patch('/:id/raps/:rapId/estado', requireRole([...ESCRITURA]), competenciaController.toggleRapEstado);

export default router;
