import { z } from 'zod';

export const projectRowSchema = z.object({
  po_number: z.string().min(1, 'po_number is required'),
  project_name: z.string().nullable().optional(),
  client: z.string().nullable().optional(),
  vertical: z.string().nullable().optional(),
  po_value: z.number().nullable().optional(),
  start_date: z.string().nullable().optional(), // ISO date string
  end_date: z.string().nullable().optional(),
  gm_target_pct: z.number().nullable().optional(),
});

export type ProjectRowInput = z.infer<typeof projectRowSchema>;
