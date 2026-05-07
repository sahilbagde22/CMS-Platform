import { z } from 'zod';

export const deploymentRowSchema = z.object({
  emp_id: z.string().min(1, 'emp_id is required'),
  po_number: z.string().min(1, 'po_number is required'),
  deployment_start: z.string().nullable().optional(), // ISO date string
  deployment_end: z.string().nullable().optional(),   // null = ongoing
  revenue: z.number().nullable().optional(),
  proprietary_charges: z.number().nullable().optional(),
  blended_revenue_multiplier: z.number().nullable().optional(),
});

export type DeploymentRowInput = z.infer<typeof deploymentRowSchema>;
