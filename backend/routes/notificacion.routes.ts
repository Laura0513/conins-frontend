import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as notificacionController from '../controllers/notificacion.controller.js';

const router = Router();

router.use(verifyToken);

router.get('/', notificacionController.getMisNotificaciones);
router.get('/no-leidas/count', notificacionController.getNoLeidasCount);
router.patch('/:id/leida', notificacionController.marcarLeida);
router.patch('/marcar-todas', notificacionController.marcarTodasLeidas);

export default router;
