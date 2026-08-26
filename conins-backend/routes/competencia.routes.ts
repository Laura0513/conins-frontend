import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as competenciaController from '../controllers/competencia.controller.js';
import { ROLES_COORDINACION } from '../constants/roles.js';
import { crearCompetenciaSchema, actualizarCompetenciaSchema, crearRapSchema, actualizarRapSchema } from '../schemas/competencia.schema.js';

const router = Router();

router.use(verifyToken);

// Escritura de competencias/RAPs: solo Coordinadora Academica y Asistente
// Coordinacion. El Subdirector queda en solo lectura (confirmado por Laura
// 21/07/2026 — frontend ya lo bloquea).
const ESCRITURA = ROLES_COORDINACION;

// --- Competencias (RF-25, RF-26) ---
router.get('/', competenciaController.getAll);
router.get('/:id', competenciaController.getById);

router.post('/', requireRole([...ESCRITURA]), validate(crearCompetenciaSchema), competenciaController.create);
router.patch('/:id', requireRole([...ESCRITURA]), validate(actualizarCompetenciaSchema), competenciaController.update);
router.patch('/:id/estado', requireRole([...ESCRITURA]), competenciaController.toggleEstado);

// --- RAPs de la competencia (RF-27, RF-28) ---
router.get('/:id/raps', competenciaController.getRaps);
router.post('/:id/raps', requireRole([...ESCRITURA]), validate(crearRapSchema), competenciaController.createRap);
router.patch('/:id/raps/:rapId', requireRole([...ESCRITURA]), validate(actualizarRapSchema), competenciaController.updateRap);
router.patch('/:id/raps/:rapId/estado', requireRole([...ESCRITURA]), competenciaController.toggleRapEstado);

export default router;
