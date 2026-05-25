import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import { InstructorService } from '../services/instructor.service.js';

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const instructors = await InstructorService.getAll();
  ApiResponse.success(res, instructors);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const instructor = await InstructorService.getById(Number(req.params.id));
  ApiResponse.success(res, instructor);
});

export const getOwnProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await InstructorService.getOwnProfile(req.user.id);
  ApiResponse.success(res, profile);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { tipo_contrato, tipo_area } = req.body;
  const updated = await InstructorService.update(Number(req.params.id), tipo_contrato, tipo_area);
  ApiResponse.success(res, updated, 'Instructor actualizado exitosamente');
});

export const getCompetenciasHabilitadas = asyncHandler(async (req: Request, res: Response) => {
  const competencias = await InstructorService.getCompetenciasHabilitadas(Number(req.params.id));
  ApiResponse.success(res, competencias);
});

export const addCompetencia = asyncHandler(async (req: Request, res: Response) => {
  const { competencia_id } = req.body;
  const competencias = await InstructorService.addCompetencia(Number(req.params.id), Number(competencia_id));
  ApiResponse.success(res, competencias, 'Competencia habilitada exitosamente');
});

export const removeCompetencia = asyncHandler(async (req: Request, res: Response) => {
  const competencias = await InstructorService.removeCompetencia(
    Number(req.params.id),
    Number(req.params.competenciaId),
  );
  ApiResponse.success(res, competencias, 'Competencia removida exitosamente');
});

export const toggleEstado = asyncHandler(async (req: Request, res: Response) => {
  const result = await InstructorService.toggleEstado(Number(req.params.id));
  const message = result.activo ? 'Instructor activado' : 'Instructor desactivado';
  ApiResponse.success(res, result, message);
});
