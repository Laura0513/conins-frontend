import { z } from 'zod';

// PATCH /api/programas/:id/referente (RF-24)
export const setReferenteSchema = z.object({
  referente_id: z.number().int().positive().nullable(),
});
