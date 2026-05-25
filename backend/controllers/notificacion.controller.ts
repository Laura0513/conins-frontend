import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listar = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'notificacion.listar — TODO' });
});

export const marcarLeida = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'notificacion.marcarLeida — TODO' });
});

export const marcarTodasLeidas = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'notificacion.marcarTodasLeidas — TODO' });
});
