import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as asignacionController from '../controllers/asignacion.controller.js';
import { ROLES } from '../constants/roles.js';
import { crearAsignacionSchema, actualizarAsignacionSchema, registrarProvisionalSchema, setRapsSchema } from '../schemas/asignacion.schema.js';

const router = Router();

router.use(verifyToken);

router.get('/', asignacionController.getAll);
router.get('/historicas', asignacionController.getHistoricas);

// RF-42 — RAPs asignados (rutas literales antes de /:id para evitar ambiguedad)
router.get('/:id/raps', asignacionController.getRapsByAsignacion);
router.get('/:id/competencia/:competenciaId/raps', asignacionController.getRapsDeCompetencia);
router.put(
  '/:id/competencia/:competenciaId/raps',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  validate(setRapsSchema),
  asignacionController.setRapsDeCompetencia,
);

router.get('/:id', asignacionController.getById);

router.post(
  '/',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  validate(crearAsignacionSchema),
  asignacionController.create,
);

router.patch(
  '/:id',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  validate(actualizarAsignacionSchema),
  asignacionController.update,
);

router.patch(
  '/:id/desactivar',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  asignacionController.desactivar,
);

router.post(
  '/provisional',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  validate(registrarProvisionalSchema),
  asignacionController.registrarProvisional,
);

export default router;
