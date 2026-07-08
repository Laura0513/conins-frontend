import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as rapSeguimientoController from '../controllers/rap-seguimiento.controller.js';
import { ROLES } from '../constants/roles.js';
import {
  crearRapSeguimientoSchema,
  actualizarRapSeguimientoSchema,
  evaluarRapSchema,
} from '../schemas/rap-seguimiento.schema.js';

const router = Router();

router.use(verifyToken);

// GET seguimientos por ficha (todos los roles)
router.get('/ficha/:fichaId', rapSeguimientoController.getByFicha);

// GET RAPs disponibles (sin seguimiento) por ficha
router.get('/ficha/:fichaId/disponibles', rapSeguimientoController.getDisponibles);

// GET seguimientos por asignacion_competencia
router.get(
  '/asignacion-competencia/:asignacionCompetenciaId',
  rapSeguimientoController.getByAsignacionCompetencia,
);

// GET seguimiento por ID
router.get('/:id', rapSeguimientoController.getById);

// POST crear seguimiento (solo admin/coordinacion)
router.post(
  '/',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  validate(crearRapSeguimientoSchema),
  rapSeguimientoController.create,
);

// PATCH actualizar seguimiento
router.patch(
  '/:id',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  validate(actualizarRapSeguimientoSchema),
  rapSeguimientoController.update,
);

// PATCH evaluar RAP (marcar evaluado + aprobado/no_aprobado)
router.patch(
  '/:id/evaluar',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  validate(evaluarRapSchema),
  rapSeguimientoController.evaluar,
);

// PATCH toggle activo
router.patch(
  '/:id/estado',
  requireRole([ROLES.SUBDIRECTOR, ROLES.COORDINADORA_ACADEMICA, ROLES.ASISTENTE_COORDINACION]),
  rapSeguimientoController.toggleActivo,
);

export default router;
