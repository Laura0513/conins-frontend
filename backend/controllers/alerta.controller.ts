import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import { ROLES_ADMIN } from '../constants/roles.js';
import { InstructorModel } from '../models/instructor.model.js';
import pool from '../config/db.js';

export const listar = asyncHandler(async (req: Request, res: Response) => {
  const { solo_no_atendidas } = req.query;
  const userRoles = req.user?.roles_globales ?? [];
  const esAdmin = userRoles.some((r) => (ROLES_ADMIN as readonly string[]).includes(r));

  let query = `
    SELECT a.id, a.instructor_id, u.nombre AS instructor_nombre,
           a.tipo, a.mensaje, a.semana, a.total_horas, a.ficha_id, a.rap_id,
           a.atendida, a.leida, a.created_at
    FROM alertas a
    JOIN instructores i ON a.instructor_id = i.id
    JOIN usuarios u ON i.usuario_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // Subdirector / Coordinadora / Asistente / Administrador ven TODAS las alertas.
  // Un Instructor solo ve las suyas, SALVO que sea lider de programa: en ese caso
  // ve tambien las alertas de los instructores y grupos de los programas que lidera.
  if (!esAdmin) {
    const instructor = req.user?.id ? await InstructorModel.findByUsuarioId(req.user.id) : null;
    if (!instructor) {
      return ApiResponse.success(res, []);
    }
    const [lp] = await pool.query('SELECT 1 FROM lider_programa WHERE instructor_id = ? LIMIT 1', [instructor.id]);
    const esLider = (lp as any[]).length > 0;

    if (esLider) {
      query += ` AND (
        a.instructor_id = ?
        OR a.ficha_id IN (
          SELECT f.id FROM fichas f
          WHERE f.programa_id IN (SELECT programa_id FROM lider_programa WHERE instructor_id = ?)
        )
        OR a.instructor_id IN (
          SELECT DISTINCT asg.instructor_id FROM asignacion asg
          JOIN fichas f2 ON asg.ficha_id = f2.id
          WHERE asg.activo = TRUE
            AND f2.programa_id IN (SELECT programa_id FROM lider_programa WHERE instructor_id = ?)
        )
      )`;
      params.push(instructor.id, instructor.id, instructor.id);
    } else {
      query += ' AND a.instructor_id = ?';
      params.push(instructor.id);
    }
  }

  if (solo_no_atendidas === 'true') {
    query += ' AND a.atendida = FALSE';
  }

  query += ' ORDER BY a.created_at DESC';

  const [rows] = await pool.query(query, params);
  ApiResponse.success(res, rows);
});

// Puede atender: admin (Subdirector/Coordinadora/Asistente/Administrador) sobre
// cualquier alerta; o el lider de programa sobre alertas de sus programas.
async function puedeAtenderAlerta(req: Request, alertaId: number): Promise<boolean> {
  const userRoles = req.user?.roles_globales ?? [];
  if (userRoles.some((r) => (ROLES_ADMIN as readonly string[]).includes(r))) return true;

  const instructor = req.user?.id ? await InstructorModel.findByUsuarioId(req.user.id) : null;
  if (!instructor) return false;

  const [rows] = await pool.query(
    `SELECT 1 FROM alertas a
     WHERE a.id = ?
       AND EXISTS (SELECT 1 FROM lider_programa WHERE instructor_id = ?)
       AND (
         a.ficha_id IN (
           SELECT f.id FROM fichas f
           WHERE f.programa_id IN (SELECT programa_id FROM lider_programa WHERE instructor_id = ?)
         )
         OR a.instructor_id IN (
           SELECT DISTINCT asg.instructor_id FROM asignacion asg
           JOIN fichas f2 ON asg.ficha_id = f2.id
           WHERE asg.activo = TRUE
             AND f2.programa_id IN (SELECT programa_id FROM lider_programa WHERE instructor_id = ?)
         )
       )
     LIMIT 1`,
    [alertaId, instructor.id, instructor.id, instructor.id],
  );
  return (rows as any[]).length > 0;
}

export const marcarAtendida = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const [existing] = await pool.query('SELECT id FROM alertas WHERE id = ?', [id]);
  if ((existing as any[]).length === 0) {
    return res.status(404).json({ success: false, message: 'Alerta no encontrada' });
  }

  if (!(await puedeAtenderAlerta(req, id))) {
    return res.status(403).json({ success: false, message: 'No tiene permiso para atender esta alerta' });
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
