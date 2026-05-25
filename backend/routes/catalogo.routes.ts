import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import { CatalogoService } from '../services/catalogo.service.js';

const router = Router();

router.get('/areas', asyncHandler(async (_req, res) => {
  const areas = await CatalogoService.getAreas();
  ApiResponse.success(res, areas);
}));

router.get('/programas', asyncHandler(async (_req, res) => {
  const programas = await CatalogoService.getProgramas();
  ApiResponse.success(res, programas);
}));

router.get('/programas/:id', asyncHandler(async (req, res) => {
  const programa = await CatalogoService.getProgramaById(Number(req.params.id));
  ApiResponse.success(res, programa);
}));

router.get('/programas/:id/competencias', asyncHandler(async (req, res) => {
  const competencias = await CatalogoService.getCompetenciasByPrograma(Number(req.params.id));
  ApiResponse.success(res, competencias);
}));

router.get('/competencias/:id', asyncHandler(async (req, res) => {
  const competencia = await CatalogoService.getCompetenciaById(Number(req.params.id));
  ApiResponse.success(res, competencia);
}));

router.get('/competencias/:id/raps', asyncHandler(async (req, res) => {
  const raps = await CatalogoService.getRapsByCompetencia(Number(req.params.id));
  ApiResponse.success(res, raps);
}));

export default router;
