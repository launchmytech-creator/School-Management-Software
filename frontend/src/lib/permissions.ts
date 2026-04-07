import type { SubscriptionTier } from '../types/school';

export const PLAN_FEATURES: Record<SubscriptionTier, string[]> = {
  BASIC: [
    'fee_management',
    'marks_management',
  ],
  PREMIUM: [
    'fee_management',
    'marks_management',
    'attendance',
    'syllabus_tracking',
  ],
  BUSINESS: [
    'fee_management',
    'marks_management',
    'attendance',
    'syllabus_tracking',
    'teacher_allocation',
    'analytics',
  ],
};

export const FEATURE_LABELS: Record<string, string> = {
  fee_management: 'Fee Management',
  marks_management: 'Marks Management',
  attendance: 'Attendance Management',
  syllabus_tracking: 'Syllabus Tracking',
  teacher_allocation: 'Teacher Allocation',
  analytics: 'Academic Analytics',
};

export const FEATURE_DESCRIPTIONS: Record<string, string> = {
  attendance: 'Track student and teacher attendance records',
  syllabus_tracking: 'Monitor syllabus completion进度',
  teacher_allocation: 'Allocate teachers to classes and subjects',
  analytics: 'View academic performance and analytics',
};

export const PLAN_LABELS: Record<SubscriptionTier, string> = {
  BASIC: 'Basic',
  PREMIUM: 'Premium',
  BUSINESS: 'Business',
};

export const PLAN_DESCRIPTIONS: Record<SubscriptionTier, string> = {
  BASIC: 'Fee management and marks tracking',
  PREMIUM: 'Basic features + Attendance and Syllabus Tracking',
  BUSINESS: 'All features including Analytics and Teacher Allocation',
};

export const hasFeature = (
  features: Record<string, boolean> | null,
  feature: string
): boolean => {
  if (!features) return false;
  return features[feature] === true;
};

export const getRequiredPlan = (feature: string): SubscriptionTier | null => {
  for (const [plan, features] of Object.entries(PLAN_FEATURES)) {
    if (features.includes(feature)) {
      return plan as SubscriptionTier;
    }
  }
  return null;
};

export const PLAN_FEATURE_COMPARISON = {
  BASIC: {
    fee_management: true,
    marks_management: true,
    attendance: false,
    syllabus_tracking: false,
    teacher_allocation: false,
    analytics: false,
  },
  PREMIUM: {
    fee_management: true,
    marks_management: true,
    attendance: true,
    syllabus_tracking: true,
    teacher_allocation: false,
    analytics: false,
  },
  BUSINESS: {
    fee_management: true,
    marks_management: true,
    attendance: true,
    syllabus_tracking: true,
    teacher_allocation: true,
    analytics: true,
  },
};

export const ROUTE_FEATURE_MAP: Record<string, string> = {
  'teacher-attendance': 'attendance',
  'student-attendance': 'attendance',
  'syllabus-tracking': 'syllabus_tracking',
  'teacher-allocation': 'teacher_allocation',
};
