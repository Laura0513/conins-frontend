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

// RF-44: el "referente de grupo" del frontend se persiste en fichas.lider_id.
// Se acepta referente_id como alias de lider_id sin duplicar columna.
function mapReferente(body: any): any {
  if (body && body.referente_id !== undefined && body.lider_id === undefined) {
    return { ...body, lider_id: body.referente_id };
  }
  return body;
}

export const create = asyncHandler(async (req: Request, res: Response) => {
  const ficha = await FichaService.create(mapReferente(req.body));
  ApiResponse.created(res, ficha, 'Ficha creada exitosamente');
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const ficha = await FichaService.update(Number(req.params.id), mapReferente(req.body));
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

// RF-47: Novedades de ficha
export const getNovedades = asyncHandler(async (req: Request, res: Response) => {
  const novedades = await FichaService.getNovedades(Number(req.params.id));
  ApiResponse.success(res, novedades);
});

export const crearNovedad = asyncHandler(async (req: Request, res: Response) => {
  const novedad = await FichaService.crearNovedad(Number(req.params.id), req.body);
  ApiResponse.created(res, novedad, 'Novedad registrada exitosamente');
});

export const toggleNovedad = asyncHandler(async (req: Request, res: Response) => {
  const result = await FichaService.toggleNovedad(Number(req.params.id));
  const message = result.activo ? 'Novedad activada' : 'Novedad desactivada';
  ApiResponse.success(res, result, message);
});
