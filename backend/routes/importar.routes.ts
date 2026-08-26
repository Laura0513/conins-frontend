import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import * as importarController from '../controllers/importar.controller.js';
import { ROLES_ADMIN } from '../constants/roles.js';

const router = Router();

router.use(verifyToken);

// Solo administradores pueden cargar datos masivamente
router.post('/', requireRole([...ROLES_ADMIN]), importarController.importar);

export default router;
