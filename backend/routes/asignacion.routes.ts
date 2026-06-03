import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as asignacionController from '../controllers/asignacion.controller.js';
import { ROLES } from '../constants/roles.js';
import { crearAsignacionSchema } from '../schemas/asignacion.schema.js';

const router = Router();

router.use(verifyToken);

router.get('/', asignacionController.getAll);
router.get('/:id', asignacionController.getById);

router.post(
  '/',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADOR_MEDULAR, ROLES.COORDINADOR_TRANSVERSAL]),
  validate(crearAsignacionSchema),
  asignacionController.create,
);

router.patch(
  '/:id',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADOR_MEDULAR, ROLES.COORDINADOR_TRANSVERSAL]),
  asignacionController.update,
);

router.patch(
  '/:id/desactivar',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADOR_MEDULAR, ROLES.COORDINADOR_TRANSVERSAL]),
  asignacionController.desactivar,
);

router.post(
  '/provisional',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADOR_MEDULAR, ROLES.COORDINADOR_TRANSVERSAL]),
  asignacionController.registrarProvisional,
);

export default router;
