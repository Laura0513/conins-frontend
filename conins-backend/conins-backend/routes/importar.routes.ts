import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import * as importarController from '../controllers/importar.controller.js';
import { ROLES_ADMIN } from '../constants/roles.js';

const router = Router();

router.use(verifyToken);

// Solo administradores pueden cargar datos masivamente
// Preview: normaliza y clasifica SIN escribir (paso de revision)
router.post('/preview', requireRole([...ROLES_ADMIN]), importarController.preview);
// Confirmar: escribe el template (crea ambientes aprobados primero)
router.post('/', requireRole([...ROLES_ADMIN]), importarController.importar);
// Historico de cargas anteriores (solo roles administrativos)
router.get('/historico', requireRole([...ROLES_ADMIN]), importarController.getHistorico);

export default router;
