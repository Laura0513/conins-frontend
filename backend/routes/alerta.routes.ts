import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import * as alertaController from '../controllers/alerta.controller.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(verifyToken);

router.get('/', alertaController.listar);

router.patch(
  '/:id/atendida',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADOR_MEDULAR, ROLES.COORDINADOR_TRANSVERSAL]),
  alertaController.marcarAtendida,
);

router.patch(
  '/:id/leida',
  alertaController.marcarLeida,
);

router.patch(
  '/marcar-todas',
  alertaController.marcarTodasLeidas,
);

export default router;
