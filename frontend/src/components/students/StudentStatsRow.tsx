import React from "react";
import { AdminStatCard } from "../../components/dashboard";
import { Users, BookOpen, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface StudentStatsRowProps {
  layout: "admin" | "accountant" | "teacher";
  stats: {
    totalClasses: number;
    totalLoadedStudents: number;
    paid: number;
    partial: number;
    pending: number;
  };
  allocationsCount: number;
}

export const StudentStatsRow: React.FC<StudentStatsRowProps> = ({
  layout,
  stats,
  allocationsCount,
}) => {
  if (layout === "teacher") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AdminStatCard
          label="Classes Assigned"
          value={stats.totalClasses}
          icon={Users}
        />
        <AdminStatCard
          label="Total Students"
          value={stats.totalLoadedStudents}
          icon={Users}
          variant="default"
        />
        <AdminStatCard
          label="Subject Allocations"
          value={allocationsCount}
          icon={BookOpen}
          variant="purple"
        />
      </div>
    );
  }

  if (layout === "accountant") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <AdminStatCard label="Total Classes" value={stats.totalClasses} icon={Users} />
        <AdminStatCard
          label="Fee Paid"
          value={stats.paid}
          icon={CheckCircle}
          variant="emerald"
        />
        <AdminStatCard
          label="Partial Payment"
          value={stats.partial}
          icon={Clock}
          variant="blue"
        />
        <AdminStatCard
          label="Pending"
          value={stats.pending}
          icon={AlertTriangle}
          variant="amber"
        />
        <AdminStatCard
          label="Students Loaded"
          value={stats.totalLoadedStudents}
          icon={Users}
          variant="default"
        />
      </div>
    );
  }

  return null;
};
