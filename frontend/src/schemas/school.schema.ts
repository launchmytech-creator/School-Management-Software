import { z } from 'zod';

export const createSchoolSchema = z.object({
  name: z.string().min(1, 'School name is required'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(1, 'Pincode is required'),
  board: z.string().min(1, 'Board is required'),
  adminName: z.string().min(1, 'Admin name is required'),
  adminEmail: z.string().min(1, 'Admin email is required').email('Please enter a valid email'),
  adminPassword: z.string().min(6, 'Admin password must be at least 6 characters'),
  adminPhone: z.string().min(1, 'Admin phone is required'),
  subscriptionPlan: z.string().min(1, 'Subscription plan is required'),
});

export const schoolInfoSchema = createSchoolSchema.pick({
  name: true,
  email: true,
  phone: true,
  address: true,
  city: true,
  state: true,
  pincode: true,
  board: true,
});

export const adminInfoSchema = createSchoolSchema.pick({
  adminName: true,
  adminEmail: true,
  adminPassword: true,
  adminPhone: true,
});

export const subscriptionSchema = createSchoolSchema.pick({
  subscriptionPlan: true,
});

export type CreateSchoolFormData = z.infer<typeof createSchoolSchema>;
export type SchoolInfoFormData = z.infer<typeof schoolInfoSchema>;
export type AdminInfoFormData = z.infer<typeof adminInfoSchema>;
export type SubscriptionFormData = z.infer<typeof subscriptionSchema>;
