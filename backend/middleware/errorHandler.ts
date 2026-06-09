import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import fs from 'fs';
import path from 'path';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const logMsg = `[${new Date().toISOString()}] ${err.name}: ${err.message}\n${err.stack}\n---\n`;
  fs.appendFileSync(path.join(process.cwd(), 'error.log'), logMsg);
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  console.error('[ERROR]', err);

  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
  });
};
