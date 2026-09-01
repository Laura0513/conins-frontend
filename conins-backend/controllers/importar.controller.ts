import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import { ImportarService } from '../services/importar.service.js';

// POST /api/importar/preview
// Body: { archivo_base64: string, programa_codigo?: string }
// Normaliza el archivo (crudo del lider o template) SIN escribir. Devuelve
// resumen, nuevos (ambientes/instructores), errores, posible_baja y el
// template normalizado en base64 para reenviar a POST /api/importar al confirmar.
export const preview = asyncHandler(async (req: Request, res: Response) => {
  const { archivo_base64, programa_codigo } = req.body ?? {};
  const resultado = await ImportarService.preview(archivo_base64, programa_codigo);
  ApiResponse.success(res, resultado, `Previsualizacion: ${resultado.resumen.horarios} horarios detectados`);
});

// POST /api/importar
// Body: { archivo_base64: string, crear_ambientes?: string[] }  (.xlsx en base64)
// archivo_base64 es el TEMPLATE de 4 hojas (el que devuelve /preview). Responde
// el resumen por hoja con errores por fila (200 aunque haya errores — carga parcial).
export const importar = asyncHandler(async (req: Request, res: Response) => {
  const { archivo_base64, crear_ambientes } = req.body ?? {};
  const resultado = await ImportarService.importar(archivo_base64, { crearAmbientes: crear_ambientes });

  const totalCreados = resultado.resumen.reduce((s, h) => s + h.creados, 0);
  const totalOmitidos = resultado.resumen.reduce((s, h) => s + h.omitidos, 0);
  const totalErrores = resultado.resumen.reduce((s, h) => s + h.errores.length, 0);

  ApiResponse.success(
    res,
    resultado,
    `Importacion procesada: ${totalCreados} creados, ${totalOmitidos} omitidos (ya existian), ${totalErrores} con error`,
  );
});
