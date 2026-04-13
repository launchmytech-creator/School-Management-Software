import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Calendar } from "lucide-react";

interface AttendanceChartProps {
  present: number;
  total: number;
  onViewDetails?: () => void;
}

const AttendanceChart: React.FC<AttendanceChartProps> = ({
  present,
  total,
}) => {
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
  const absent = total > 0 ? total - present : 0;

  const hasAttendance = total > 0;

  const data = hasAttendance
    ? [
        { name: "Present", value: present, color: "#3B82F6" },
        { name: "Absent", value: absent, color: "#F1F5F9" },
      ]
    : [{ name: "No Data", value: 1, color: "#E2E8F0" }];

  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-display font-bold text-slate-800 tracking-tight">
          Today's Attendance
        </h3>
        {/* {onViewDetails && (
          <button 
            onClick={onViewDetails}
            className="text-accent text-sm font-bold hover:underline"
          >
            View Details
          </button>
        )} */}
      </div>

      <div className="flex items-center gap-8">
        <div className="w-40 h-40 relative">
          {hasAttendance ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-display font-black text-slate-900 leading-none">
                  {percentage}%
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Present
                </span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 rounded-full">
              <Calendar className="w-12 h-12 text-slate-300 mb-2" />
              <span className="text-sm font-medium text-slate-400 text-center px-2">
                No attendance marked
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
            <span className="text-slate-500 text-xs font-medium">
              Total Students
            </span>
            <span className="text-slate-900 font-bold">
              {total.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center bg-emerald-50 p-2.5 rounded-xl">
            <span className="text-emerald-600 text-xs font-bold">Present</span>
            <span className="text-emerald-700 font-bold">
              {present.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center bg-rose-50 p-2.5 rounded-xl">
            <span className="text-rose-600 text-xs font-bold">Absent</span>
            <span className="text-rose-700 font-bold">
              {absent.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceChart;
