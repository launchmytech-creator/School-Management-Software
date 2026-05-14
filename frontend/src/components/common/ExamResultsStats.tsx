import React from "react";
import { GraduationCap, Award, TrendingUp, BarChart3 } from "lucide-react";

interface ExamResultsStatsProps {
  total: number;
  passed: number;
  failed: number;
  passPercentage: string;
}

export const ExamResultsStats: React.FC<ExamResultsStatsProps> = ({
  total,
  passed,
  failed,
  passPercentage,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-slate-900">{total}</p>
            <p className="text-sm text-slate-500">Total Records</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl">
            <GraduationCap className="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-emerald-700">{passed}</p>
            <p className="text-sm text-emerald-600">Passed</p>
          </div>
          <div className="p-3 bg-emerald-100 rounded-xl">
            <Award className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </div>

      <div className="bg-red-50 rounded-xl border border-red-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-red-700">{failed}</p>
            <p className="text-sm text-red-600">Failed</p>
          </div>
          <div className="p-3 bg-red-100 rounded-xl">
            <TrendingUp className="w-5 h-5 text-red-600" />
          </div>
        </div>
      </div>

      <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-purple-700">{passPercentage}%</p>
            <p className="text-sm text-purple-600">Pass rate</p>
          </div>
          <div className="p-3 bg-purple-100 rounded-xl">
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  );
};
