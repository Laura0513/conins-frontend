import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import { ROLES_ADMIN } from '../constants/roles.js';
import { InstructorModel } from '../models/instructor.model.js';
import pool from '../config/db.js';

// Filtro de visibilidad de alertas segun rol (sobre alias `a`).
// admin (Subdirector/Coordinadora/Asistente/Administrador) -> todas.
// Instructor -> solo las suyas; si es lider de programa, tambien las de sus programas.
// vacio=true cuando el usuario no debe ver ninguna.
async function filtroVisibilidad(req: Request): Promise<{ where: string; params: any[]; vacio: boolean }> {
  const userRoles = req.user?.roles_globales ?? [];
  const esAdmin = userRoles.some((r) => (ROLES_ADMIN as readonly string[]).includes(r));
  if (esAdmin) return { where: '', params: [], vacio: false };

  const instructor = req.user?.id ? await InstructorModel.findByUsuarioId(req.user.id) : null;
  if (!instructor) return { where: '', params: [], vacio: true };

  const [lp] = await pool.query('SELECT 1 FROM lider_programa WHERE instructor_id = ? LIMIT 1', [instructor.id]);
  const esLider = (lp as any[]).length > 0;
  if (esLider) {
    return {
      where: ` AND (
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
      )`,
      params: [instructor.id, instructor.id, instructor.id],
      vacio: false,
    };
  }
  return { where: ' AND a.instructor_id = ?', params: [instructor.id], vacio: false };
}

export const listar = asyncHandler(async (req: Request, res: Response) => {
  const { solo_no_atendidas } = req.query;
  const f = await filtroVisibilidad(req);
  if (f.vacio) return ApiResponse.success(res, []);

  let query = `
    SELECT a.id, a.instructor_id, u.nombre AS instructor_nombre,
           a.tipo, a.mensaje, a.semana, a.total_horas, a.ficha_id, a.rap_id,
           a.atendida, a.leida, a.created_at
    FROM alertas a
    JOIN instructores i ON a.instructor_id = i.id
    JOIN usuarios u ON i.usuario_id = u.id
    WHERE 1=1${f.where}
  `;
  const params = [...f.params];
  if (solo_no_atendidas === 'true') query += ' AND a.atendida = FALSE';
  query += ' ORDER BY a.created_at DESC';

  const [rows] = await pool.query(query, params);
  ApiResponse.success(res, rows);
});

// GET /api/alertas/no-atendidas/count — conteo de alertas ABIERTAS (atendida=FALSE)
// visibles para el usuario. Alimenta el badge de la campanita: al marcar una
// alerta como atendida, el numero baja.
export const contarNoAtendidas = asyncHandler(async (req: Request, res: Response) => {
  const f = await filtroVisibilidad(req);
  if (f.vacio) return ApiResponse.success(res, { count: 0 });
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM alertas a WHERE 1=1${f.where} AND a.atendida = FALSE`,
    f.params,
  );
  ApiResponse.success(res, { count: Number((rows as any[])[0]?.count ?? 0) });
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
