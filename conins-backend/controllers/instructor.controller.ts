import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import { InstructorService } from '../services/instructor.service.js';
import { NotificacionService } from '../services/notificacion.service.js';
import { InstructorModel } from '../models/instructor.model.js';
import { InstructorHistoricoModel } from '../models/instructor-historico.model.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const instructors = await InstructorService.getAll();
  ApiResponse.success(res, instructors);
});

// ============================================================
// Histórico de instructores (24/07/2026)
// ============================================================

// GET /api/instructores/historico — instructores que salieron del CDMC
export const getHistorico = asyncHandler(async (_req: Request, res: Response) => {
  const historico = await InstructorHistoricoModel.findAll();
  ApiResponse.success(res, historico);
});

// POST /api/instructores/:id/baja — registra la baja + soft-delete
// Body: { fecha_salida, motivo?, fecha_ingreso? }
export const registrarBaja = asyncHandler(async (req: Request, res: Response) => {
  const instructorId = Number(req.params.id);
  const { fecha_salida, motivo, fecha_ingreso } = req.body ?? {};

  if (!fecha_salida) throw new ValidationError('fecha_salida es obligatoria');

  const snapshot = await InstructorHistoricoModel.getSnapshot(instructorId);
  if (!snapshot) throw new NotFoundError('Instructor no encontrado');

  const id = await InstructorHistoricoModel.registrarBaja(
    instructorId,
    { nombre: (snapshot as any).nombre, documento: (snapshot as any).documento, tipo_area: (snapshot as any).tipo_area },
    { fecha_salida, motivo, fecha_ingreso },
    req.user?.id ?? null,
  );

  ApiResponse.created(res, { id, instructor_id: instructorId }, 'Baja de instructor registrada en el histórico');
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const instructor = await InstructorService.getById(Number(req.params.id));
  ApiResponse.success(res, instructor);
});

export const getDetalle = asyncHandler(async (req: Request, res: Response) => {
  const detalle = await InstructorService.getDetalle(Number(req.params.id));
  ApiResponse.success(res, detalle);
});

export const getOwnProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await InstructorService.getOwnProfile(req.user.id);
  ApiResponse.success(res, profile);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { tipo_area } = req.body;
  const updated = await InstructorService.update(Number(req.params.id), tipo_area);
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

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { nombre, email, tipo_area } = req.body;
  const result = await InstructorService.create(nombre, email, tipo_area);
  ApiResponse.created(res, result, 'Instructor creado exitosamente');
});

export const registrarNovedad = asyncHandler(async (req: Request, res: Response) => {
  const { tipo_novedad_id, fecha_inicio, fecha_regreso, observacion } = req.body;
  const result = await InstructorService.registrarNovedad(
    Number(req.params.id),
    Number(tipo_novedad_id),
    fecha_inicio,
    fecha_regreso,
    observacion,
  );

  const instructor = await InstructorModel.findById(Number(req.params.id));
  if (instructor) {
    await NotificacionService.onNovedadRegistrada(
      instructor,
      tipo_novedad_id,
      fecha_inicio,
      fecha_regreso,
    );
  }

  ApiResponse.created(res, result, 'Novedad registrada exitosamente');
});
