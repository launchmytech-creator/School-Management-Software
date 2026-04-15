import { z } from 'zod';

export const createChapterSchema = z.object({
  name: z.string().min(1, 'Chapter name is required'),
  sequenceNumber: z.string().optional(),
});

export type CreateChapterFormData = z.infer<typeof createChapterSchema>;
