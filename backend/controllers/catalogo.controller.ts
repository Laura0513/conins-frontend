import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import pool from '../config/db.js';

export const getProgramas = asyncHandler(async (_req: Request, res: Response) => {
  const [rows] = await pool.query('SELECT id, codigo, nombre, tipo_linea, tipo_area FROM programas WHERE activo = TRUE ORDER BY nombre');
  ApiResponse.success(res, rows);
});

export const getCompetencias = asyncHandler(async (req: Request, res: Response) => {
  const { programaId } = req.query;
  const query = programaId
    ? 'SELECT c.id, c.nombre, c.codigo FROM competencias c WHERE c.programa_id = ? AND c.activo = TRUE ORDER BY c.nombre'
    : 'SELECT id, nombre, codigo, programa_id FROM competencias WHERE activo = TRUE ORDER BY nombre';
  const [rows] = await pool.query(query, programaId ? [programaId] : []);
  ApiResponse.success(res, rows);
});

export const getRaps = asyncHandler(async (req: Request, res: Response) => {
  const { competenciaId } = req.query;
  const query = competenciaId
    ? 'SELECT r.id, r.nombre, r.codigo FROM raps r WHERE r.competencia_id = ? AND r.activo = TRUE ORDER BY r.codigo'
    : 'SELECT id, nombre, codigo, competencia_id FROM raps WHERE activo = TRUE ORDER BY codigo';
  const [rows] = await pool.query(query, competenciaId ? [competenciaId] : []);
  ApiResponse.success(res, rows);
});

export const getJornadas = asyncHandler(async (_req: Request, res: Response) => {
  const [rows] = await pool.query('SELECT id, nombre, hora_inicio, hora_fin FROM jornadas ORDER BY id');
  ApiResponse.success(res, rows);
});

export const getAmbientes = asyncHandler(async (_req: Request, res: Response) => {
  const [rows] = await pool.query('SELECT id, nombre, tipo, capacidad, area_id FROM ambientes WHERE activo = TRUE ORDER BY nombre');
  ApiResponse.success(res, rows);
});

export const getAreas = asyncHandler(async (_req: Request, res: Response) => {
  const [rows] = await pool.query('SELECT id, nombre, subtipo FROM areas WHERE activa = TRUE ORDER BY nombre');
  ApiResponse.success(res, rows);
});

export const getTiposNovedadInstructor = asyncHandler(async (_req: Request, res: Response) => {
  const [rows] = await pool.query('SELECT id, nombre, descripcion FROM tipos_novedad_instructor WHERE activo = TRUE ORDER BY id');
  ApiResponse.success(res, rows);
});

export const getTiposNovedadAmbiente = asyncHandler(async (_req: Request, res: Response) => {
  const [rows] = await pool.query('SELECT id, nombre, descripcion FROM tipos_novedad_ambiente WHERE activo = TRUE ORDER BY id');
  ApiResponse.success(res, rows);
});

export const getTiposNovedadFicha = asyncHandler(async (_req: Request, res: Response) => {
  const [rows] = await pool.query('SELECT id, nombre, descripcion FROM tipos_novedad_ficha WHERE activo = TRUE ORDER BY id');
  ApiResponse.success(res, rows);
});

export const getTiposActividad = asyncHandler(async (_req: Request, res: Response) => {
  const [rows] = await pool.query(
    'SELECT id, nombre, suma_carga_horaria, requiere_ficha, requiere_ambiente, requiere_competencia FROM tipos_actividad WHERE activo = TRUE ORDER BY id',
  );
  ApiResponse.success(res, rows);
});
