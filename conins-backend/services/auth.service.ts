import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { UsuarioModel } from '../models/usuario.model.js';
import { RolModel } from '../models/rol.model.js';
import { InstructorModel } from '../models/instructor.model.js';
import {
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  NotFoundError,
} from '../utils/errors.js';

const BCRYPT_ROUNDS = 10;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function checkLoginAttempt(email: string): void {
  const attempt = loginAttempts.get(email);
  if (!attempt) return;

  if (Date.now() < attempt.lockedUntil) {
    throw new ForbiddenError('Demasiados intentos fallidos — intente mas tarde');
  }

  loginAttempts.delete(email);
}

function recordFailedAttempt(email: string): void {
  const attempt = loginAttempts.get(email) ?? { count: 0, lockedUntil: 0 };
  attempt.count += 1;

  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    attempt.lockedUntil = Date.now() + LOCKOUT_WINDOW_MS;
  }

  loginAttempts.set(email, attempt);
}

function recordSuccessfulLogin(email: string): void {
  loginAttempts.delete(email);
}

export const AuthService = {
  async login(email: string, password: string) {
    checkLoginAttempt(email);

    // El Administrador es ahora un usuario REAL de la BD (rol Administrador).
    // Login normal (BD) primero; el super usuario del .env queda solo como
    // acceso de EMERGENCIA (break-glass) y se activa unicamente si NO existe un
    // usuario con ese correo — asi el usuario real siempre tiene prioridad.
    const user = await UsuarioModel.findByEmail(email);
    if (!user) {
      const superUser = process.env.SUPER_USER;
      const superPassword = process.env.SUPER_USER_PASSWORD;
      if (superUser && superPassword && email === superUser) {
        if (password !== superPassword) {
          recordFailedAttempt(email);
          throw new UnauthorizedError('Credenciales invalidas');
        }
        recordSuccessfulLogin(email);
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET no configurado');
        const expiresIn = (process.env.JWT_EXPIRES_IN || '24h') as jwt.SignOptions['expiresIn'];
        const token = jwt.sign(
          { id: 0, nombre: 'Administrador', roles_globales: ['Administrador'] },
          secret,
          { expiresIn },
        );
        return {
          token,
          user: { id: 0, nombre: 'Administrador', email: superUser, roles: ['Administrador'] },
        };
      }
      recordFailedAttempt(email);
      throw new UnauthorizedError('Credenciales invalidas');
    }

    if (!user.activo) {
      throw new ForbiddenError('Cuenta deshabilitada');
    }

    if (user.password === null) {
      throw new ForbiddenError('Cuenta sin activar. Cree su contrasena primero.');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      recordFailedAttempt(email);
      throw new UnauthorizedError('Credenciales invalidas');
    }

    recordSuccessfulLogin(email);

    await UsuarioModel.updateUltimoAcceso(user.id);

    const roles = await RolModel.findByUsuarioId(user.id);

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET no configurado');

    const expiresIn = (process.env.JWT_EXPIRES_IN || '24h') as jwt.SignOptions['expiresIn'];

    const token = jwt.sign(
      {
        id: user.id,
        nombre: user.nombre,
        roles_globales: roles,
      },
      secret,
      { expiresIn },
    );

    return {
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        roles,
      },
    };
  },

  async crearPassword(email: string, nuevaPassword: string) {
    const user = await UsuarioModel.findByEmail(email);
    if (!user) {
      throw new ForbiddenError('Correo no registrado en el sistema');
    }

    if (!user.activo) {
      throw new ForbiddenError('Cuenta deshabilitada');
    }

    if (user.password !== null) {
      throw new ConflictError('Este usuario ya tiene contrasena');
    }

    const hashed = await bcrypt.hash(nuevaPassword, BCRYPT_ROUNDS);
    await UsuarioModel.updatePassword(user.id, hashed);
  },

  async changePassword(userId: number, contrasenaActual: string, nuevaContrasena: string) {
    const user = await UsuarioModel.findById(userId);
    if (!user) throw new NotFoundError('Usuario no encontrado');

    if (user.password === null) {
      throw new UnauthorizedError('No tiene contrasena configurada');
    }

    const isValid = await bcrypt.compare(contrasenaActual, user.password);
    if (!isValid) {
      throw new UnauthorizedError('La contrasena actual es incorrecta');
    }

    const hashed = await bcrypt.hash(nuevaContrasena, BCRYPT_ROUNDS);
    await UsuarioModel.updatePassword(userId, hashed);
  },

  async getOwnProfile(userId: number) {
    // id: 0 = super admin virtual (no existe en tabla usuarios)
    if (userId === 0) {
      return {
        id: 0,
        nombre: 'Administrador',
        email: process.env.SUPER_USER ?? 'admin@conins.sena',
        activo: true,
        roles: ['Administrador'],
      };
    }

    const user = await UsuarioModel.findById(userId);
    if (!user) throw new NotFoundError('Usuario no encontrado');

    const roles = await RolModel.findByUsuarioId(userId);

    return {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      activo: user.activo,
      roles,
    };
  },

  async updateOwnProfile(userId: number, nombre?: string, email?: string) {
    if (email) {
      const emailExists = await UsuarioModel.emailExists(email, userId);
      if (emailExists) {
        throw new ConflictError('El correo ya esta en uso por otro usuario');
      }
    }

    await UsuarioModel.updateProfile(userId, nombre, email, undefined, undefined);
  },

  async getAllUsers() {
    return UsuarioModel.findAll();
  },

  async getActiveUsers() {
    return UsuarioModel.findAllActive();
  },

  async updateUser(
    targetUserId: number,
    actingUserId: number,
    actingRoles: string[],
    nombre?: string,
    email?: string,
    rol_ids?: number[],
    tipo_area?: string,
    tipo_documento?: string,
    documento?: string,
  ) {
    if (email) {
      const emailExists = await UsuarioModel.emailExists(email, targetUserId);
      if (emailExists) {
        throw new ConflictError('El correo ya esta en uso por otro usuario');
      }
    }

    if (nombre || email || tipo_documento || documento) {
      await UsuarioModel.updateProfile(targetUserId, nombre, email, tipo_documento, documento);
    }

    if (rol_ids && rol_ids.length > 0) {
      const rolesExist = await RolModel.validateRolesExist(rol_ids);
      if (!rolesExist) {
        throw new ValidationError('Uno o mas rol_ids no existen en el sistema');
      }

      if (!actingRoles.includes('Subdirector') && !actingRoles.includes('Administrador') && rol_ids.includes(1)) {
        throw new ForbiddenError('Solo un Subdirector o Administrador puede asignar el rol de Subdirector');
      }

      await RolModel.assignRoles(targetUserId, rol_ids);

      if (rol_ids.includes(4)) {  // ID 4 = Instructor (era 5 antes del 01/07/2026)
        const instructorExists = await InstructorModel.findByUsuarioId(targetUserId);
        if (!instructorExists) {
          await InstructorModel.create(
            targetUserId,
            tipo_area ?? 'tecnica',
          );
        }
      } else {
        const hasActiveCompetencias = await InstructorModel.hasActiveCompetencias(targetUserId);
        if (hasActiveCompetencias) {
          throw new ValidationError(
            'No se puede remover el rol Instructor: el usuario tiene asignaciones de competencias activas',
          );
        }
        await InstructorModel.deleteByUsuarioId(targetUserId);
      }
    }
  },

  async toggleUserEstado(userId: number) {
    const user = await UsuarioModel.findById(userId);
    if (!user) throw new NotFoundError('Usuario no encontrado');

    const nuevoEstado = !user.activo;
    await UsuarioModel.toggleActivo(userId, nuevoEstado);

    return { activo: nuevoEstado };
  },

  async assignProgramasToLider(userId: number, programaIds: number[]) {
    const user = await UsuarioModel.findById(userId);
    if (!user) throw new NotFoundError('Usuario no encontrado');

    // 01/07/2026: lider_programa ya no es un rol del sistema; la asignación
    // de programas líderes se maneja solo via la tabla lider_programa.
    // Se valida que el usuario sea instructor en lugar de verificar el rol.
    const instructor = await InstructorModel.findByUsuarioId(userId);
    if (!instructor) throw new NotFoundError('El usuario no tiene perfil de instructor');

    await pool.query('DELETE FROM lider_programa WHERE instructor_id = ?', [instructor.id]);

    for (const programaId of programaIds) {
      await pool.query(
        'INSERT INTO lider_programa (instructor_id, programa_id) VALUES (?, ?)',
        [instructor.id, programaId],
      );
    }
  },

  async solicitarRecuperacion(email: string) {
    const user = await UsuarioModel.findByEmail(email);
    // Siempre responde OK para no revelar si el email existe
    if (!user || !user.activo) return;

    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    const expiraStr = expira.toISOString().slice(0, 19).replace('T', ' ');

    // Invalidar tokens anteriores del usuario
    await pool.query(
      'UPDATE password_reset_tokens SET usado = TRUE WHERE usuario_id = ? AND usado = FALSE',
      [user.id],
    );

    await pool.query(
      'INSERT INTO password_reset_tokens (usuario_id, token, expira_en) VALUES (?, ?, ?)',
      [user.id, token, expiraStr],
    );

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const link = `${frontendUrl}/reset-password?token=${token}`;

    // Envio de correo condicional (solo si SMTP configurado)
    try {
      const transporter = (await import('../config/mail.js')).default;
      if (transporter) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
          to: email,
          subject: 'CONINS — Recuperacion de contrasena',
          html: `
            <p>Hola ${user.nombre},</p>
            <p>Recibimos una solicitud para restablecer tu contrasena en CONINS.</p>
            <p><a href="${link}">Haz clic aqui para restablecer tu contrasena</a></p>
            <p>Este enlace expira en 1 hora.</p>
            <p>Si no solicitaste esto, ignora este correo.</p>
          `,
        });
      }
    } catch (_err) {
      // Si SMTP falla no rompemos el flujo — el admin puede compartir el token manualmente
    }

    return { token }; // Solo en dev/log; en produccion no devolver el token
  },

  async resetearContrasena(token: string, nuevaContrasena: string) {
    const [rows] = await pool.query(
      `SELECT prt.id, prt.usuario_id, prt.expira_en, prt.usado
       FROM password_reset_tokens prt
       WHERE prt.token = ? LIMIT 1`,
      [token],
    );
    const record = (rows as any[])[0];

    if (!record) throw new NotFoundError('Token invalido');
    if (record.usado) throw new ConflictError('El token ya fue utilizado');
    if (new Date(record.expira_en) < new Date()) throw new ValidationError('El token ha expirado');

    const hashed = await bcrypt.hash(nuevaContrasena, BCRYPT_ROUNDS);
    await UsuarioModel.updatePassword(record.usuario_id, hashed);

    await pool.query(
      'UPDATE password_reset_tokens SET usado = TRUE WHERE id = ?',
      [record.id],
    );
  },
};
