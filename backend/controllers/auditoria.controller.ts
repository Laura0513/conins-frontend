import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import pool from '../config/db.js';

export const listar = asyncHandler(async (req: Request, res: Response) => {
  const { tabla, usuario_id, accion, desde, hasta, limit = 100, offset = 0 } = req.query;

  let query = `
    SELECT a.*, u.nombre AS usuario_nombre, u.email AS usuario_email
    FROM auditoria a
    LEFT JOIN usuarios u ON a.usuario_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (tabla) {
    query += ' AND a.tabla_afectada = ?';
    params.push(tabla);
  }
  if (usuario_id) {
    query += ' AND a.usuario_id = ?';
    params.push(usuario_id);
  }
  if (accion) {
    query += ' AND a.accion = ?';
    params.push(accion);
  }
  if (desde) {
    query += ' AND a.fecha >= ?';
    params.push(desde);
  }
  if (hasta) {
    query += ' AND a.fecha <= ?';
    params.push(hasta);
  }

  query += ' ORDER BY a.fecha DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const [rows] = await pool.query(query, params);
  ApiResponse.success(res, rows);
});

export const getPorRegistro = asyncHandler(async (req: Request, res: Response) => {
  const { tabla, id } = req.params;

  const [rows] = await pool.query(
    `SELECT a.*, u.nombre AS usuario_nombre, u.email AS usuario_email
     FROM auditoria a
     LEFT JOIN usuarios u ON a.usuario_id = u.id
     WHERE a.tabla_afectada = ? AND a.registro_id = ?
     ORDER BY a.fecha DESC`,
    [tabla, id],
  );

  ApiResponse.success(res, rows);
});
