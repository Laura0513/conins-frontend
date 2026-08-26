import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import { NotificacionService } from '../services/notificacion.service.js';
import { NotificacionModel } from '../models/notificacion.model.js';

export const getMisNotificaciones = asyncHandler(async (req: Request, res: Response) => {
  const soloNoLeidas = req.query.solo_no_leidas === 'true';
  const notificaciones = await NotificacionModel.findByUsuario(req.user.id, soloNoLeidas);
  ApiResponse.success(res, notificaciones);
});

export const getNoLeidasCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await NotificacionModel.getNoLeidasCount(req.user.id);
  ApiResponse.success(res, { count });
});

export const marcarLeida = asyncHandler(async (req: Request, res: Response) => {
  await NotificacionModel.marcarLeida(Number(req.params.id));
  ApiResponse.success(res, null, 'Notificacion marcada como leida');
});

export const marcarTodasLeidas = asyncHandler(async (req: Request, res: Response) => {
  await NotificacionModel.marcarTodasLeidas(req.user.id);
  ApiResponse.success(res, null, 'Todas las notificaciones marcadas como leidas');
});
