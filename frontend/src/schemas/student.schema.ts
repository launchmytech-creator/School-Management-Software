import { z } from 'zod';

export const newParentSchema = z.object({
  parentName: z.string().min(1, 'Parent name is required'),
  parentEmail: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  parentPhone: z.string().min(1, 'Phone number is required'),
  parentPassword: z.string().min(6, 'Password must be at least 6 characters'),
  parentAddress: z.string().min(1, 'Address is required'),
  relationship: z.string().min(1, 'Relationship is required'),
});

export const studentSchema = z.object({
  fullName: z.string().min(1, 'Student name is required'),
  admissionNumber: z.string().min(1, 'Admission number is required'),
  classId: z.number().min(1, 'Class is required'),
  academicYearId: z.number().min(1, 'Academic year is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  bloodGroup: z.string().optional(),
  aadharNumber: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  parentId: z.number().optional(),
  parentName: z.string().optional(),
  parentEmail: z.string().optional(),
  parentPhone: z.string().optional(),
  parentPassword: z.string().optional(),
  parentAddress: z.string().optional(),
  relationship: z.string().optional(),
});

export type NewParentFormData = z.infer<typeof newParentSchema>;
export type StudentFormData = z.infer<typeof studentSchema>;
