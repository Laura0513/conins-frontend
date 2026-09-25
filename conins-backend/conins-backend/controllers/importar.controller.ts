import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import { ImportarService } from '../services/importar.service.js';
import { ImportHistoricoModel } from '../models/import-historico.model.js';
import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

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

  // Filas descartadas en el preview (fuera de rango, sin coincidencia en catalogo, ...):
  // se guardan en import_correcciones al previsualizar. Se cuentan aparte de los errores
  // del confirm (RN-04, etc.) para que el historico refleje TODO lo que no se cargo.
  let descartados = 0;
  try {
    const [r] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS n FROM import_correcciones');
    descartados = Number((r as any[])[0]?.n ?? 0);
  } catch { /* si no existe la tabla, se ignora */ }

  // Registrar en el historico de cargas (best-effort: no debe tumbar la respuesta).
  try {
    const u = req.user as any;
    await ImportHistoricoModel.crear({
      usuario_id: u?.id ?? null,
      usuario_nombre: u?.nombre ?? null,
      creados: totalCreados, omitidos: totalOmitidos, errores: totalErrores, descartados,
    });
  } catch (err) {
    console.error('[importar] no se pudo registrar el historico:', err);
  }

  ApiResponse.success(
    res,
    resultado,
    `Importacion procesada: ${totalCreados} creados, ${totalOmitidos} omitidos (ya existian), ${totalErrores} con error`,
  );
});

// GET /api/importar/historico — cargas anteriores (fecha, usuario, resultado)
export const getHistorico = asyncHandler(async (_req: Request, res: Response) => {
  const historico = await ImportHistoricoModel.listar();
  ApiResponse.success(res, historico);
});
