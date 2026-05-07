import { z } from 'zod';

export const employeeRowSchema = z.object({
  emp_id: z.string().min(1, 'emp_id is required'),
  name: z.string().min(1, 'name is required'),
  department: z.string().min(1, 'department is required'),
  designation: z.string().nullable().optional(),
  annual_ctc: z.number().nullable().optional(),
  monthly_ctc: z.number().nullable().optional(),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

export type EmployeeRowInput = z.infer<typeof employeeRowSchema>;
