import { z } from 'zod';

export const crearAsignacionSchema = z.object({
  instructor_id: z.number().int().positive(),
  ficha_id: z.number().int().positive(),
  jornada_id: z.number().int().positive().nullable().optional(), // 28/07: jornada preferente
  es_lider_ficha: z.boolean().default(false),
  es_provisional: z.boolean().default(false),
  competencia_ids: z.array(z.number().int().positive()).min(1),
});

export const asignarCompetenciaSchema = z.object({
  competencia_id: z.number().int().positive(),
  ambiente_excepcion_id: z.number().int().positive().nullable().optional(),
  observacion: z.string().max(500).optional(),
});

export const registrarProvisionalSchema = z.object({
  instructor_id: z.number().int().positive(),
  ficha_id: z.number().int().positive(),
  autorizado_por_id: z.number().int().positive(),
  fecha_autorizacion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  motivo_provisional: z.string().min(10).max(500),
  competencia_ids: z.array(z.number().int().positive()).min(1),
});
