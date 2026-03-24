import React from 'react';
import { Users, CheckCircle, XCircle } from 'lucide-react';

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
}

interface AttendanceStatsGridProps {
  stats: AttendanceStats;
  columns?: 3 | 4 | 5;
}

const AttendanceStatsGrid: React.FC<AttendanceStatsGridProps> = ({ 
  stats, 
  columns = 3 
}) => {
  const getPercentage = (value: number) => {
    if (stats.total === 0) return 0;
    return Math.round((value / stats.total) * 100);
  };

  const gridCols = {
    3: 'grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-5'
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-sm text-slate-500">Total</p>
          </div>
          <div className="p-3 bg-slate-100 rounded-xl">
            <Users className="w-5 h-5 text-slate-600" />
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-emerald-700">{stats.present}</p>
            <p className="text-sm text-emerald-600">Present ({getPercentage(stats.present)}%)</p>
          </div>
          <div className="p-3 bg-emerald-100 rounded-xl">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </div>

      <div className="bg-rose-50 rounded-xl border border-rose-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-rose-700">{stats.absent}</p>
            <p className="text-sm text-rose-600">Absent ({getPercentage(stats.absent)}%)</p>
          </div>
          <div className="p-3 bg-rose-100 rounded-xl">
            <XCircle className="w-5 h-5 text-rose-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceStatsGrid;
