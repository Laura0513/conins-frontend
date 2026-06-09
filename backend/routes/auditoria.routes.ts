import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as auditoriaController from '../controllers/auditoria.controller.js';

const router = Router();

router.use(verifyToken);

router.get('/', auditoriaController.listar);
router.get('/:tabla/:id', auditoriaController.getPorRegistro);

export default router;
