import React from 'react';
import { CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';

interface AttendanceSummary {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  attendance_percentage: string;
}

interface AttendanceSummaryCardProps {
  attendance: AttendanceSummary;
}

const DonutRing: React.FC<{ percentage: number }> = ({ percentage }) => {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(percentage, 100) / 100);
  const color = percentage >= 75 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444';
  const trackColor = percentage >= 75 ? '#d1fae5' : percentage >= 50 ? '#fef3c7' : '#fee2e2';

  return (
    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
      <svg width="96" height="96" className="absolute -rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke={trackColor} strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="relative text-center">
        <p className="text-lg font-black text-slate-800 leading-none">{Math.round(percentage)}%</p>
        <p className="text-[9px] font-semibold text-slate-400 mt-0.5">Present</p>
      </div>
    </div>
  );
};

export const AttendanceSummaryCard: React.FC<AttendanceSummaryCardProps> = ({ attendance }) => {
  const percentage = parseFloat(attendance?.attendance_percentage || '0');
  const presentDays = attendance?.present_days || 0;
  const absentDays = attendance?.absent_days || 0;
  const lateDays = attendance?.late_days || 0;
  const totalDays = attendance?.total_days || 0;

  const statusColor = percentage >= 75 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-600' : 'text-rose-600';
  const statusBg = percentage >= 75 ? 'bg-emerald-50 border-emerald-200' : percentage >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200';
  const statusLabel = percentage >= 75 ? 'Good Standing' : percentage >= 50 ? 'Needs Attention' : 'Critical';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* header */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <TrendingUp size={14} className="text-blue-500" />
          </div>
          <span className="font-bold text-slate-800 text-sm">Attendance</span>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusBg} ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-5">
          <DonutRing percentage={percentage} />

          {/* stats */}
          <div className="flex-1 grid grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2.5 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <div>
                <p className="text-base font-black text-emerald-700">{presentDays}</p>
                <p className="text-[10px] font-semibold text-emerald-500">Present</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 bg-rose-50 rounded-xl border border-rose-100">
              <XCircle size={16} className="text-rose-500 shrink-0" />
              <div>
                <p className="text-base font-black text-rose-700">{absentDays}</p>
                <p className="text-[10px] font-semibold text-rose-500">Absent</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 bg-amber-50 rounded-xl border border-amber-100">
              <Clock size={16} className="text-amber-500 shrink-0" />
              <div>
                <p className="text-base font-black text-amber-700">{lateDays}</p>
                <p className="text-[10px] font-semibold text-amber-500">Late</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-4 h-4 rounded-full bg-slate-300 shrink-0" />
              <div>
                <p className="text-base font-black text-slate-700">{totalDays}</p>
                <p className="text-[10px] font-semibold text-slate-400">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* progress bar */}
        {totalDays > 0 && (
          <div className="mt-4">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
              <div
                className="h-full bg-emerald-400 rounded-l-full transition-all duration-500"
                style={{ width: `${(presentDays / totalDays) * 100}%` }}
              />
              <div
                className="h-full bg-amber-400 transition-all duration-500"
                style={{ width: `${(lateDays / totalDays) * 100}%` }}
              />
              <div
                className="h-full bg-rose-400 rounded-r-full transition-all duration-500"
                style={{ width: `${(absentDays / totalDays) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[10px] text-slate-400"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Present</span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Late</span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Absent</span>
              </div>
              <span className="text-[10px] text-slate-400">{totalDays} days total</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
