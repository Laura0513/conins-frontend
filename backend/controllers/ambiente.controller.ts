import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import pool from '../config/db.js';

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const [rows] = await pool.query('SELECT id, nombre, tipo, capacidad, area_id, activo FROM ambientes WHERE activo = TRUE ORDER BY nombre');
  ApiResponse.success(res, rows);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { nombre, tipo, capacidad, area_id } = req.body;

  if (!nombre || !tipo) {
    throw new ValidationError('nombre y tipo son obligatorios');
  }

  const validTypes = ['aula', 'taller', 'laboratorio'];
  if (!validTypes.includes(tipo)) {
    throw new ValidationError(`tipo debe ser uno de: ${validTypes.join(', ')}`);
  }

  const [result] = await pool.query(
    'INSERT INTO ambientes (nombre, tipo, capacidad, area_id) VALUES (?, ?, ?, ?)',
    [nombre, tipo, capacidad ?? null, area_id ?? null],
  );

  const id = (result as any).insertId;
  const [row] = await pool.query('SELECT id, nombre, tipo, capacidad, area_id, activo FROM ambientes WHERE id = ?', [id]);
  ApiResponse.created(res, (row as any[])[0], 'Ambiente creado exitosamente');
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { nombre, tipo, capacidad, area_id, activo } = req.body;
  const id = Number(req.params.id);

  const [existing] = await pool.query('SELECT id FROM ambientes WHERE id = ?', [id]);
  if ((existing as any[]).length === 0) {
    throw new NotFoundError('Ambiente no encontrado');
  }

  if (tipo) {
    const validTypes = ['aula', 'taller', 'laboratorio'];
    if (!validTypes.includes(tipo)) {
      throw new ValidationError(`tipo debe ser uno de: ${validTypes.join(', ')}`);
    }
  }

  const updates: string[] = [];
  const values: any[] = [];

  if (nombre !== undefined) { updates.push('nombre = ?'); values.push(nombre); }
  if (tipo !== undefined) { updates.push('tipo = ?'); values.push(tipo); }
  if (capacidad !== undefined) { updates.push('capacidad = ?'); values.push(capacidad); }
  if (area_id !== undefined) { updates.push('area_id = ?'); values.push(area_id); }
  if (activo !== undefined) { updates.push('activo = ?'); values.push(activo); }

  if (updates.length === 0) {
    throw new ValidationError('No se proporcionaron campos para actualizar');
  }

  values.push(id);
  await pool.query(`UPDATE ambientes SET ${updates.join(', ')} WHERE id = ?`, values);

  const [row] = await pool.query('SELECT id, nombre, tipo, capacidad, area_id, activo FROM ambientes WHERE id = ?', [id]);
  ApiResponse.success(res, (row as any[])[0], 'Ambiente actualizado exitosamente');
});

export const bloquear = asyncHandler(async (req: Request, res: Response) => {
  const ambienteId = Number(req.params.id);
  const { fecha_inicio, fecha_fin, motivo } = req.body;

  if (!fecha_inicio || !fecha_fin || !motivo) {
    throw new ValidationError('fecha_inicio, fecha_fin y motivo son obligatorios');
  }

  if (new Date(fecha_fin) < new Date(fecha_inicio)) {
    throw new ValidationError('fecha_fin debe ser posterior a fecha_inicio');
  }

  const [existing] = await pool.query('SELECT id FROM ambientes WHERE id = ? AND activo = TRUE', [ambienteId]);
  if ((existing as any[]).length === 0) {
    throw new NotFoundError('Ambiente no encontrado o inactivo');
  }

  const [result] = await pool.query(
    'INSERT INTO ambiente_bloqueos (ambiente_id, fecha_inicio, fecha_fin, motivo) VALUES (?, ?, ?, ?)',
    [ambienteId, fecha_inicio, fecha_fin, motivo],
  );

  const bloqueoId = (result as any).insertId;
  ApiResponse.created(res, { id: bloqueoId, ambiente_id: ambienteId, fecha_inicio, fecha_fin, motivo }, 'Bloqueo registrado exitosamente');
});

export const listarBloqueos = asyncHandler(async (req: Request, res: Response) => {
  const ambienteId = Number(req.params.id);

  const [rows] = await pool.query(
    'SELECT id, ambiente_id, fecha_inicio, fecha_fin, motivo, activo, created_at FROM ambiente_bloqueos WHERE ambiente_id = ? ORDER BY fecha_inicio DESC',
    [ambienteId],
  );
  ApiResponse.success(res, rows);
});
