import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { queryKeys } from '../../lib/queryKeys';

// ── Response Types ──────────────────────────────────────────────────

interface AdminDashboardData {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    feeCollected: number;
    feePending: number;
    feeCollectionPercentage: number;
    attendancePercentage: number;
    pendingDefaulters: number;
  };
  attendanceOverview: {
    present: number;
    absent: number;
    late: number;
    total: number;
    byClass: Array<{
      className: string;
      classSection: string | null;
      present: number;
      total: number;
      percentage: number;
    }>;
  };
  feeOverview: {
    collected: number;
    pending: number;
    waived: number;
    total: number;
    collectionPercentage: number;
    byStatus: Array<{
      status: string;
      count: number;
    }>;
  };
  syllabusProgress: Array<{
    classId: number;
    className: string;
    classSection: string | null;
    totalChapters: number;
    completedChapters: number;
    overallPercentage: number;
  }>;
}

interface AccountantDashboardData {
  stats: {
    todayCollection: number;
    monthCollection: number;
    pendingAmount: number;
    defaulterCount: number;
    receiptsToday: number;
  };
  recentReceipts: Array<{
    id: number;
    studentName: string;
    className: string;
    classSection: string | null;
    amountPaid: number;
    paymentDate: string;
    receiptNumber: string | null;
    paymentMode: string | null;
  }>;
  monthlyChart: Array<{
    month: string;
    amount: number;
  }>;
}

interface TeacherDashboardData {
  allocations: Array<{
    id: number;
    classId: number;
    subjectId: number;
    className: string;
    classSection: string | null;
    subjectName: string;
    subjectCode: string;
    yearName: string;
  }>;
  syllabusStats: {
    overallPercentage: number;
    completedChapters: number;
    totalChapters: number;
  };
  uniqueClassCount: number;
  totalAllocations: number;
}

interface ChildOverview {
  student: {
    id: number;
    admission_number: string;
    full_name: string;
    class_name: string;
    class_section: string | null;
  };
  fee_summary: {
    total_fees: string;
    paid_fees: string;
    pending_fees: string;
    total_due: string;
  };
  recent_attendance: Array<{
    status: string;
    attendance_date: string;
  }>;
}

interface ParentDashboardData {
  children: ChildOverview[];
  recentAnnouncements: Array<{
    id: number;
    title: string;
    content: string;
    priority: string;
    targetAudience: string;
    createdAt: string;
  }>;
}

// ── Hooks ───────────────────────────────────────────────────────────

export const useAdminDashboard = () => {
  return useQuery<AdminDashboardData>({
    queryKey: queryKeys.dashboard.admin,
    queryFn: () => apiRequest<AdminDashboardData>('/dashboard/admin'),
    staleTime: 30 * 1000, // 30 seconds — dashboards should be fairly fresh
  });
};

export const useAccountantDashboard = () => {
  return useQuery<AccountantDashboardData>({
    queryKey: queryKeys.dashboard.accountant,
    queryFn: () => apiRequest<AccountantDashboardData>('/dashboard/accountant'),
    staleTime: 30 * 1000,
  });
};

export const useTeacherDashboard = (teacherId: number) => {
  return useQuery<TeacherDashboardData>({
    queryKey: queryKeys.dashboard.teacher(teacherId),
    queryFn: () => apiRequest<TeacherDashboardData>('/dashboard/teacher'),
    staleTime: 30 * 1000,
    enabled: !!teacherId,
  });
};

export const useParentDashboard = (parentId: string | number) => {
  return useQuery<ParentDashboardData>({
    queryKey: queryKeys.dashboard.parent(Number(parentId)),
    queryFn: () => apiRequest<ParentDashboardData>('/parent/dashboard'),
    staleTime: 30 * 1000,
    enabled: !!parentId,
  });
};
