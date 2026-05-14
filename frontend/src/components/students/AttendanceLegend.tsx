import React from "react";

interface AttendanceLegendProps {
  presentCount: number;
  absentCount: number;
  holidayCount: number;
  sundayCount: number;
  lateCount?: number;
  showLate?: boolean;
  holidayColor?: "amber" | "purple";
}

const AttendanceLegend: React.FC<AttendanceLegendProps> = ({
  presentCount,
  absentCount,
  holidayCount,
  sundayCount,
  lateCount,
  showLate = false,
  holidayColor = "amber",
}) => {
  return (
    <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest flex-wrap">
      <div className="flex items-center gap-2">
        <div className="size-3 rounded-full bg-emerald-500"></div>
        <span className="text-slate-500">Present ({presentCount})</span>
      </div>
      {showLate && lateCount !== undefined && (
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-amber-500"></div>
          <span className="text-slate-500">Late ({lateCount})</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="size-3 rounded-full bg-rose-500"></div>
        <span className="text-slate-500">Absent ({absentCount})</span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`size-3 rounded-full ${holidayColor === "amber" ? "bg-amber-400" : "bg-purple-500"}`}></div>
        <span className="text-slate-500">Holiday ({holidayCount})</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="size-3 rounded-full bg-red-50 border border-red-200"></div>
        <span className="text-slate-300">Sunday ({sundayCount})</span>
      </div>
    </div>
  );
};

export default AttendanceLegend;
