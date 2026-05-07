import { z } from 'zod';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
] as const;

export const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'] as const;

export const uploadFileSchema = z
  .instanceof(File)
  .refine((f) => f.size <= MAX_FILE_SIZE_BYTES, {
    message: 'File size must not exceed 10MB',
  })
  .refine(
    (f) => (ALLOWED_MIME_TYPES as readonly string[]).includes(f.type),
    { message: 'Only Excel files (.xlsx, .xls) are allowed' }
  )
  .refine(
    (f) => {
      const ext = `.${f.name.split('.').pop()?.toLowerCase()}`;
      return (ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
    },
    { message: 'File extension must be .xlsx or .xls' }
  );

export type UploadFileInput = z.infer<typeof uploadFileSchema>;

// MIME type narrowing
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];
