import { z } from 'zod';

export const crearCompetenciaSchema = z.object({
  codigo:      z.string().min(1).max(30),
  nombre:      z.string().min(1).max(200),
  programa_id: z.number().int().positive(),
});

export const actualizarCompetenciaSchema = z.object({
  codigo:      z.string().min(1).max(30).optional(),
  nombre:      z.string().min(1).max(200).optional(),
  programa_id: z.number().int().positive().optional(),
});

export const crearRapSchema = z.object({
  codigo:      z.string().min(1).max(30),
  descripcion: z.string().min(1).max(255),
});

export const actualizarRapSchema = z.object({
  codigo:      z.string().min(1).max(30).optional(),
  descripcion: z.string().min(1).max(255).optional(),
});
