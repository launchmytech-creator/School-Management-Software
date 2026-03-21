import { feeService } from './feeService';
import { studentService } from './studentService';
import { teacherService } from './teacherService';
import { classService } from './classService';
import { attendanceService, type AttendanceRecord } from './attendanceService';

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

const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const dashboardService = {
  getAdminDashboard: async (): Promise<{
    stats: AdminDashboardStats;
    recentActivity: DashboardActivity[];
    attendanceOverview: AttendanceOverview;
    feeOverview: FeeOverview;
  }> => {
    try {
      const today = getTodayDate();
      
      const [students, teachers, classes, feeSummary] = await Promise.all([
        studentService.getStudents().catch(() => []),
        teacherService.getTeachers().catch(() => []),
        classService.getClasses().catch(() => []),
        feeService.getFeeSummary().catch(() => null),
      ]);

      let attendanceOverview: AttendanceOverview = {
        present: 0,
        absent: 0,
        total: students.length,
        percentage: 0,
        byClass: [],
      };

      if (classes.length > 0) {
        try {
          const todayAttendance = await attendanceService.getAttendance({ date: today });
          
          const byClassMap = new Map<string, { className: string; present: number; total: number }>();
          
          let totalPresent = 0;
          let totalAbsent = 0;

          todayAttendance.forEach((record: AttendanceRecord) => {
            const classKey = `${record.classId}-${record.className}`;
            if (!byClassMap.has(classKey)) {
              byClassMap.set(classKey, { className: record.className, present: 0, total: 0 });
            }
            const classData = byClassMap.get(classKey)!;
            classData.total += 1;
            if (record.status === 'present' || record.status === 'late') {
              classData.present += 1;
              totalPresent += 1;
            } else {
              totalAbsent += 1;
            }
          });

          const byClass = Array.from(byClassMap.values()).map((c) => ({
            className: c.className,
            present: c.present,
            total: c.total,
            percentage: c.total > 0 ? Math.round((c.present / c.total) * 100) : 0,
          }));

          attendanceOverview = {
            present: totalPresent,
            absent: totalAbsent,
            total: students.length,
            percentage: students.length > 0 ? Math.round((totalPresent / students.length) * 100) : 0,
            byClass,
          };
        } catch {
          attendanceOverview = {
            present: 0,
            absent: students.length,
            total: students.length,
            percentage: 0,
            byClass: [],
          };
        }
      }

      const stats: AdminDashboardStats = {
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        studentGrowth: 0,
        teacherGrowth: 0,
        feeCollected: feeSummary?.collectedAmount || 0,
        feePending: feeSummary?.pendingAmount || 0,
        feeCollectionPercentage: feeSummary?.collectionPercentage || 0,
        attendancePercentage: attendanceOverview.percentage,
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
        attendanceOverview,
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
