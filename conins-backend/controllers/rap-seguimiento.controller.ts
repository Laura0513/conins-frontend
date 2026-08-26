import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import { RapSeguimientoService } from '../services/rap-seguimiento.service.js';

export const getByFicha = asyncHandler(async (req: Request, res: Response) => {
  const seguimientos = await RapSeguimientoService.getByFicha(Number(req.params.fichaId));
  ApiResponse.success(res, seguimientos);
});

export const getByAsignacionCompetencia = asyncHandler(async (req: Request, res: Response) => {
  const seguimientos = await RapSeguimientoService.getByAsignacionCompetencia(
    Number(req.params.asignacionCompetenciaId),
  );
  ApiResponse.success(res, seguimientos);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const seguimiento = await RapSeguimientoService.getById(Number(req.params.id));
  ApiResponse.success(res, seguimiento);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const seguimiento = await RapSeguimientoService.create(req.body);
  ApiResponse.created(res, seguimiento, 'Seguimiento RAP creado exitosamente');
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const seguimiento = await RapSeguimientoService.update(Number(req.params.id), req.body);
  ApiResponse.success(res, seguimiento, 'Seguimiento RAP actualizado exitosamente');
});

export const evaluar = asyncHandler(async (req: Request, res: Response) => {
  const seguimiento = await RapSeguimientoService.evaluar(
    Number(req.params.id),
    req.body.estado_aprobacion,
  );
  ApiResponse.success(res, seguimiento, 'RAP evaluado exitosamente');
});

export const toggleActivo = asyncHandler(async (req: Request, res: Response) => {
  const result = await RapSeguimientoService.toggleActivo(Number(req.params.id));
  const message = result.activo ? 'Seguimiento activado' : 'Seguimiento desactivado';
  ApiResponse.success(res, result, message);
});

export const getDisponibles = asyncHandler(async (req: Request, res: Response) => {
  const disponibles = await RapSeguimientoService.getDisponibles(Number(req.params.fichaId));
  ApiResponse.success(res, disponibles);
});
