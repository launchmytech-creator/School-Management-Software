import { z } from 'zod';

const baseSchoolFields = {
  name: z.string().min(3, 'Min 3 characters'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  subscriptionStatus: z.enum(['trial', 'active', 'suspended', 'expired']),
  subscriptionEndDate: z.string().min(1, 'End date is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
};

const adminFields = {
  adminFullName: z.string().min(3, 'Min 3 characters'),
  adminEmail: z.string().min(1, 'Email is required').email('Invalid email'),
  adminPassword: z.string().min(8, 'Min 8 characters'),
  adminPhone: z.string().min(1, 'Phone is required'),
};

export const createSchoolSchema = z.object({
  ...baseSchoolFields,
  ...adminFields,
  code: z.string().min(2, 'Min 2 characters'),
});

export const editSchoolSchema = z.object({
  ...baseSchoolFields,
  adminFullName: z.string().optional(),
  adminEmail: z.string().optional(),
  adminPassword: z.string().optional(),
  adminPhone: z.string().optional(),
});

export const createSchoolFormSchema = z.discriminatedUnion('isEditMode', [
  createSchoolSchema.extend({ isEditMode: z.literal(false) }),
  editSchoolSchema.extend({ isEditMode: z.literal(true) }),
]);

export type CreateSchoolFormData = z.infer<typeof createSchoolFormSchema>;
