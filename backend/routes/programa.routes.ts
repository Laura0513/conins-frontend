import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import * as programaController from '../controllers/programa.controller.js';
import { ROLES_ADMIN } from '../constants/roles.js';

const router = Router();

router.use(verifyToken);

router.get('/', programaController.getAll);
router.get('/:id', programaController.getById);

// RF-24: referente de programa (dato informativo, sobre lider_programa)
router.patch(
  '/:id/referente',
  requireRole([...ROLES_ADMIN]),
  programaController.setReferente,
);

export default router;
