import { feeService } from './feeService';
import { studentService } from './studentService';
import { teacherService } from './teacherService';
import { classService } from './classService';

export interface AdminDashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  studentGrowth: number;
  teacherGrowth: number;
  feeCollected: number;
  feePending: number;
  feeCollectionPercentage: number;
  attendancePercentage: number;
  pendingDefaulters: number;
}

export interface DashboardActivity {
  id: string;
  type: 'student_enrolled' | 'teacher_joined' | 'fee_paid' | 'attendance_marked' | 'exam_added';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

export interface AttendanceOverview {
  present: number;
  absent: number;
  total: number;
  percentage: number;
  byClass: { className: string; present: number; total: number; percentage: number }[];
}

export interface FeeOverview {
  collected: number;
  pending: number;
  waived: number;
  total: number;
  collectionPercentage: number;
  byStatus: { status: string; count: number; amount: number }[];
}

export const dashboardService = {
  getAdminDashboard: async (): Promise<{
    stats: AdminDashboardStats;
    recentActivity: DashboardActivity[];
    attendanceOverview: AttendanceOverview;
    feeOverview: FeeOverview;
  }> => {
    try {
      const [students, teachers, classes, feeSummary] = await Promise.all([
        studentService.getStudents().catch(() => []),
        teacherService.getTeachers().catch(() => []),
        classService.getClasses().catch(() => []),
        feeService.getFeeSummary().catch(() => null),
      ]);

      const stats: AdminDashboardStats = {
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        studentGrowth: 0,
        teacherGrowth: 0,
        feeCollected: feeSummary?.collectedAmount || 0,
        feePending: feeSummary?.pendingAmount || 0,
        feeCollectionPercentage: feeSummary?.collectionPercentage || 0,
        attendancePercentage: 0,
        pendingDefaulters: 0,
      };

      const feeOverview: FeeOverview = {
        collected: feeSummary?.collectedAmount || 0,
        pending: feeSummary?.pendingAmount || 0,
        waived: 0,
        total: feeSummary?.totalAmount || 0,
        collectionPercentage: feeSummary?.collectionPercentage || 0,
        byStatus: feeSummary?.byStatus || [],
      };

      return {
        stats,
        recentActivity: [],
        attendanceOverview: { present: 0, absent: 0, total: 0, percentage: 0, byClass: [] },
        feeOverview,
      };
    } catch {
      throw new Error('Failed to fetch dashboard data');
    }
  },

  getStats: async (): Promise<AdminDashboardStats> => {
    const data = await dashboardService.getAdminDashboard();
    return data.stats;
  },

  getRecentActivity: async (): Promise<DashboardActivity[]> => {
    const data = await dashboardService.getAdminDashboard();
    return data.recentActivity;
  },

  getAttendanceOverview: async (): Promise<AttendanceOverview> => {
    const data = await dashboardService.getAdminDashboard();
    return data.attendanceOverview;
  },

  getFeeOverview: async (): Promise<FeeOverview> => {
    const data = await dashboardService.getAdminDashboard();
    return data.feeOverview;
  },
};

export default dashboardService;
