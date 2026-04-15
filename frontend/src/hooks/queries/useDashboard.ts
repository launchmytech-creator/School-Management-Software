import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

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
    message: string;
    targetRole: string | null;
    createdAt: string;
  }>;
}

// ── Hooks ───────────────────────────────────────────────────────────

export const useAdminDashboard = () => {
  const { user } = useAuth();
  
  return useQuery<AdminDashboardData>({
    queryKey: queryKeys.dashboard.admin(user?.schoolId ?? null),
    queryFn: () => apiRequest<AdminDashboardData>('/dashboard/admin'),
    staleTime: QUERY_STALE_TIME.DASHBOARD,
  });
};

export const useAccountantDashboard = () => {
  const { user } = useAuth();
  
  return useQuery<AccountantDashboardData>({
    queryKey: queryKeys.dashboard.accountant(user?.schoolId ?? null),
    queryFn: () => apiRequest<AccountantDashboardData>('/dashboard/accountant'),
    staleTime: QUERY_STALE_TIME.DASHBOARD,
  });
};

export const useTeacherDashboard = (teacherId: number) => {
  const { user } = useAuth();
  
  return useQuery<TeacherDashboardData>({
    queryKey: queryKeys.dashboard.teacher(user?.schoolId ?? null, teacherId),
    queryFn: () => apiRequest<TeacherDashboardData>(`/dashboard/teacher?teacherId=${teacherId}`),
    staleTime: QUERY_STALE_TIME.DASHBOARD,
    enabled: !!teacherId,
  });
};

export const useParentDashboard = (parentId: string | number) => {
  const { user } = useAuth();
  
  return useQuery<ParentDashboardData>({
    queryKey: queryKeys.dashboard.parent(user?.schoolId ?? null, Number(parentId)),
    queryFn: () => apiRequest<ParentDashboardData>('/parent/dashboard'),
    staleTime: QUERY_STALE_TIME.DASHBOARD,
    enabled: !!parentId,
  });
};
