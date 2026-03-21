import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import AdminStatCard from '../../components/dashboard/AdminStatCard';
import AttendanceChart from '../../components/dashboard/AttendanceChart';
import FeeStatusChart from '../../components/dashboard/FeeStatusChart';
import SyllabusCompletion from '../../components/dashboard/SyllabusCompletion';
import RecentActivity from '../../components/dashboard/RecentActivity';
import PageHeader from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { 
  Users, 
  UserRoundSearch, 
  IndianRupee, 
  AlertCircle,
  GraduationCap,
  CalendarCheck
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { dashboardService, type AdminDashboardStats, type DashboardActivity, type AttendanceOverview, type FeeOverview } from '../../services/dashboardService';
import { syllabusService, type ClassProgress } from '../../services/syllabusService';
import { useAcademicYear } from '../../context/AcademicYearContext';

const AdminDashboard: React.FC = () => {
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [attendanceOverview, setAttendanceOverview] = useState<AttendanceOverview | null>(null);
  const [feeOverview, setFeeOverview] = useState<FeeOverview | null>(null);
  const [syllabusProgress, setSyllabusProgress] = useState<ClassProgress[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardData, syllabusData] = await Promise.all([
        dashboardService.getAdminDashboard(),
        syllabusService.getAllClassesProgress(),
      ]);
      setStats(dashboardData.stats);
      setActivities(dashboardData.recentActivity);
      setAttendanceOverview(dashboardData.attendanceOverview);
      setFeeOverview(dashboardData.feeOverview);
      setSyllabusProgress(syllabusData.classes);
    } catch {
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, selectedYear]);

  const today = new Intl.DateTimeFormat('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }).format(new Date());

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" message="Loading dashboard..." />
        </div>
      </AdminLayout>
    );
  }

  const formatCurrency = (amount: number): string => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  };

  const statCards = [
    { 
      label: 'TOTAL STUDENTS', 
      value: stats?.totalStudents?.toLocaleString() || '—', 
      icon: Users, 
      trend: stats?.studentGrowth ? `+${stats.studentGrowth}%` : 'No change',
      trendType: (stats?.studentGrowth ?? 0) >= 0 ? 'positive' as const : 'negative' as const, 
      color: 'text-blue-500 bg-blue-50' 
    },
    { 
      label: 'TOTAL TEACHERS', 
      value: stats?.totalTeachers?.toString() || '—', 
      icon: UserRoundSearch, 
      trend: stats?.teacherGrowth ? `+${stats.teacherGrowth}` : 'No change',
      trendType: (stats?.teacherGrowth ?? 0) >= 0 ? 'positive' as const : 'negative' as const, 
      color: 'text-violet-500 bg-violet-50' 
    },
    { 
      label: 'FEE COLLECTED', 
      value: stats?.feeCollected ? formatCurrency(stats.feeCollected) : '—', 
      icon: IndianRupee, 
      trend: stats?.feeCollectionPercentage ? `${stats.feeCollectionPercentage}%` : 'No data',
      trendType: (stats?.feeCollectionPercentage ?? 0) >= 80 ? 'positive' as const : 'negative' as const, 
      color: 'text-emerald-500 bg-emerald-50' 
    },
    { 
      label: 'PENDING DEFAULTERS', 
      value: stats?.pendingDefaulters?.toString() || '—', 
      icon: AlertCircle, 
      trend: (stats?.pendingDefaulters ?? 0) > 0 ? 'Action Required' : 'All clear',
      trendType: (stats?.pendingDefaulters ?? 0) > 0 ? 'negative' as const : 'positive' as const, 
      color: 'text-rose-500 bg-rose-50' 
    },
  ];

  const formattedActivities = activities.length > 0 ? activities.map((activity, index) => ({
    id: activity.id || String(index),
    title: activity.title,
    description: activity.description,
    time: activity.timestamp ? new Date(activity.timestamp).toLocaleString() : '',
    icon: GraduationCap,
    color: activity.color || 'text-slate-400 bg-slate-50'
  })) : [{
    id: '1',
    title: 'Welcome to Dashboard',
    description: 'Your dashboard is ready',
    time: '',
    icon: CalendarCheck,
    color: 'text-blue-500 bg-blue-50'
  }];

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-10 pb-12">
        <PageHeader 
          title="Overview"
          subtitle={`Welcome back, Admin. Today is ${today}`}
          breadcrumb={{
            links: [
              { label: "Admin", href: "/admin/dashboard" },
              { label: "Dashboard", active: true }
            ]
          }}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <AdminStatCard key={index} {...stat} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AttendanceChart 
            present={attendanceOverview?.present || 0} 
            total={attendanceOverview?.total || 0}
            onViewDetails={() => navigate('/admin/attendance')}
          />
          <FeeStatusChart 
            paid={feeOverview?.collected || 0} 
            pending={feeOverview?.pending || 0} 
            partial={feeOverview?.waived || 0} 
          />
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          <div className="lg:col-span-2">
            <SyllabusCompletion items={syllabusProgress} />
          </div>
          <div className="lg:col-span-1">
            <RecentActivity activities={formattedActivities} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
