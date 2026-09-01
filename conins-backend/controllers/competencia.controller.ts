import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors.js';
import pool from '../config/db.js';
import { AsignacionRapModel } from '../models/asignacion-rap.model.js';

// ============================================================
// COMPETENCIAS — RF-25, RF-26 (RN-25)
// Carga base de Sofia Plus + gestion administrativa (CRUD).
// Tablas competencias/raps ya existen en el schema (seed).
// ============================================================

// GET /api/competencias — lista con programa_nombre y raps_count
export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { programaId, estado } = req.query;

  const where: string[] = [];
  const params: any[] = [];

  if (programaId) { where.push('c.programa_id = ?'); params.push(programaId); }
  if (estado === 'activo') { where.push('c.activo = TRUE'); }
  else if (estado === 'inactivo') { where.push('c.activo = FALSE'); }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT c.id, c.codigo, c.nombre, c.programa_id, p.nombre AS programa_nombre,
            c.activo,
            (SELECT COUNT(*) FROM raps r WHERE r.competencia_id = c.id AND r.activo = TRUE) AS raps_count
     FROM competencias c
     JOIN programas p ON c.programa_id = p.id
     ${whereSql}
     ORDER BY c.nombre`,
    params,
  );
  ApiResponse.success(res, rows);
});

// GET /api/competencias/:id
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const [rows] = await pool.query(
    `SELECT c.id, c.codigo, c.nombre, c.programa_id, p.nombre AS programa_nombre, c.activo
     FROM competencias c
     JOIN programas p ON c.programa_id = p.id
     WHERE c.id = ?`,
    [id],
  );
  if ((rows as any[]).length === 0) throw new NotFoundError('Competencia no encontrada');
  ApiResponse.success(res, (rows as any[])[0]);
});

// POST /api/competencias — { codigo, nombre, programa_id }
export const create = asyncHandler(async (req: Request, res: Response) => {
  const { codigo, nombre, programa_id } = req.body;

  if (!codigo || !nombre || !programa_id) {
    throw new ValidationError('codigo, nombre y programa_id son obligatorios');
  }

  const [prog] = await pool.query('SELECT id FROM programas WHERE id = ? AND activo = TRUE', [programa_id]);
  if ((prog as any[]).length === 0) throw new ValidationError('El programa indicado no existe o esta inactivo');

  const [result] = await pool.query(
    'INSERT INTO competencias (codigo, nombre, programa_id) VALUES (?, ?, ?)',
    [codigo, nombre, programa_id],
  );

  const id = (result as any).insertId;
  const [row] = await pool.query(
    `SELECT c.id, c.codigo, c.nombre, c.programa_id, p.nombre AS programa_nombre, c.activo
     FROM competencias c JOIN programas p ON c.programa_id = p.id WHERE c.id = ?`,
    [id],
  );
  ApiResponse.created(res, (row as any[])[0], 'Competencia creada exitosamente');
});

// PATCH /api/competencias/:id — editar codigo, nombre, programa_id
export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { codigo, nombre, programa_id } = req.body;

  const [existing] = await pool.query('SELECT id FROM competencias WHERE id = ?', [id]);
  if ((existing as any[]).length === 0) throw new NotFoundError('Competencia no encontrada');

  const updates: string[] = [];
  const values: any[] = [];

  if (codigo !== undefined) { updates.push('codigo = ?'); values.push(codigo); }
  if (nombre !== undefined) { updates.push('nombre = ?'); values.push(nombre); }
  if (programa_id !== undefined) {
    const [prog] = await pool.query('SELECT id FROM programas WHERE id = ? AND activo = TRUE', [programa_id]);
    if ((prog as any[]).length === 0) throw new ValidationError('El programa indicado no existe o esta inactivo');
    updates.push('programa_id = ?'); values.push(programa_id);
  }

  if (updates.length === 0) throw new ValidationError('No se proporcionaron campos para actualizar');

  values.push(id);
  await pool.query(`UPDATE competencias SET ${updates.join(', ')} WHERE id = ?`, values);

  const [row] = await pool.query(
    `SELECT c.id, c.codigo, c.nombre, c.programa_id, p.nombre AS programa_nombre, c.activo
     FROM competencias c JOIN programas p ON c.programa_id = p.id WHERE c.id = ?`,
    [id],
  );
  ApiResponse.success(res, (row as any[])[0], 'Competencia actualizada exitosamente');
});

// PATCH /api/competencias/:id/estado — toggle activo (RN-10 soft delete)
export const toggleEstado = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const [existing] = await pool.query('SELECT id, activo FROM competencias WHERE id = ?', [id]);
  if ((existing as any[]).length === 0) throw new NotFoundError('Competencia no encontrada');

  const nuevoEstado = !(existing as any[])[0].activo;
  await pool.query('UPDATE competencias SET activo = ? WHERE id = ?', [nuevoEstado, id]);

  const message = nuevoEstado ? 'Competencia activada' : 'Competencia desactivada';
  ApiResponse.success(res, { id, activo: nuevoEstado }, message);
});

// ============================================================
// RAPs — RF-27, RF-28 (RN-25, RN-26)
// Frontend usa el campo "descripcion"; la columna real es "nombre".
// Se aliasa en el SELECT y se mapea en el INSERT/UPDATE.
// ============================================================

// GET /api/competencias/:id/raps — RAPs de la competencia
export const getRaps = asyncHandler(async (req: Request, res: Response) => {
  const competenciaId = Number(req.params.id);

  const [comp] = await pool.query('SELECT id FROM competencias WHERE id = ?', [competenciaId]);
  if ((comp as any[]).length === 0) throw new NotFoundError('Competencia no encontrada');

  const [rows] = await pool.query(
    `SELECT id, codigo, nombre AS descripcion, competencia_id, fecha_limite, activo
     FROM raps WHERE competencia_id = ? ORDER BY codigo`,
    [competenciaId],
  );
  ApiResponse.success(res, rows);
});

// POST /api/competencias/:id/raps — { codigo, descripcion }
export const createRap = asyncHandler(async (req: Request, res: Response) => {
  const competenciaId = Number(req.params.id);
  const { codigo, descripcion } = req.body;

  if (!codigo || !descripcion) {
    throw new ValidationError('codigo y descripcion son obligatorios');
  }

  const [comp] = await pool.query('SELECT id FROM competencias WHERE id = ?', [competenciaId]);
  if ((comp as any[]).length === 0) throw new NotFoundError('Competencia no encontrada');

  const [result] = await pool.query(
    'INSERT INTO raps (codigo, nombre, competencia_id) VALUES (?, ?, ?)',
    [codigo, descripcion, competenciaId],
  );

  const id = (result as any).insertId;
  const [row] = await pool.query(
    'SELECT id, codigo, nombre AS descripcion, competencia_id, fecha_limite, activo FROM raps WHERE id = ?',
    [id],
  );
  ApiResponse.created(res, (row as any[])[0], 'RAP creado exitosamente');
});

// PATCH /api/competencias/:id/raps/:rapId — editar codigo, descripcion
export const updateRap = asyncHandler(async (req: Request, res: Response) => {
  const competenciaId = Number(req.params.id);
  const rapId = Number(req.params.rapId);
  const { codigo, descripcion } = req.body;

  const [existing] = await pool.query(
    'SELECT id FROM raps WHERE id = ? AND competencia_id = ?',
    [rapId, competenciaId],
  );
  if ((existing as any[]).length === 0) throw new NotFoundError('RAP no encontrado en esta competencia');

  const updates: string[] = [];
  const values: any[] = [];

  if (codigo !== undefined) { updates.push('codigo = ?'); values.push(codigo); }
  if (descripcion !== undefined) { updates.push('nombre = ?'); values.push(descripcion); }

  if (updates.length === 0) throw new ValidationError('No se proporcionaron campos para actualizar');

  values.push(rapId);
  await pool.query(`UPDATE raps SET ${updates.join(', ')} WHERE id = ?`, values);

  const [row] = await pool.query(
    'SELECT id, codigo, nombre AS descripcion, competencia_id, fecha_limite, activo FROM raps WHERE id = ?',
    [rapId],
  );
  ApiResponse.success(res, (row as any[])[0], 'RAP actualizado exitosamente');
});

// PATCH /api/competencias/:id/raps/:rapId/estado — toggle activo (RN-26)
export const toggleRapEstado = asyncHandler(async (req: Request, res: Response) => {
  const competenciaId = Number(req.params.id);
  const rapId = Number(req.params.rapId);

  const [existing] = await pool.query(
    'SELECT id, activo FROM raps WHERE id = ? AND competencia_id = ?',
    [rapId, competenciaId],
  );
  if ((existing as any[]).length === 0) throw new NotFoundError('RAP no encontrado en esta competencia');

  const nuevoEstado = !(existing as any[])[0].activo;

  // RN-26: no se puede deshabilitar un RAP que tiene asignacion activa.
  if (!nuevoEstado) {
    const enUso = await AsignacionRapModel.isRapAsignadoActivo(rapId);
    if (enUso) {
      throw new ConflictError('No se puede deshabilitar un RAP con asignacion activa (RN-26)');
    }
  }

  await pool.query('UPDATE raps SET activo = ? WHERE id = ?', [nuevoEstado, rapId]);

  const message = nuevoEstado ? 'RAP activado' : 'RAP desactivado';
  ApiResponse.success(res, { id: rapId, activo: nuevoEstado }, message);
});
