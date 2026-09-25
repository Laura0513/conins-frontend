import { z } from 'zod';

export const crearHorarioSchema = z.object({
  // Horario normal: ficha_id + competencia_id. Formacion complementaria: es_complementaria
  // + programa_id + modalidad (sin grupo ni competencia). Ver refine al final.
  ficha_id:          z.number().int().positive().optional(),
  instructor_id:     z.number().int().positive(),
  competencia_id:    z.number().int().positive().optional(),
  rap_id:            z.number().int().positive().nullable().optional(), // RF-34 (RN-27)
  ambiente_id:       z.number().int().positive().nullable().optional(),
  dia_semana:        z.number().int().min(1).max(7),
  hora_inicio:       z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  hora_fin:          z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  tipo_actividad_id: z.number().int().positive().nullable().optional(),
  jornada_id:        z.number().int().positive(),
  // semana: obligatoria en horario normal; en complementaria se deriva de fecha_inicio
  // (ver refine al final), por eso aqui es opcional.
  semana:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD').optional(),
  // Formacion complementaria (RF feedback 16/09; fechas 22/09)
  es_complementaria: z.boolean().optional(),
  programa_id:       z.number().int().positive().nullable().optional(),
  modalidad:         z.enum(['presencial', 'virtual']).nullable().optional(),
  observaciones:     z.string().max(500).nullable().optional(),
  fecha_inicio:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD').optional(),
  fecha_fin:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD').nullable().optional(),
}).refine(
  (d) => d.es_complementaria ? Boolean(d.programa_id && d.modalidad) : Boolean(d.ficha_id && d.competencia_id),
  { message: 'Complementaria requiere programa y modalidad; un horario normal requiere grupo y competencia' },
).refine(
  // La complementaria requiere fecha_inicio (evento o rango).
  (d) => d.es_complementaria ? Boolean(d.fecha_inicio) : true,
  { message: 'La formacion complementaria requiere fecha de inicio', path: ['fecha_inicio'] },
).refine(
  // Si hay rango, el fin no puede ser anterior al inicio.
  (d) => !(d.fecha_inicio && d.fecha_fin) || d.fecha_fin >= d.fecha_inicio,
  { message: 'La fecha de fin no puede ser anterior a la fecha de inicio', path: ['fecha_fin'] },
).refine(
  // El horario normal requiere semana; la complementaria la deriva de fecha_inicio.
  (d) => d.es_complementaria ? true : Boolean(d.semana),
  { message: 'El horario normal requiere la semana (lunes YYYY-MM-DD)', path: ['semana'] },
);

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
