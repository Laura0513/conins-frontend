import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as instructorController from '../controllers/instructor.controller.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// All instructor routes require authentication
router.use(verifyToken);

// List all instructors (coordinadores+)
router.get('/', requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADOR_MEDULAR, ROLES.COORDINADOR_TRANSVERSAL]), instructorController.getAll);

// Get instructor by ID
router.get('/:id', instructorController.getById);

// Get own profile (for instructor)
router.get('/perfil', instructorController.getOwnProfile);

// Update instructor profile
router.patch('/:id', requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADOR_MEDULAR]), instructorController.update);

// Get instructor's enabled competencies
router.get('/:id/competencias', instructorController.getCompetenciasHabilitadas);

// Add competency to instructor
router.post('/:id/competencias', requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADOR_MEDULAR]), instructorController.addCompetencia);

// Remove competency from instructor
router.delete('/:id/competencias/:competenciaId', requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADOR_MEDULAR]), instructorController.removeCompetencia);

// Toggle instructor active state
router.patch('/:id/estado', requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADOR_MEDULAR]), instructorController.toggleEstado);

export default router;
