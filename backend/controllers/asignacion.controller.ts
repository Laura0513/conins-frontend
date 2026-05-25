import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';

export const crear = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'asignacion.crear — TODO' });
});

export const listar = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'asignacion.listar — TODO' });
});

export const actualizar = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'asignacion.actualizar — TODO' });
});

export const deshabilitar = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'asignacion.deshabilitar — TODO' });
});

export const registrarProvisional = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'asignacion.registrarProvisional — TODO' });
});

export const asignarCompetencia = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'asignacion.asignarCompetencia — TODO' });
});
