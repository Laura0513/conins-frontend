import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import pool from '../config/db.js';

// ============================================================
// SEDES (24/07/2026) — el CDMC tiene sedes que dependen de el.
// ============================================================

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const [rows] = await pool.query(
    'SELECT id, nombre, direccion, es_principal, activo FROM sedes WHERE activo = TRUE ORDER BY es_principal DESC, nombre',
  );
  ApiResponse.success(res, rows);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { nombre, direccion, es_principal } = req.body;
  if (!nombre) throw new ValidationError('nombre es obligatorio');

  const [result] = await pool.query(
    'INSERT INTO sedes (nombre, direccion, es_principal) VALUES (?, ?, ?)',
    [nombre, direccion ?? null, es_principal ? 1 : 0],
  );
  const id = (result as any).insertId;
  const [row] = await pool.query('SELECT id, nombre, direccion, es_principal, activo FROM sedes WHERE id = ?', [id]);
  ApiResponse.created(res, (row as any[])[0], 'Sede creada exitosamente');
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { nombre, direccion, es_principal, activo } = req.body;

  const [existing] = await pool.query('SELECT id FROM sedes WHERE id = ?', [id]);
  if ((existing as any[]).length === 0) throw new NotFoundError('Sede no encontrada');

  const updates: string[] = [];
  const values: any[] = [];
  if (nombre !== undefined) { updates.push('nombre = ?'); values.push(nombre); }
  if (direccion !== undefined) { updates.push('direccion = ?'); values.push(direccion); }
  if (es_principal !== undefined) { updates.push('es_principal = ?'); values.push(es_principal ? 1 : 0); }
  if (activo !== undefined) { updates.push('activo = ?'); values.push(activo ? 1 : 0); }

  if (updates.length === 0) throw new ValidationError('No se proporcionaron campos para actualizar');

  values.push(id);
  await pool.query(`UPDATE sedes SET ${updates.join(', ')} WHERE id = ?`, values);

  const [row] = await pool.query('SELECT id, nombre, direccion, es_principal, activo FROM sedes WHERE id = ?', [id]);
  ApiResponse.success(res, (row as any[])[0], 'Sede actualizada exitosamente');
});

export const toggleEstado = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const [existing] = await pool.query('SELECT id, activo FROM sedes WHERE id = ?', [id]);
  if ((existing as any[]).length === 0) throw new NotFoundError('Sede no encontrada');

  const nuevo = !(existing as any[])[0].activo;
  await pool.query('UPDATE sedes SET activo = ? WHERE id = ?', [nuevo, id]);
  ApiResponse.success(res, { id, activo: nuevo }, nuevo ? 'Sede activada' : 'Sede desactivada');
});
