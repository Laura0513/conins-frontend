import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listar = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'ambiente.listar — TODO' });
});

export const registrarBloqueo = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'ambiente.registrarBloqueo — TODO' });
});

export const listarBloqueos = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'ambiente.listarBloqueos — TODO' });
});
