import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import * as sedeController from '../controllers/sede.controller.js';
import { ROLES_ADMIN } from '../constants/roles.js';

const router = Router();

router.use(verifyToken);

router.get('/', sedeController.getAll);
router.post('/', requireRole([...ROLES_ADMIN]), sedeController.create);
router.patch('/:id', requireRole([...ROLES_ADMIN]), sedeController.update);
router.patch('/:id/estado', requireRole([...ROLES_ADMIN]), sedeController.toggleEstado);

export default router;
