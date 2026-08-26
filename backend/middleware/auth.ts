import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { RoleKey, ROLES } from '../constants/roles.js';
import { auditStore } from '../config/audit-context.js';

interface JwtPayload {
  id: number;
  nombre: string;
  roles_globales: RoleKey[];
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}

export const verifyToken = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token no proporcionado');
  }

  const token = header.split(' ')[1];
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET no configurado');

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    // Atribucion de auditoria: id > 0 = usuario real. El super-admin virtual
    // (id 0) se registra como accion del sistema (NULL).
    const store = auditStore.getStore();
    if (store) store.usuarioId = decoded.id && decoded.id > 0 ? decoded.id : null;
    next();
  } catch {
    throw new UnauthorizedError('Token invalido o expirado');
  }
};

export const requireRole = (rolesPermitidos: RoleKey[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const userRoles = req.user?.roles_globales ?? [];
    // Super-usuario del sistema (Administrador): control total, pasa cualquier check.
    if (userRoles.includes(ROLES.ADMINISTRADOR)) return next();
    const tiene = rolesPermitidos.some((r) => userRoles.includes(r));
    if (!tiene) {
      throw new ForbiddenError('Acceso denegado — rol insuficiente');
    }
    next();
  };
};
