import { z } from 'zod';

export const crearFichaSchema = z.object({
  numero_ficha: z.string().min(1).max(50),
  programa_id:  z.number().int().positive(),
  jornada_id:   z.number().int().positive(),
  ambiente_id:  z.number().int().positive().nullable().optional(),
  etapa:        z.enum(['lectiva', 'productiva']).default('lectiva'),
  fecha_inicio_lectiva:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fecha_fin_lectiva:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fecha_inicio_productiva: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fecha_fin_productiva:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fecha_fin_ficha:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const actualizarFichaSchema = z.object({
  numero_ficha: z.string().min(1).max(50).optional(),
  programa_id:  z.number().int().positive().optional(),
  jornada_id:   z.number().int().positive().optional(),
  ambiente_id:  z.number().int().positive().nullable().optional(),
  etapa:        z.enum(['lectiva', 'productiva']).optional(),
  fecha_inicio_lectiva:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fecha_fin_lectiva:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fecha_inicio_productiva: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fecha_fin_productiva:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fecha_fin_ficha:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
