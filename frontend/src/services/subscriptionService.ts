import { apiRequest } from './api';
import type { SubscriptionPlan } from '../types/school';

export interface PlanPricing {
  priceYearly?: number;
}

export const subscriptionService = {
  // Get all available plans with pricing (for super admin)
  getAllPlans: async (): Promise<SubscriptionPlan[]> => {
    return apiRequest<SubscriptionPlan[]>('/super-admin/plans');
  },

  // Get available plans with pricing (for school admin - purchase flow)
  getAvailablePlans: async (): Promise<SubscriptionPlan[]> => {
    return apiRequest<SubscriptionPlan[]>('/schools/available-plans');
  },

  // Super Admin: Update plan pricing
  updatePlanPricing: (planId: number, data: PlanPricing) =>
    apiRequest<SubscriptionPlan>(`/schools/plans/${planId}/pricing`, {
      method: 'PATCH',
      data,
    }),

  // School Admin: Purchase subscription
  purchaseSubscription: (
    schoolId: string,
    data: {
      planId: number;
      feeTerm: string;
      feeTermNumeric: number;
      paymentMode?: string;
      transactionReference?: string;
    }
  ): Promise<{
    type: string;
    schoolId: number;
    planId: number;
    planName: string;
    feeTerm: string;
    originalAmount?: number;
    creditApplied?: number;
    payableAmount?: number;
    remainingDays?: number;
    amount?: number;
    startDate: string;
    endDate: string;
    message?: string;
  }> =>
    apiRequest<any>(`/schools/${schoolId}/purchase-subscription`, {
      method: 'POST',
      data,
    }),

  // School Admin: Calculate upgrade pricing
  calculateUpgrade: (
    schoolId: string,
    data: { planId: number; feeTerm: string }
  ): Promise<{
    originalAmount: number;
    creditApplied: number;
    existingCreditUsed: number;
    totalCreditApplied: number;
    payableAmount: number;
    remainingDays: number;
    newPlanName: string;
    currentPlanName: string;
    feeTerm: string;
    newEndDate: string;
  }> =>
    apiRequest<any>(`/schools/${schoolId}/calculate-upgrade`, {
      method: 'POST',
      data,
    }),

  // Get subscription history
  getSubscriptionHistory: (schoolId: string) =>
    apiRequest<Record<string, unknown>[]>(`/schools/${schoolId}/subscription-history`),
};
