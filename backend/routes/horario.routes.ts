import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as horarioController from '../controllers/horario.controller.js';
import { ROLES } from '../constants/roles.js';
import { crearHorarioSchema } from '../schemas/horario.schema.js';

const router = Router();

router.use(verifyToken);

router.get('/', horarioController.getAll);
router.get('/:id', horarioController.getById);

router.post(
  '/',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  validate(crearHorarioSchema),
  horarioController.create,
);

router.patch(
  '/:id',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  horarioController.update,
);

router.patch(
  '/:id/estado',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  horarioController.toggleActivo,
);

router.patch(
  '/:id/aprobar',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  horarioController.aprobar,
);

router.patch(
  '/:id/rechazar',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  horarioController.rechazar,
);

router.put(
  '/:id',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  horarioController.updateMultiDia,
);

router.patch(
  '/:id/suspender',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  horarioController.suspender,
);

export default router;
