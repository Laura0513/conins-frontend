import { z } from 'zod';

export const crearHorarioSchema = z.object({
  ficha_id: z.number().int().positive(),
  instructor_id: z.number().int().positive(),
  competencia_id: z.number().int().positive(),
  ambiente_id: z.number().int().positive().nullable().optional(),
  dia_semana: z.number().int().min(1).max(7),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  hora_fin: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  jornada_id: z.number().int().positive(),
  semana: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
});

export const suspenderHorarioSchema = z.object({
  motivo_suspension: z.string().min(5).max(500),
});
