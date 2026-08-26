import { z } from 'zod';

export const crearSedeSchema = z.object({
  nombre:       z.string().min(1).max(100),
  direccion:    z.string().max(200).nullable().optional(),
  es_principal: z.boolean().optional(),
});

export const actualizarSedeSchema = z.object({
  nombre:       z.string().min(1).max(100).optional(),
  direccion:    z.string().max(200).nullable().optional(),
  es_principal: z.boolean().optional(),
  activo:       z.boolean().optional(),
});
