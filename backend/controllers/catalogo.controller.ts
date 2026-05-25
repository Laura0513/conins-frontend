import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getProgramas = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'catalogo.getProgramas — TODO' });
});

export const getCompetencias = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'catalogo.getCompetencias — TODO' });
});

export const getRaps = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'catalogo.getRaps — TODO' });
});

export const getJornadas = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'catalogo.getJornadas — TODO' });
});

export const getAmbientes = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'catalogo.getAmbientes — TODO' });
});

export const getAreas = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'catalogo.getAreas — TODO' });
});
