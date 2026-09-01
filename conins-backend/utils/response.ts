import { Response } from 'express';

export class ApiResponse {
  static success(res: Response, data: unknown, message = 'OK') {
    return res.json({ success: true, message, data });
  }

  static created(res: Response, data: unknown, message = 'Recurso creado') {
    return res.status(201).json({ success: true, message, data });
  }

  static error(res: Response, statusCode: number, message: string) {
    return res.status(statusCode).json({ success: false, message });
  }

  static paginated(
    res: Response,
    data: unknown[],
    page: number,
    limit: number,
    total: number,
  ) {
    return res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
}
