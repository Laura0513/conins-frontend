import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import * as ambienteController from '../controllers/ambiente.controller.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(verifyToken);

router.get('/', ambienteController.getAll);

router.post(
  '/',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADOR_MEDULAR, ROLES.COORDINADOR_TRANSVERSAL]),
  ambienteController.create,
);

router.put(
  '/:id',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADOR_MEDULAR, ROLES.COORDINADOR_TRANSVERSAL]),
  ambienteController.update,
);

router.post(
  '/:id/bloquear',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADOR_MEDULAR, ROLES.COORDINADOR_TRANSVERSAL]),
  ambienteController.bloquear,
);

router.get('/:id/bloqueos', ambienteController.listarBloqueos);

export default router;
