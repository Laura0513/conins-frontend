import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as instructorController from '../controllers/instructor.controller.js';
import { ROLES } from '../constants/roles.js';
import { crearInstructorCompletoSchema, registrarNovedadSchema } from '../schemas/instructor.schema.js';

const router = Router();

router.use(verifyToken);

router.get('/', requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]), instructorController.getAll);

router.post(
  '/',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  validate(crearInstructorCompletoSchema),
  instructorController.create,
);

router.get('/perfil', instructorController.getOwnProfile);

router.get('/:id', instructorController.getById);
router.get('/:id/detalle', instructorController.getDetalle);

router.patch('/:id', requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]), instructorController.update);

router.get('/:id/competencias', instructorController.getCompetenciasHabilitadas);

router.post('/:id/competencias', requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]), instructorController.addCompetencia);

router.delete('/:id/competencias/:competenciaId', requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]), instructorController.removeCompetencia);

router.patch('/:id/estado', requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]), instructorController.toggleEstado);

router.post(
  '/:id/novedades',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  validate(registrarNovedadSchema),
  instructorController.registrarNovedad,
);

export default router;
