import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { ROLES_ADMIN } from '../constants/roles.js';
import * as consultaController from '../controllers/consulta.controller.js';

const router = Router();

router.use(verifyToken);
// Paneles de gestion del centro (carga, ocupacion): solo roles administrativos.
// Antes cualquier autenticado (incl. Instructor) veia datos globales del centro.
router.use(requireRole([...ROLES_ADMIN]));

router.get('/carga-horaria', consultaController.getCargaHoraria);
router.get('/horarios-ficha', consultaController.getHorariosFicha);
router.get('/ocupacion-ambientes', consultaController.getOcupacionAmbientes);
router.get('/correcciones', consultaController.getCorrecciones);
router.get('/calendario', consultaController.getCalendario);
router.get('/excel', consultaController.getExcel);
router.get('/rap-avance', consultaController.getRapAvance);
router.get('/rap-avance/:fichaId', consultaController.getRapAvanceFicha);

export default router;
