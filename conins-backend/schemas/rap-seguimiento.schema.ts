import { z } from 'zod';

export const crearRapSeguimientoSchema = z.object({
  asignacion_competencia_id: z.number().int().positive(),
  rap_id: z.number().int().positive(),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD').nullable().optional(),
  fecha_fin_programada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD').nullable().optional(),
});

export const actualizarRapSeguimientoSchema = z.object({
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD').nullable().optional(),
  fecha_fin_programada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD').nullable().optional(),
  estado_evaluacion: z.enum(['pendiente_por_evaluar', 'evaluado']).optional(),
  estado_aprobacion: z.enum(['aprobado', 'no_aprobado']).nullable().optional(),
});

export const evaluarRapSchema = z.object({
  estado_aprobacion: z.enum(['aprobado', 'no_aprobado']),
});
