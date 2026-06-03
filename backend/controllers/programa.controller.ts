import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import { ProgramaModel } from '../models/programa.model.js';

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const programas = await ProgramaModel.findAllSimple();
  ApiResponse.success(res, programas);
});
