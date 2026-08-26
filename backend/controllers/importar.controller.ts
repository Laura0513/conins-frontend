import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import { ImportarService } from '../services/importar.service.js';

// POST /api/importar
// Body: { archivo_base64: string }  (.xlsx codificado en base64)
// Responde el resumen por hoja con errores por fila (200 aunque haya errores
// de fila — carga parcial).
export const importar = asyncHandler(async (req: Request, res: Response) => {
  const { archivo_base64 } = req.body ?? {};
  const resultado = await ImportarService.importar(archivo_base64);

  const totalCreados = resultado.resumen.reduce((s, h) => s + h.creados, 0);
  const totalErrores = resultado.resumen.reduce((s, h) => s + h.errores.length, 0);

  ApiResponse.success(
    res,
    resultado,
    `Importacion procesada: ${totalCreados} creados, ${totalErrores} con error`,
  );
});
