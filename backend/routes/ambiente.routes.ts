import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as ambienteController from '../controllers/ambiente.controller.js';
import { ROLES } from '../constants/roles.js';
import { crearAmbienteSchema, actualizarAmbienteSchema, bloquearAmbienteSchema } from '../schemas/ambiente.schema.js';

const router = Router();

router.use(verifyToken);

router.get('/', ambienteController.getAll);

router.post(
  '/',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  validate(crearAmbienteSchema),
  ambienteController.create,
);

router.put(
  '/:id',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  validate(actualizarAmbienteSchema),
  ambienteController.update,
);

router.post(
  '/:id/bloquear',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  validate(bloquearAmbienteSchema),
  ambienteController.bloquear,
);

router.get('/:id/bloqueos', ambienteController.listarBloqueos);

export default router;
