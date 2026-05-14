import React from 'react';

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

export const AttendanceSummaryCard: React.FC<AttendanceSummaryCardProps> = ({ attendance }) => {
  const percentage = parseFloat(attendance?.attendance_percentage) || 0;
  const presentDays = attendance?.present_days || 0;
  const absentDays = attendance?.absent_days || 0;
  const workingDays = attendance?.total_days || 0;
  const lateDays = attendance?.late_days || 0;

  const presentPercent = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;
  const absentPercent = workingDays > 0 ? Math.round((absentDays / workingDays) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-lg text-[#4A9FD4]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              calendar_check
            </span>
          </div>
          <h3 className="font-bold text-slate-800">Attendance Summary</h3>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-700">{presentDays}</p>
                <p className="text-sm text-emerald-600">Present ({presentPercent}%)</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-xl">
                <span
                  className="material-symbols-outlined text-emerald-600"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </div>
            </div>
          </div>

          <div className="bg-rose-50 rounded-xl border border-rose-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-rose-700">{absentDays}</p>
                <p className="text-sm text-rose-600">Absent ({absentPercent}%)</p>
              </div>
              <div className="p-2 bg-rose-100 rounded-xl">
                <span
                  className="material-symbols-outlined text-rose-600"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  cancel
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-700">{workingDays}</p>
                <p className="text-sm text-slate-500">Working Days</p>
              </div>
              <div className="p-2 bg-slate-100 rounded-xl">
                <span
                  className="material-symbols-outlined text-slate-600"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  calendar_today
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Attendance Rate</span>
            <span className={`text-lg font-bold ${
              percentage >= 75 ? 'text-emerald-600' : 
              percentage >= 50 ? 'text-amber-600' : 'text-rose-600'
            }`}>
              {percentage}%
            </span>
          </div>
          <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                percentage >= 75 ? 'bg-emerald-500' : 
                percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        {lateDays > 0 && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
            <span
              className="material-symbols-outlined text-amber-500"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              schedule
            </span>
            <span className="text-sm font-medium text-amber-600">
              {lateDays} late arrival{lateDays !== 1 ? 's' : ''} recorded
            </span>
          </div>
        )}
      </div>
    </div>
  );
};