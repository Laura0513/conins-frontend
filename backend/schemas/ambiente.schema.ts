import { z } from 'zod';

export const registrarBloqueoSchema = z.object({
  ambiente_id: z.number().int().positive(),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  motivo: z.string().min(5).max(500),
});
