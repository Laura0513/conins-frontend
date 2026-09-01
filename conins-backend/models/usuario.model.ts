import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

export interface Usuario extends RowDataPacket {
  id: number;
  nombre: string;
  email: string;
  password: string | null;
  tipo_documento: string | null;
  documento: string | null;
  activo: boolean;
  created_at: Date;
}

export interface UsuarioWithRoles {
  id: number;
  nombre: string;
  email: string;
  password: null;
  tipo_documento: string | null;
  documento: string | null;
  activo: boolean;
  created_at: Date;
  ultimo_acceso: Date | null;
  rol: string;
  roles: string[];
  rol_ids: number[];
}

export const UsuarioModel = {
  async findByEmail(email: string): Promise<Usuario | null> {
    const [rows] = await pool.query<Usuario[]>(
      'SELECT id, nombre, email, password, activo, created_at FROM usuarios WHERE email = ?',
      [email],
    );
    return rows[0] ?? null;
  },

  async findById(id: number): Promise<Usuario | null> {
    const [rows] = await pool.query<Usuario[]>(
      'SELECT id, nombre, email, password, activo, created_at FROM usuarios WHERE id = ?',
      [id],
    );
    return rows[0] ?? null;
  },

  async findAllActive(): Promise<UsuarioWithRoles[]> {
    const [rows] = await pool.query<
      (RowDataPacket & { id: number; nombre: string; email: string; activo: boolean; created_at: Date; ultimo_acceso: Date | null; rol_ids: string; rol_nombre: string; tipo_documento: string | null; documento: string | null })[]
    >(`
      SELECT u.id, u.nombre, u.email, u.activo, u.created_at, u.ultimo_acceso,
             u.tipo_documento, u.documento,
             GROUP_CONCAT(r.id ORDER BY r.nivel ASC SEPARATOR ',') AS rol_ids,
             GROUP_CONCAT(r.nombre ORDER BY r.nivel ASC SEPARATOR ', ') AS rol_nombre
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
      LEFT JOIN roles r ON ur.rol_id = r.id
      WHERE u.activo = TRUE
      GROUP BY u.id
      ORDER BY u.nombre
    `);
    return rows.map((r) => {
      const roles = r.rol_nombre ? r.rol_nombre.split(', ') : [];
      return {
        id: r.id,
        nombre: r.nombre,
        email: r.email,
        password: null,
        tipo_documento: r.tipo_documento,
        documento: r.documento,
        activo: r.activo,
        created_at: r.created_at,
        ultimo_acceso: r.ultimo_acceso,
        rol: roles[0] || 'Sin rol',
        rol_ids: r.rol_ids ? r.rol_ids.split(',').map(Number) : [],
        roles,
      };
    });
  },

  async findAll(): Promise<UsuarioWithRoles[]> {
    const [rows] = await pool.query<
      (RowDataPacket & { id: number; nombre: string; email: string; activo: boolean; created_at: Date; ultimo_acceso: Date | null; rol_ids: string; rol_nombre: string; tipo_documento: string | null; documento: string | null })[]
    >(`
      SELECT u.id, u.nombre, u.email, u.activo, u.created_at, u.ultimo_acceso,
             u.tipo_documento, u.documento,
             GROUP_CONCAT(r.id ORDER BY r.nivel ASC SEPARATOR ',') AS rol_ids,
             GROUP_CONCAT(r.nombre ORDER BY r.nivel ASC SEPARATOR ', ') AS rol_nombre
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
      LEFT JOIN roles r ON ur.rol_id = r.id
      GROUP BY u.id
      ORDER BY u.activo DESC, u.nombre ASC
    `);
    return rows.map((r) => {
      const roles = r.rol_nombre ? r.rol_nombre.split(', ') : [];
      return {
        id: r.id,
        nombre: r.nombre,
        email: r.email,
        password: null,
        tipo_documento: r.tipo_documento,
        documento: r.documento,
        activo: r.activo,
        created_at: r.created_at,
        ultimo_acceso: r.ultimo_acceso,
        rol: roles[0] || 'Sin rol',
        rol_ids: r.rol_ids ? r.rol_ids.split(',').map(Number) : [],
        roles,
      };
    });
  },

  async create(nombre: string, email: string): Promise<number> {
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email) VALUES (?, ?)',
      [nombre, email],
    );
    return (result as any).insertId;
  },

  async updatePassword(id: number, hashedPassword: string): Promise<void> {
    await pool.query('UPDATE usuarios SET password = ? WHERE id = ?', [hashedPassword, id]);
  },

  async updateProfile(
    id: number,
    nombre: string | undefined,
    email: string | undefined,
    tipo_documento: string | undefined,
    documento: string | undefined,
  ): Promise<void> {
    await pool.query(
      'UPDATE usuarios SET nombre = COALESCE(?, nombre), email = COALESCE(?, email), tipo_documento = COALESCE(?, tipo_documento), documento = COALESCE(?, documento) WHERE id = ?',
      [nombre ?? null, email ?? null, tipo_documento ?? null, documento ?? null, id],
    );
  },

  async toggleActivo(id: number, activo: boolean): Promise<void> {
    await pool.query('UPDATE usuarios SET activo = ? WHERE id = ?', [activo, id]);
  },

  async emailExists(email: string, excludeId?: number): Promise<boolean> {
    const query = excludeId
      ? 'SELECT 1 FROM usuarios WHERE email = ? AND id != ?'
      : 'SELECT 1 FROM usuarios WHERE email = ?';
    const [rows] = await pool.query(query, excludeId ? [email, excludeId] : [email]);
    return (rows as any[]).length > 0;
  },

  async updateUltimoAcceso(id: number): Promise<void> {
    await pool.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?', [id]);
  },
};
