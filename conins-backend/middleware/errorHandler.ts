import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import fs from 'fs';
import path from 'path';

export const errorHandler = (
  err: Error & { errno?: number; sqlState?: string; sqlMessage?: string },
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const logMsg = `[${new Date().toISOString()}] ${err.name}: ${err.message}\n${err.stack}\n---\n`;
  // Async: no bloquear el event loop en el camino de error.
  fs.promises
    .appendFile(path.join(process.cwd(), 'error.log'), logMsg)
    .catch(() => { /* logging best-effort */ });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Errores SIGNAL de triggers MySQL (SQLSTATE 45000 / errno 1644): reglas de
  // negocio defendidas en BD (p.ej. RN-04 solapamiento). Se traducen a 409 con
  // el MESSAGE_TEXT del trigger, en vez de un 500 generico.
  if (err.errno === 1644 || err.sqlState === '45000') {
    return res.status(409).json({
      success: false,
      message: err.sqlMessage || err.message || 'Conflicto de regla de negocio',
    });
  }

  console.error('[ERROR]', err);

  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
  });
};
