import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as instructorController from '../controllers/instructor.controller.js';
import { ROLES } from '../constants/roles.js';
import { crearInstructorCompletoSchema, registrarNovedadSchema, actualizarInstructorSchema, addCompetenciaSchema, bajaInstructorSchema } from '../schemas/instructor.schema.js';

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

// Histórico de instructores (ruta literal antes de /:id)
router.get('/historico', requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]), instructorController.getHistorico);
router.post('/:id/baja', requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]), validate(bajaInstructorSchema), instructorController.registrarBaja);

router.get('/:id', instructorController.getById);
router.get('/:id/detalle', instructorController.getDetalle);

router.patch('/:id', requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]), validate(actualizarInstructorSchema), instructorController.update);

router.get('/:id/competencias', instructorController.getCompetenciasHabilitadas);

router.post('/:id/competencias', requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]), validate(addCompetenciaSchema), instructorController.addCompetencia);

router.delete('/:id/competencias/:competenciaId', requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]), instructorController.removeCompetencia);

router.patch('/:id/estado', requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]), instructorController.toggleEstado);

router.post(
  '/:id/novedades',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  validate(registrarNovedadSchema),
  instructorController.registrarNovedad,
);

export default router;
