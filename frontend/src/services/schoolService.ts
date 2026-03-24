import { apiRequest } from './api';
import type { School, SchoolStats, RecentSchoolActivity, CreateSchoolRequest, SubscriptionTier, SchoolUpdateData } from '../types/school';
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
  name: (data.name as string) || '',
  address: (data.address as string) || '',
  phone: (data.phone as string) || (data.contact_phone as string) || '',
  email: (data.email as string) || (data.contact_email as string) || '',
  academicYear: (data.academicYear as string) || (data.academic_year as string) || getCurrentAcademicYear(),
  logo: (data.logo as string) || '',
  plan: normalizePlan((data.plan as string) || (data.subscription_plan_name as string)),
  feeTerm: mapFeeTerms(data.feeTerm as string | undefined || (data.fee_terms as number | undefined)),
  status: data.status !== undefined ? Boolean(data.status) : Boolean(data.is_active),
  createdAt: (data.createdAt as string) || (data.created_at as string) || new Date().toISOString(),
});

export const schoolService = {
  // Stats & Dashboard
  getStats: (): Promise<SchoolStats> => apiRequest<SchoolStats>('/super-admin/stats'),
  
  getRecentActivity: async (): Promise<RecentSchoolActivity[]> => {
    const data = await apiRequest<Record<string, unknown>[]>('/super-admin/recent-schools');
    return data.map(item => ({
      ...item,
      id: (item.id as string | number)?.toString(),
      plan: normalizePlan(item.plan as string | undefined),
      createdAt: (item.createdAt as string) || (item.created_at as string),
      initials: (item.initials as string) || ((item.name as string)?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '??'),
    })) as RecentSchoolActivity[];
  },

  // School Management
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

  deleteSchool: (id: string): Promise<void> => apiRequest<void>(`/schools/${id}`, {
    method: 'DELETE',
  }),

  bulkDeactivate: (ids: string[]): Promise<void> => apiRequest<void>('/super-admin/schools/bulk-deactivate', {
    method: 'POST',
    data: { ids },
  }),

  updateSchool: (id: string, data: SchoolUpdateData): Promise<School> => apiRequest<School>(`/schools/${id}`, {
    method: 'PATCH',
    data,
  }),
};
