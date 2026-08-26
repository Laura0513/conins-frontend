import { z } from 'zod';

export const crearInstructorSchema = z.object({
  usuario_id: z.number().int().positive(),
  tipo_area: z.enum(['tecnica', 'transversal']),
});

export const crearInstructorCompletoSchema = z.object({
  nombre: z.string().min(2).max(100),
  email: z.string().email().max(100),
  tipo_area: z.enum(['tecnica', 'transversal']),
});

export const actualizarInstructorSchema = z.object({
  tipo_area: z.enum(['tecnica', 'transversal']).optional(),
});

export const registrarNovedadSchema = z.object({
  tipo_novedad_id: z.number().int().positive(),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  fecha_regreso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  observacion: z.string().max(500).optional(),
});

export const actualizarCompetenciasSchema = z.object({
  competencia_ids: z.array(z.number().int().positive()),
});

// POST /:id/competencias — habilitar una competencia
export const addCompetenciaSchema = z.object({
  competencia_id: z.number().int().positive(),
});

// POST /:id/baja — registrar baja del instructor (24/07)
export const bajaInstructorSchema = z.object({
  fecha_salida:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  motivo:        z.string().max(500).optional(),
  fecha_ingreso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD').optional(),
});
