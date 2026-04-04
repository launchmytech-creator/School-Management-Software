import React, { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import AdminStatCard from "../../components/dashboard/AdminStatCard";
import PageHeader from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { useAdminDashboard } from "../../hooks/queries";

const AttendanceChart = lazy(() => 
  import("../../components/dashboard/AttendanceChart").then(m => ({ default: m.default }))
);

const FeeStatusChart = lazy(() => 
  import("../../components/dashboard/FeeStatusChart").then(m => ({ default: m.default }))
);
import {
  Users,
  UserRoundSearch,
  IndianRupee,
  AlertCircle,
} from "lucide-react";

interface SyllabusItem {
  classId: number;
  className: string;
  classSection: string | null;
  totalChapters: number;
  completedChapters: number;
  overallPercentage: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useAdminDashboard();

  const stats = data?.stats ?? null;
  const attendanceOverview = data?.attendanceOverview ?? null;
  const feeOverview = data?.feeOverview ?? null;
  const syllabusProgress: SyllabusItem[] = data?.syllabusProgress ?? [];

  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  if (isLoading) {
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
      label: "Total Students",
      value: stats?.totalStudents?.toLocaleString() || "—",
      icon: Users,
      variant: 'blue' as const,
      onClick: () => navigate('/admin/students'),
    },
    {
      label: "Total Teachers",
      value: stats?.totalTeachers?.toString() || "—",
      icon: UserRoundSearch,
      variant: 'default' as const,
      onClick: () => navigate('/admin/teachers'),
    },
    {
      label: "Fee Collected",
      value: stats?.feeCollected ? formatCurrency(stats.feeCollected) : "—",
      icon: IndianRupee,
      variant: 'emerald' as const,
      onClick: () => navigate('/admin/fees'),
    },
    {
      label: "Pending Defaulters",
      value: stats?.pendingDefaulters?.toString() || "—",
      icon: AlertCircle,
      variant: 'rose' as const,
      onClick: () => navigate('/admin/fee-defaulters'),
    },
  ];

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 80) return '#10B981';
    if (percentage >= 50) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-10 pb-12">
        <PageHeader
          title="Overview"
          subtitle={`Welcome back, Admin. Today is ${today}`}
          breadcrumb={{
            links: [
              { label: "Admin", href: "/admin/dashboard" },
              { label: "Dashboard", active: true },
            ],
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <AdminStatCard key={index} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm h-64 flex items-center justify-center">
              <LoadingSpinner size="md" message="Loading chart..." />
            </div>
          }>
            <AttendanceChart
              present={attendanceOverview?.present || 0}
              total={attendanceOverview?.total || 0}
              onViewDetails={() => navigate("/admin/attendance")}
            />
          </Suspense>
          <Suspense fallback={
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm h-64 flex items-center justify-center">
              <LoadingSpinner size="md" message="Loading chart..." />
            </div>
          }>
            <FeeStatusChart
              paid={feeOverview?.collected || 0}
              pending={feeOverview?.pending || 0}
              partial={feeOverview?.waived || 0}
            />
          </Suspense>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-display font-bold text-slate-800 tracking-tight mb-8">
            Syllabus Completion
          </h3>

          {syllabusProgress.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-slate-500">No syllabus data available</p>
            </div>
          ) : (
            <div className="space-y-8">
              {syllabusProgress.slice(0, 5).map((item) => {
                const color = getProgressColor(item.overallPercentage);
                const displayName = item.classSection
                  ? `${item.className} - Section ${item.classSection}`
                  : item.className;

                return (
                  <div key={item.classId} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-800 font-bold text-sm tracking-tight">
                        {displayName}
                      </span>
                      <span className="text-accent font-black text-sm">
                        {item.overallPercentage}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${item.overallPercentage}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
