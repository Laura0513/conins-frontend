import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email invalido').max(100),
  password: z.string().min(6, 'Minimo 6 caracteres'),
});

export const crearPasswordSchema = z.object({
  email: z.string().email('Email invalido').max(100),
  nueva_password: z.string().min(6, 'Minimo 6 caracteres'),
  confirmar_password: z.string(),
}).refine((data) => data.nueva_password === data.confirmar_password, {
  message: 'Las contrasenas no coinciden',
  path: ['confirmar_password'],
});

export const registerSchema = z.object({
  email: z.string().email('Email invalido').max(100),
  password: z.string().min(6, 'Minimo 6 caracteres'),
  tipo_contrato: z.enum(['contratista', 'de_planta']).optional(),
  tipo_area: z.enum(['tecnica', 'transversal']).optional(),
});

export const changePasswordSchema = z.object({
  contrasena_actual: z.string().min(1, 'Requerido'),
  nueva_contrasena: z.string().min(6, 'Minimo 6 caracteres'),
});

export const updateUserSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  email: z.string().email('Email invalido').max(100).optional(),
  rol_ids: z.array(z.number().int().positive()).optional(),
  tipo_contrato: z.enum(['contratista', 'de_planta']).optional(),
  tipo_area: z.enum(['tecnica', 'transversal']).optional(),
  tipo_documento: z.enum(['cc', 'ce', 'ti', 'pasaporte']).optional(),
  documento: z.string().max(20).optional(),
});

export const toggleEstadoSchema = z.object({
  activo: z.boolean(),
});
