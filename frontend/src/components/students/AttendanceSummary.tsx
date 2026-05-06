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
  size?: "sm" | "lg";
}

const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({ data, studentName, size = "sm" }) => {
  const firstName = studentName?.split(" ")[0] ?? "Student";
  const isLarge = size === "lg";
  const chartSize = isLarge ? "w-48 h-48" : "w-32 h-32";
  const innerRadius = isLarge ? 60 : 40;
  const outerRadius = isLarge ? 80 : 55;
  const titleSize = isLarge ? "text-xl" : "text-lg";
  const textSize = isLarge ? "text-4xl" : "text-3xl";
  const labelSize = isLarge ? "text-[10px]" : "text-[8px]";
  const padding = isLarge ? "p-8" : "p-4";
  const itemPadding = isLarge ? "p-3" : "p-2";
  const itemTextSize = isLarge ? "text-sm" : "text-xs";
  const itemNumberSize = isLarge ? "text-xl" : "text-base";

  return (
    <div className={`bg-white rounded-2xl ${padding} shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center`}>
      <h3 className={`${titleSize} font-black text-slate-900 tracking-tight mb-4`}>
        Attendance Summary
      </h3>

      <div className={`relative ${chartSize} mb-4`}>
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
              innerRadius={innerRadius}
              outerRadius={outerRadius}
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
          <span className={`${textSize} font-black text-slate-800 tracking-tight`}>
            {data.percentage}%
          </span>
          <span className={`${labelSize} font-black text-slate-400 uppercase tracking-widest`}>
            Attendance
          </span>
        </div>
      </div>

      <div className={`w-full space-y-2 mb-4`}>
        <div className={`flex justify-between items-center ${itemPadding} bg-emerald-50 rounded-xl`}>
          <span className={`${itemTextSize} font-bold text-emerald-600`}>Working Days</span>
          <span className={`${itemNumberSize} font-black text-emerald-700`}>
            {data.workingDays}
          </span>
        </div>
        <div className={`flex justify-between items-center ${itemPadding} bg-rose-50 rounded-xl`}>
          <span className={`${itemTextSize} font-bold text-rose-600`}>Present Days</span>
          <span className={`${itemNumberSize} font-black text-rose-700`}>
            {data.presentCount}
          </span>
        </div>
        <div className={`flex justify-between items-center ${itemPadding} bg-slate-50 rounded-xl`}>
          <span className={`${itemTextSize} font-bold text-slate-500`}>Absent Days</span>
          <span className={`${itemNumberSize} font-black text-slate-700`}>
            {data.absentCount}
          </span>
        </div>
      </div>

      <p className={`${isLarge ? "text-xs" : "text-[10px]"} font-bold text-slate-400 leading-relaxed px-2`}>
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
