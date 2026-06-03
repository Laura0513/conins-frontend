import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as programaController from '../controllers/programa.controller.js';

const router = Router();

router.use(verifyToken);

router.get('/', programaController.getAll);

export default router;
