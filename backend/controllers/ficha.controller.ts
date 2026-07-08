import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import { FichaService } from '../services/ficha.service.js';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const fichas = await FichaService.getAll(req.user?.id, req.user?.roles_globales);
  ApiResponse.success(res, fichas);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const ficha = await FichaService.getById(Number(req.params.id));
  ApiResponse.success(res, ficha);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const ficha = await FichaService.create(req.body);
  ApiResponse.created(res, ficha, 'Ficha creada exitosamente');
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const ficha = await FichaService.update(Number(req.params.id), req.body);
  ApiResponse.success(res, ficha, 'Ficha actualizada exitosamente');
});

export const finalizar = asyncHandler(async (req: Request, res: Response) => {
  const ficha = await FichaService.finalizar(Number(req.params.id));
  ApiResponse.success(res, ficha, 'Ficha finalizada exitosamente');
});

export const toggleEstado = asyncHandler(async (req: Request, res: Response) => {
  const result = await FichaService.toggleEstado(Number(req.params.id));
  const message = result.activo ? 'Ficha activada' : 'Ficha desactivada';
  ApiResponse.success(res, result, message);
});
