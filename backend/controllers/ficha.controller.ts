import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listar = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'ficha.listar — TODO' });
});

export const crear = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'ficha.crear — TODO' });
});

export const actualizar = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'ficha.actualizar — TODO' });
});

export const deshabilitar = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'ficha.deshabilitar — TODO' });
});

export const getDetalle = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'ficha.getDetalle — TODO' });
});
