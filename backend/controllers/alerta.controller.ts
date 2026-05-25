import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listar = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'alerta.listar — TODO' });
});

export const marcarAtendida = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'alerta.marcarAtendida — TODO' });
});
