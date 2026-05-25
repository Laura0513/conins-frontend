import { Request, Response, NextFunction } from 'express';

export const auditLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = req.user?.id ?? 'anon';
    const timestamp = new Date().toISOString();
    console.log(
      `[AUDIT] ${timestamp} | user:${userId} | ${req.method} ${req.originalUrl} | ${req.ip} | ${res.statusCode} | ${duration}ms`,
    );
  });

  next();
};
