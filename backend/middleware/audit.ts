import { Request, Response, NextFunction } from 'express';
import pool from '../config/db.js';

export const auditLogger = async (req: Request, _res: Response, next: NextFunction) => {
  const userId = (req as any).user?.id ?? null;
  const ip = req.ip ?? req.socket.remoteAddress ?? null;
  const userAgent = req.headers['user-agent'] ?? null;

  try {
    await pool.query(
      `SET @audit_usuario_id = ?`,
      [userId],
    );

    await pool.query(
      `INSERT INTO auditoria (usuario_id, accion, tabla_afectada, ip, user_agent)
       VALUES (?, 'API_CALL', ?, ?, ?)`,
      [userId, `${req.method} ${req.path}`, ip, userAgent],
    );
  } catch {
    // Silently fail — audit should never block a request
  }

  next();
};
