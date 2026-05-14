import { z } from 'zod';

export const feePaymentSchema = z.object({
  amount: z.string().min(1, 'Payment amount is required'),
  paymentMode: z.enum(['cash', 'online', 'cheque', 'dd', 'card']),
  paymentDate: z.string().min(1, 'Payment date is required'),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const recordPaymentSchema = z.object({
  amountPaid: z.string().min(1, 'Amount is required'),
  paymentMode: z.enum(['cash', 'card', 'upi', 'cheque', 'bank_transfer']),
  paymentDate: z.string().min(1, 'Date is required'),
  receiptNumber: z.string().optional(),
});

export const feeWaiverSchema = z.object({
  waiverAmount: z.string().min(1, 'Waiver amount is required'),
  waiverReason: z.string().min(1, 'Waiver reason is required'),
});

export const feeDueDateSchema = z.object({
  dueDate: z.string().min(1, 'Due date is required'),
});

export const feeStructureSchema = z.object({
  name: z.string().min(1, 'Fee name is required'),
  amount: z.string().min(1, 'Amount is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  classId: z.number().min(1, 'Class is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
});

export type FeePaymentFormData = z.infer<typeof feePaymentSchema>;
export type FeeWaiverFormData = z.infer<typeof feeWaiverSchema>;
export type FeeDueDateFormData = z.infer<typeof feeDueDateSchema>;
export type FeeStructureFormData = z.infer<typeof feeStructureSchema>;
