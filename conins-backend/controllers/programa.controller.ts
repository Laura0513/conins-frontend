import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { ProgramaModel } from '../models/programa.model.js';
import pool from '../config/db.js';

// GET /api/programas — detalle con referente (RF-23, RF-24)
// Incluye id y nombre, por lo que sigue sirviendo para dropdowns.
export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const programas = await ProgramaModel.findAll();
  ApiResponse.success(res, programas);
});

// GET /api/programas/:id
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const programa = await ProgramaModel.findById(Number(req.params.id));
  if (!programa) throw new NotFoundError('Programa no encontrado');
  ApiResponse.success(res, programa);
});

// PATCH /api/programas/:id/referente — { referente_id: number | null } (RF-24)
export const setReferente = asyncHandler(async (req: Request, res: Response) => {
  const programaId = Number(req.params.id);
  const { referente_id } = req.body;

  const programa = await ProgramaModel.findById(programaId);
  if (!programa) throw new NotFoundError('Programa no encontrado');

  if (referente_id !== null && referente_id !== undefined) {
    const [inst] = await pool.query('SELECT id FROM instructores WHERE id = ? AND activo = TRUE', [referente_id]);
    if ((inst as any[]).length === 0) throw new ValidationError('El instructor referente no existe o esta inactivo');
  }

  await ProgramaModel.setReferente(programaId, referente_id ?? null);

  const actualizado = await ProgramaModel.findById(programaId);
  ApiResponse.success(res, actualizado, 'Referente del programa actualizado');
});
