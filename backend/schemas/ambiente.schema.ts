import { z } from 'zod';

export const crearAmbienteSchema = z.object({
  nombre:    z.string().min(1).max(60),
  tipo:      z.enum(['aula', 'taller', 'laboratorio']),
  capacidad: z.number().int().min(0).max(65535).nullable().optional(),
  area_id:   z.number().int().positive().nullable().optional(),
  sede_id:   z.number().int().positive().nullable().optional(),
});

export const actualizarAmbienteSchema = z.object({
  nombre:    z.string().min(1).max(60).optional(),
  tipo:      z.enum(['aula', 'taller', 'laboratorio']).optional(),
  capacidad: z.number().int().min(0).max(65535).nullable().optional(),
  area_id:   z.number().int().positive().nullable().optional(),
  sede_id:   z.number().int().positive().nullable().optional(),
  activo:    z.boolean().optional(),
});

export const bloquearAmbienteSchema = z.object({
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  fecha_fin:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  motivo:       z.string().min(1).max(500),
});
