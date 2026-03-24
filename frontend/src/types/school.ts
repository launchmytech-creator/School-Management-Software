export type SubscriptionTier = 'BASIC' | 'PREMIUM' | 'BUSINESS';
export type FeeTerm = 'YEARLY' | 'HALF-YEARLY' | 'QUARTERLY' | 'MONTHLY';

export interface School {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  academicYear: string;
  logo?: string;
  plan: SubscriptionTier;
  feeTerm: FeeTerm;
  status: boolean;
  createdAt: string;
}

export interface SchoolStats {
  totalSchools: number;
  activeSchools: number;
  inactiveSchools: number;
  basicPlans: number;
  premiumPlans: number;
  businessPlans: number;
}

export interface RecentSchoolActivity {
  id: string;
  name: string;
  initials: string;
  logoBg: string;
  plan: SubscriptionTier;
  createdAt: string;
}

export interface SubscriptionDistribution {
  tier: SubscriptionTier;
  count: number;
  percentage: number;
}

export interface SchoolCreateData {
  name: string;
  code: string;
  subscriptionPlanId: number;
  feeTerms: number;
  contactEmail: string;
  contactPhone: string;
  address: string;
  subscriptionStatus: 'trial' | 'active' | 'expired';
  subscriptionEndDate: string;
}

export interface SchoolUpdateData {
  name?: string;
  subscriptionPlanId?: number;
  feeTerms?: number;
  subscriptionStatus?: string;
  subscriptionEndDate?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  isActive?: boolean;
}

export interface AdminCreateData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

export interface CreateSchoolRequest {
  school: SchoolCreateData;
  admin: AdminCreateData;
}
