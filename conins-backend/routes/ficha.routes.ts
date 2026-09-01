import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as fichaController from '../controllers/ficha.controller.js';
import { ROLES } from '../constants/roles.js';
import { crearFichaSchema, actualizarFichaSchema, crearNovedadFichaSchema } from '../schemas/ficha.schema.js';

const router = Router();

router.use(verifyToken);

router.get('/', fichaController.getAll);
router.get('/:id', fichaController.getById);
router.get('/:id/novedades', fichaController.getNovedades);

// Literal segment antes de /:id para evitar ambiguedad
router.patch(
  '/novedades/:id/toggle',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  fichaController.toggleNovedad,
);

router.post(
  '/',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  validate(crearFichaSchema),
  fichaController.create,
);

router.post(
  '/:id/novedades',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  validate(crearNovedadFichaSchema),
  fichaController.crearNovedad,
);

router.patch(
  '/:id',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  validate(actualizarFichaSchema),
  fichaController.update,
);

router.patch(
  '/:id/finalizar',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  fichaController.finalizar,
);

router.patch(
  '/:id/estado',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  fichaController.toggleEstado,
);

export default router;
