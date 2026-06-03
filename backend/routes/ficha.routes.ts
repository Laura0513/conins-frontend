import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as fichaController from '../controllers/ficha.controller.js';
import { ROLES } from '../constants/roles.js';
import { crearFichaSchema, actualizarFichaSchema } from '../schemas/ficha.schema.js';

const router = Router();

router.use(verifyToken);

router.get('/', fichaController.getAll);
router.get('/:id', fichaController.getById);

router.post(
  '/',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADOR_MEDULAR, ROLES.COORDINADOR_TRANSVERSAL]),
  validate(crearFichaSchema),
  fichaController.create,
);

router.patch(
  '/:id',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADOR_MEDULAR, ROLES.COORDINADOR_TRANSVERSAL]),
  validate(actualizarFichaSchema),
  fichaController.update,
);

router.patch(
  '/:id/finalizar',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADOR_MEDULAR, ROLES.COORDINADOR_TRANSVERSAL]),
  fichaController.finalizar,
);

router.patch(
  '/:id/estado',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADOR_MEDULAR, ROLES.COORDINADOR_TRANSVERSAL]),
  fichaController.toggleEstado,
);

export default router;
