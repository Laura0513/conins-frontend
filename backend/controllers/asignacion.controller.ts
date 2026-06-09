import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import { AsignacionService } from '../services/asignacion.service.js';
import { NotificacionService } from '../services/notificacion.service.js';
import { InstructorModel } from '../models/instructor.model.js';

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const asignaciones = await AsignacionService.getAll();
  ApiResponse.success(res, asignaciones);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const asignacion = await AsignacionService.getById(Number(req.params.id));
  ApiResponse.success(res, asignacion);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const asignacion = await AsignacionService.create({
    ...req.body,
    usuarioId: req.user.id,
  });

  const instructor = await InstructorModel.findById(req.body.instructor_id);
  if (instructor && asignacion) {
    await NotificacionService.onAsignacionCreada(asignacion, instructor);
  }

  ApiResponse.created(res, asignacion, 'Asignacion creada exitosamente');
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const asignacion = await AsignacionService.update(Number(req.params.id), req.body);
  ApiResponse.success(res, asignacion, 'Asignacion actualizada exitosamente');
});

export const desactivar = asyncHandler(async (req: Request, res: Response) => {
  const result = await AsignacionService.desactivar(Number(req.params.id));
  ApiResponse.success(res, result, 'Asignacion desactivada exitosamente');
});

export const registrarProvisional = asyncHandler(async (req: Request, res: Response) => {
  const asignacion = await AsignacionService.registrarProvisional({
    ...req.body,
    autorizado_por_id: req.user.id,
    usuarioId: req.user.id,
  });

  const instructor = await InstructorModel.findById(req.body.instructor_id);
  if (instructor && asignacion) {
    await NotificacionService.onAsignacionProvisional(
      asignacion,
      instructor,
      req.user.nombre,
    );
  }

  ApiResponse.created(res, asignacion, 'Asignacion provisional registrada exitosamente');
});

export const getHistoricas = asyncHandler(async (_req: Request, res: Response) => {
  const historicas = await AsignacionService.getHistoricas();
  ApiResponse.success(res, historicas);
});
