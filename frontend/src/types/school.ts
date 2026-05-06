export type SubscriptionTier = 'BASIC' | 'PREMIUM' | 'BUSINESS';
export type FeeTerm = 'YEARLY' | 'HALF-YEARLY' | 'QUARTERLY' | 'MONTHLY';

export interface School {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  academicYear: string;
  logo?: string;
  plan: SubscriptionTier;
  feeTerm: FeeTerm;
  subscriptionStatus: string;
  subscriptionEndDate?: string;
  status: boolean;
  createdAt: string;
  teacherCount?: number;
  studentCount?: number;
  creditBalance?: number;
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

export interface CreateSchoolRequest {
  school: SchoolCreateData;
  admin: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  };
}

export interface SchoolAdmin {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  schoolId: number;
  isActive: boolean;
  createdAt?: string;
}

export interface UpdateSchoolAdminData {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
}

// [NEW] Subscription Plan interface
export interface SubscriptionPlan {
  id: number;
  name: SubscriptionTier;
  features: Record<string, boolean>;
  created_at?: string;
}

// [NEW] Plan change request
export interface PlanChangeRequest {
  targetPlanId: number;
}

// [NEW] Profile update data
export interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  password?: string;
  currentPassword?: string;
}
