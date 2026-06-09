import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as consultaController from '../controllers/consulta.controller.js';

const router = Router();

router.use(verifyToken);

router.get('/carga-horaria', consultaController.getCargaHoraria);
router.get('/horarios-ficha', consultaController.getHorariosFicha);
router.get('/ocupacion-ambientes', consultaController.getOcupacionAmbientes);

export default router;
