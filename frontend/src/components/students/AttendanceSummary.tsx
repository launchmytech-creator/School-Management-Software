import React from "react";
import { ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

interface AttendanceSummaryData {
  totalDays: number;
  holidayCount: number;
  sundayCount: number;
  workingDays: number;
  presentCount: number;
  absentCount: number;
  percentage: number;
}

interface AttendanceSummaryProps {
  data: AttendanceSummaryData;
  studentName: string;
}

const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({ data, studentName }) => {
  const firstName = studentName?.split(" ")[0] ?? "Student";

  return (
    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
      <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">
        Attendance Summary
      </h3>

      <div className="relative w-48 h-48 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={[
                {
                  name: "Present",
                  value: data.presentCount,
                  color: "#10B981",
                },
                {
                  name: "Absent",
                  value: Math.max(0, data.workingDays - data.presentCount),
                  color: "#F1F5F9",
                },
              ]}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              <Cell fill="#10B981" />
              <Cell fill="#F1F5F9" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-slate-800 tracking-tight">
            {data.percentage}%
          </span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Attendance
          </span>
        </div>
      </div>

      <div className="w-full space-y-3 mb-6">
        <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
          <span className="text-xs font-bold text-emerald-600">Working Days</span>
          <span className="text-lg font-black text-emerald-700">
            {data.workingDays}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-rose-50 rounded-xl">
          <span className="text-xs font-bold text-rose-600">Present Days</span>
          <span className="text-lg font-black text-rose-700">
            {data.presentCount}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
          <span className="text-xs font-bold text-slate-500">Absent Days</span>
          <span className="text-lg font-black text-slate-700">
            {data.absentCount}
          </span>
        </div>
      </div>

      <p className="text-xs font-bold text-slate-400 leading-relaxed px-4">
        {firstName} has{" "}
        {data.percentage >= 90
          ? "excellent"
          : data.percentage >= 75
            ? "good"
            : "needs improvement"}{" "}
        attendance this month.
      </p>
    </div>
  );
};

export default AttendanceSummary;
