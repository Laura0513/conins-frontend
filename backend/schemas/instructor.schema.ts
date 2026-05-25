import { z } from 'zod';

export const crearInstructorSchema = z.object({
  usuario_id: z.number().int().positive(),
  tipo_contrato: z.enum(['contratista', 'de_planta']),
  tipo_area: z.enum(['tecnica', 'transversal']),
});

export const actualizarInstructorSchema = z.object({
  tipo_contrato: z.enum(['contratista', 'de_planta']).optional(),
  tipo_area: z.enum(['tecnica', 'transversal']).optional(),
});

export const registrarNovedadSchema = z.object({
  tipo_novedad: z.enum(['licencia', 'incapacidad', 'comision', 'otro']),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  fecha_regreso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  observacion: z.string().max(500).optional(),
});

export const actualizarCompetenciasSchema = z.object({
  competencia_ids: z.array(z.number().int().positive()),
});
