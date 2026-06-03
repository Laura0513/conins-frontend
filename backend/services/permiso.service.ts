import pool from '../config/db.js';
import { ForbiddenError } from '../utils/errors.js';

export const PermisoService = {
  async validarAlcanceLider(usuarioId: number, fichaId: number): Promise<void> {
    const [rows] = await pool.query(
      `SELECT 1 FROM lider_programa lp
       JOIN fichas f ON f.programa_id = lp.programa_id
       JOIN instructores i ON lp.instructor_id = i.id
       WHERE i.usuario_id = ? AND f.id = ?
       LIMIT 1`,
      [usuarioId, fichaId],
    );
    if ((rows as any[]).length === 0) {
      throw new ForbiddenError('El lider solo puede asignar dentro de sus programas (RN-12)');
    }
  },

  async validarNoLiderParaProvisional(usuarioId: number): Promise<void> {
    const [rows] = await pool.query(
      `SELECT 1 FROM usuario_roles ur
       JOIN roles r ON ur.rol_id = r.id
       WHERE ur.usuario_id = ? AND r.nombre = 'lider_programa'
       LIMIT 1`,
      [usuarioId],
    );
    const esLider = (rows as any[]).length > 0;

    const [adminRows] = await pool.query(
      `SELECT 1 FROM usuario_roles ur
       JOIN roles r ON ur.rol_id = r.id
       WHERE ur.usuario_id = ? AND r.nivel <= 2
       LIMIT 1`,
      [usuarioId],
    );
    const esAdmin = (adminRows as any[]).length > 0;

    if (esLider && !esAdmin) {
      throw new ForbiddenError('Los lideres de programa no pueden registrar asignaciones provisionales (RN-12)');
    }
  },

  async validarAlcanceCoordinador(usuarioId: number, fichaId: number): Promise<void> {
    const [rows] = await pool.query(
      `SELECT r.nombre FROM usuario_roles ur
       JOIN roles r ON ur.rol_id = r.id
       WHERE ur.usuario_id = ? AND r.nombre LIKE 'coordinador_%'`,
      [usuarioId],
    );
    const roles = (rows as any[]) as { nombre: string }[];
    if (roles.length === 0) return;

    const esMedular = roles.some((r) => r.nombre === 'coordinador_medular');
    const esTransversal = roles.some((r) => r.nombre === 'coordinador_transversal');

    const [fichaRows] = await pool.query(
      `SELECT p.tipo_linea FROM fichas f
       JOIN programas p ON f.programa_id = p.id
       WHERE f.id = ?`,
      [fichaId],
    );
    const tipoLinea = ((fichaRows as any[])[0] as { tipo_linea: string })?.tipo_linea;

    if (esMedular && tipoLinea !== 'medular') {
      throw new ForbiddenError('El coordinador medular solo puede gestionar fichas de linea medular');
    }
    if (esTransversal && tipoLinea !== 'transversal') {
      throw new ForbiddenError('El coordinador transversal solo puede gestionar fichas de linea transversal');
    }
  },
};
