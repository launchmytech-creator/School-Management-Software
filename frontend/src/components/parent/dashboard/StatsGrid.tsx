import React from 'react';
import type { ChildOverview } from '../../../hooks/queries/useDashboard';

interface StatsGridProps {
  child: ChildOverview;
}

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: string;
  bgColor: string;
  percentage?: number;
  status?: 'success' | 'warning' | 'error' | 'default';
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  bgColor,
  percentage,
  status = 'default'
}) => {
  const statusColors = {
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    error: 'text-rose-500',
    default: 'text-slate-900'
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          {label}
        </p>
        <span
          className={`material-symbols-outlined text-[20px] ${bgColor.replace('bg-', 'text-')}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>
      <p className={`text-2xl font-black ${statusColors[status]}`}>
        {value}
      </p>
      {subValue && (
        <p className="text-xs text-slate-400 mt-1">{subValue}</p>
      )}
      {percentage !== undefined && (
        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              status === 'success' ? 'bg-emerald-500' :
              status === 'error' ? 'bg-rose-500' :
              status === 'warning' ? 'bg-amber-500' :
              'bg-blue-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

export const StatsGrid: React.FC<StatsGridProps> = ({ child }) => {
  const totalDays = child.recent_attendance.length;
  const presentDays = child.recent_attendance.filter(a => a.status === 'present').length;
  const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const examResult = child.exam_result;
  const examPercentage = examResult?.overallPercentage ?? 0;

  const pendingFees = parseFloat(child.fee_summary.pending_fees) || 0;
  const hasPendingFees = pendingFees > 0;

  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard
        label="Attendance"
        value={`${presentDays}/${totalDays}`}
        subValue={`${attendancePct}%`}
        icon="person_check"
        bgColor="bg-blue-500"
        percentage={attendancePct}
        status={attendancePct >= 75 ? 'success' : attendancePct >= 50 ? 'warning' : 'error'}
      />

      <StatCard
        label="Latest Exam"
        value={examResult ? `${examPercentage}%` : '—'}
        subValue={examResult?.examName || 'No exam data'}
        icon="grade"
        bgColor="bg-amber-500"
        percentage={examPercentage}
        status={examPercentage >= 75 ? 'success' : examPercentage >= 50 ? 'warning' : examPercentage >= 1 ? 'error' : 'default'}
      />

      <StatCard
        label="Fees"
        value={hasPendingFees ? 'Pending' : 'Paid'}
        subValue={hasPendingFees ? `$${pendingFees.toFixed(0)} due` : 'All clear'}
        icon="account_balance_wallet"
        bgColor={hasPendingFees ? "bg-rose-500" : "bg-emerald-500"}
        status={hasPendingFees ? 'error' : 'success'}
      />
    </div>
  );
};