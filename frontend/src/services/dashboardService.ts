import { feeService } from './feeService';
import { studentService } from './studentService';
import { teacherService } from './teacherService';
import { classService } from './classService';
import { attendanceService, type AttendanceRecord } from './attendanceService';
import { getLocalDateString } from '../lib/utils';

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
  return getLocalDateString();
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
      
      // Fetch core data in parallel
      const [students, teachers, classes] = await Promise.all([
        studentService.getStudents().catch(() => []),
        teacherService.getTeachers().catch(() => []),
        classService.getClasses().catch(() => []),
      ]);

      // ── Fee overview: computed from real transactions ────────────
      let feeOverview: FeeOverview = {
        collected: 0,
        pending: 0,
        waived: 0,
        total: 0,
        collectionPercentage: 0,
        byStatus: [],
      };
      let pendingDefaulters = 0;

      try {
        const [transactions, defaulters] = await Promise.all([
          feeService.getFeeTransactions(),
          feeService.getFeeDefaulters(),
        ]);

        let totalCollected = 0;
        let totalPending = 0;
        let totalWaived = 0;
        let totalAmount = 0;
        const statusCounts: Record<string, { count: number; amount: number }> = {};

        for (const t of transactions) {
          totalCollected += t.amountPaid;
          totalPending += t.amountPending;
          totalWaived += t.waiverAmount || 0;
          totalAmount += t.amountDue;

          const status = t.status;
          if (!statusCounts[status]) statusCounts[status] = { count: 0, amount: 0 };
          statusCounts[status].count += 1;
          statusCounts[status].amount += t.amountDue;
        }

        feeOverview = {
          collected: totalCollected,
          pending: totalPending,
          waived: totalWaived,
          total: totalAmount,
          collectionPercentage: totalAmount > 0 ? Math.round((totalCollected / totalAmount) * 100) : 0,
          byStatus: Object.entries(statusCounts).map(([status, data]) => ({
            status,
            count: data.count,
            amount: data.amount,
          })),
        };

        pendingDefaulters = defaulters.length;
      } catch {
        // Fee data unavailable — keep zeros
      }

      // ── Attendance overview ─────────────────────────────────────
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

          const attendanceTotal = totalPresent + totalAbsent;
          attendanceOverview = {
            present: totalPresent,
            absent: totalAbsent,
            total: attendanceTotal > 0 ? attendanceTotal : students.length,
            percentage: attendanceTotal > 0 ? Math.round((totalPresent / attendanceTotal) * 100) : 0,
            byClass,
          };
        } catch {
          // Attendance data unavailable
        }
      }

      // ── Build stats ─────────────────────────────────────────────
      const stats: AdminDashboardStats = {
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        studentGrowth: 0,
        teacherGrowth: 0,
        feeCollected: feeOverview.collected,
        feePending: feeOverview.pending,
        feeCollectionPercentage: feeOverview.collectionPercentage,
        attendancePercentage: attendanceOverview.percentage,
        pendingDefaulters,
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
