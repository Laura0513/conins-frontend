import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as alertaController from '../controllers/alerta.controller.js';

const router = Router();

router.use(verifyToken);

router.get('/', alertaController.listar);

// La autorizacion de "atender" se resuelve dentro del controller: admins
// (Subdirector/Coordinadora/Asistente/Administrador) sobre cualquier alerta;
// el lider de programa sobre las alertas de sus programas (el es quien arma los
// Excel y corrige). Por eso no se usa requireRole fijo aqui.
router.patch('/:id/atendida', alertaController.marcarAtendida);

router.patch('/:id/leida', alertaController.marcarLeida);

router.patch('/marcar-todas', alertaController.marcarTodasLeidas);

export default router;
