import { z } from 'zod';

export const crearHorarioSchema = z.object({
  ficha_id:          z.number().int().positive(),
  instructor_id:     z.number().int().positive(),
  competencia_id:    z.number().int().positive(),
  rap_id:            z.number().int().positive().nullable().optional(), // RF-34 (RN-27)
  ambiente_id:       z.number().int().positive().nullable().optional(),
  dia_semana:        z.number().int().min(1).max(7),
  hora_inicio:       z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  hora_fin:          z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  tipo_actividad_id: z.number().int().positive().nullable().optional(),
  jornada_id:        z.number().int().positive(),
  semana:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
});

export const actualizarHorarioSchema = z.object({
  dia_semana:        z.number().int().min(1).max(7).optional(),
  hora_inicio:       z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').optional(),
  hora_fin:          z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').optional(),
  competencia_id:    z.number().int().positive().optional(),
  rap_id:            z.number().int().positive().nullable().optional(),
  ambiente_id:       z.number().int().positive().nullable().optional(),
  tipo_actividad_id: z.number().int().positive().nullable().optional(),
});

// PATCH /:id/estado (toggle) — motivo opcional (se guarda como motivo_suspension)
export const estadoHorarioSchema = z.object({
  motivo: z.string().max(500).optional(),
});

// PATCH /:id/rechazar y /:id/suspender — motivo obligatorio
export const motivoHorarioSchema = z.object({
  motivo: z.string().min(3).max(500),
});

// PUT /:id — edicion multi-dia
export const multiDiaHorarioSchema = z.object({
  dia_ids:     z.array(z.number().int().min(1).max(7)).min(1),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  hora_fin:    z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  jornada_id:  z.number().int().positive(),
  ambiente_id: z.number().int().positive().nullable().optional(),
});

// (Legacy, sin uso desde que Leidy quito la aprobacion — se conserva)
export const suspenderHorarioSchema = z.object({
  motivo_suspension: z.string().min(5).max(500),
});
