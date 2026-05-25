import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';

export const crear = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'horario.crear — TODO' });
});

export const listar = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'horario.listar — TODO' });
});

export const actualizar = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'horario.actualizar — TODO' });
});

export const deshabilitar = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'horario.deshabilitar — TODO' });
});

export const getMalla = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'horario.getMalla — TODO' });
});

export const suspender = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'horario.suspender — TODO' });
});
