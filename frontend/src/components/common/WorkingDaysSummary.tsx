import React from "react";

interface WorkingDaysSummaryProps {
  totalDays: number;
  holidaysCount: number;
  sundaysCount: number;
  workingDays: number;
}

export const WorkingDaysSummary: React.FC<WorkingDaysSummaryProps> = ({
  totalDays,
  holidaysCount,
  sundaysCount,
  workingDays,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
        <span className="text-sm font-medium text-slate-500">Total Days</span>
        <span className="text-xl font-extrabold text-slate-900">{totalDays}</span>
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
        <span className="text-sm font-medium text-red-500">Holidays</span>
        <span className="text-xl font-extrabold text-red-600">{holidaysCount}</span>
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
        <span className="text-sm font-medium text-orange-500">Sundays</span>
        <span className="text-xl font-extrabold text-orange-600">{sundaysCount}</span>
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
        <span className="text-sm font-medium text-blue-600">Working Days</span>
        <span className="text-xl font-extrabold text-blue-600">{workingDays}</span>
      </div>
    </div>
  );
};
