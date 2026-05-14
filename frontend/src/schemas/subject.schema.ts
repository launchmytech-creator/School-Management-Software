import { z } from "zod";

export const createChapterSchema = z.object({
  name: z.string().min(1, "Chapter name is required"),
  sequenceNumber: z.number().optional(),
});

export type CreateChapterFormData = z.infer<typeof createChapterSchema>;
