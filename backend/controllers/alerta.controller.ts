import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import { ROLES } from '../constants/roles.js';
import pool from '../config/db.js';

export const listar = asyncHandler(async (req: Request, res: Response) => {
  const { solo_no_atendidas } = req.query;
  const userRoles = req.user?.roles_globales ?? [];
  const esInstructor = userRoles.length === 1 && userRoles[0] === ROLES.INSTRUCTOR;

  let query = `
    SELECT a.id, a.instructor_id, u.nombre AS instructor_nombre,
           a.tipo, a.mensaje, a.semana, a.total_horas,
           a.atendida, a.leida, a.created_at
    FROM alertas a
    JOIN instructores i ON a.instructor_id = i.id
    JOIN usuarios u ON i.usuario_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // P22: instructor solo ve sus propias alertas
  if (esInstructor && req.user?.id) {
    query += ' AND i.usuario_id = ?';
    params.push(req.user.id);
  }

  if (solo_no_atendidas === 'true') {
    query += ' AND a.atendida = FALSE';
  }

  query += ' ORDER BY a.created_at DESC';

  const [rows] = await pool.query(query, params);
  ApiResponse.success(res, rows);
});

export const marcarAtendida = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const [existing] = await pool.query('SELECT id FROM alertas WHERE id = ?', [id]);
  if ((existing as any[]).length === 0) {
    return res.status(404).json({ success: false, message: 'Alerta no encontrada' });
  }

  await pool.query('UPDATE alertas SET atendida = TRUE WHERE id = ?', [id]);
  ApiResponse.success(res, { id, atendida: true }, 'Alerta marcada como atendida');
});

export const marcarLeida = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const [existing] = await pool.query('SELECT id FROM alertas WHERE id = ?', [id]);
  if ((existing as any[]).length === 0) {
    return res.status(404).json({ success: false, message: 'Alerta no encontrada' });
  }

  await pool.query('UPDATE alertas SET leida = TRUE WHERE id = ?', [id]);
  ApiResponse.success(res, { id, leida: true }, 'Alerta marcada como leida');
});

export const marcarTodasLeidas = asyncHandler(async (_req: Request, res: Response) => {
  await pool.query('UPDATE alertas SET leida = TRUE WHERE leida = FALSE');
  ApiResponse.success(res, {}, 'Todas las alertas marcadas como leidas');
});
