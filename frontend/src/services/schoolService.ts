import { apiRequest } from './api';
import type { School, CreateSchoolRequest, SubscriptionTier, SchoolUpdateData, SchoolAdmin, UpdateSchoolAdminData, SubscriptionPlan, PlanChangeRequest } from '../types/school';
import { getCurrentAcademicYear } from '../lib/utils';

const VALID_SUBSCRIPTION_PLANS: SubscriptionTier[] = ['BASIC', 'PREMIUM', 'BUSINESS'];

const mapFeeTerms = (terms: number | string | undefined): School['feeTerm'] => {
  if (typeof terms === 'string') {
    const upper = terms.toUpperCase();
    if (['YEARLY', 'HALF-YEARLY', 'QUARTERLY', 'MONTHLY'].includes(upper)) {
      return upper as School['feeTerm'];
    }
  }
  switch (terms) {
    case 1: return 'YEARLY';
    case 2: return 'HALF-YEARLY';
    case 4: return 'QUARTERLY';
    case 12: return 'MONTHLY';
    default: return 'YEARLY';
  }
};

const normalizePlan = (plan: string | undefined): SubscriptionTier => {
  if (!plan) return 'BASIC';
  const upper = plan.toUpperCase() as SubscriptionTier;
  return VALID_SUBSCRIPTION_PLANS.includes(upper) ? upper : 'BASIC';
};

const normalizeSchool = (data: Record<string, unknown>): School => ({
  id: (data.id as string | number)?.toString() || '',
  code: (data.code as string) || '',
  name: (data.name as string) || '',
  address: (data.address as string) || '',
  phone: (data.phone as string) || (data.contact_phone as string) || '',
  email: (data.email as string) || (data.contact_email as string) || '',
  academicYear: (data.academicYear as string) || (data.academic_year as string) || getCurrentAcademicYear(),
  logo: (data.logo as string) || '',
  plan: normalizePlan((data.plan as string) || (data.subscription_plan_name as string)),
  feeTerm: mapFeeTerms(data.feeTerm as string | undefined || (data.fee_terms as number | undefined)),
  subscriptionStatus: (data.subscriptionStatus as string) || (data.subscription_status as string) || 'active',
  status: data.status !== undefined ? Boolean(data.status) : Boolean(data.is_active),
  createdAt: (data.createdAt as string) || (data.created_at as string) || new Date().toISOString(),
  teacherCount: Number(data.teacher_count) || 0,
  studentCount: Number(data.student_count) || 0,
});

export const schoolService = {
  getSchools: async (params: { page?: number; limit?: number; search?: string; plan?: string; status?: string } = {}): Promise<School[]> => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const data = await apiRequest<Record<string, unknown>[]>(`/schools?${query}`);
    return data.map(normalizeSchool);
  },

  createSchool: (data: CreateSchoolRequest): Promise<School> => apiRequest<School>('/schools', {
    method: 'POST',
    data,
  }),

  toggleSchoolStatus: (id: string, status: boolean): Promise<School> => apiRequest<School>(`/schools/${id}`, {
    method: 'PATCH',
    data: { isActive: status },
  }),

  updateSchool: (id: string, data: SchoolUpdateData): Promise<School> => apiRequest<School>(`/schools/${id}`, {
    method: 'PATCH',
    data,
  }),

  getSchoolAdmin: async (schoolId: string): Promise<SchoolAdmin> => {
    const data = await apiRequest<Record<string, unknown>>(`/schools/${schoolId}/admin`);
    return {
      id: data.id as number,
      email: data.email as string,
      fullName: data.full_name as string,
      phone: data.phone as string,
      role: data.role as string,
      schoolId: data.school_id as number,
      isActive: data.is_active as boolean,
      createdAt: data.created_at as string,
    };
  },

  updateSchoolAdmin: (schoolId: string, data: UpdateSchoolAdminData): Promise<SchoolAdmin> => 
    apiRequest<SchoolAdmin>(`/schools/${schoolId}/admin`, {
      method: 'PATCH',
      data,
    }),

  // [NEW] Get all available subscription plans
  getAvailablePlans: async (schoolId: string): Promise<SubscriptionPlan[]> => {
    const data = await apiRequest<Record<string, unknown>[]>(`/schools/${schoolId}/available-plans`);
    return data.map(plan => ({
      id: plan.id as number,
      name: normalizePlan(plan.name as string),
      features: (plan.features as Record<string, boolean>) || {},
      created_at: plan.created_at as string,
    }));
  },

  // [NEW] Change subscription plan
  changePlan: (schoolId: string, data: PlanChangeRequest): Promise<School> => 
    apiRequest<School>(`/schools/${schoolId}`, {
      method: 'PATCH',
      data: { subscriptionPlanId: data.targetPlanId },
    }),
};
