import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, GraduationCap, Calendar, Hash, ChevronRight } from "lucide-react";
import type { ChildOverview } from "../../../hooks/queries/useDashboard";

interface ParentHeaderProps {
  child: ChildOverview;
  academicYear?: string;
  children?: ChildOverview[];
  selectedChildId?: number | null;
  onChildSelect?: (childId: number) => void;
}

export const ParentHeader: React.FC<ParentHeaderProps> = ({
  child,
  academicYear,
  children = [],
  selectedChildId,
  onChildSelect,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasMultipleChildren = children.length > 1;
  const attPct = parseFloat(child.attendance_summary?.attendance_percentage || "0");
  const pendingFee = parseFloat(child.fee_summary?.pending_fees || "0");

  const attColor = attPct >= 75 ? "text-emerald-300" : attPct >= 50 ? "text-amber-300" : "text-rose-300";
  const attBg = attPct >= 75 ? "bg-emerald-500/20" : attPct >= 50 ? "bg-amber-500/20" : "bg-rose-500/20";

  return (
    <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-xl overflow-hidden">
      {/* decorative blobs */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
      <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-white/5 rounded-full" />
      <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-white/5 rounded-full" />

      <div className="relative p-6">
        {/* top row */}
        <div className="flex items-start gap-5">
          {/* avatar */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-white/15 border-2 border-white/30 overflow-hidden shadow-lg">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${child.student.id}`}
                alt={child.student.full_name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* name + meta */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-0.5">
              Student
            </p>
            <h2 className="text-xl font-black text-white leading-tight truncate">
              {child.student.full_name}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
              <span className="flex items-center gap-1 text-xs text-blue-200">
                <GraduationCap size={12} />
                {child.student.class_name}
                {child.student.class_section ? ` – ${child.student.class_section}` : ""}
              </span>
              {child.student.roll_number && (
                <>
                  <span className="w-0.5 h-3 bg-white/20 rounded" />
                  <span className="flex items-center gap-1 text-xs text-blue-200">
                    <Hash size={12} />
                    Roll {child.student.roll_number}
                  </span>
                </>
              )}
              {academicYear && (
                <>
                  <span className="w-0.5 h-3 bg-white/20 rounded" />
                  <span className="flex items-center gap-1 text-xs text-blue-200">
                    <Calendar size={12} />
                    {academicYear}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* child switcher */}
          {hasMultipleChildren && (
            <div className="relative flex-shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl text-white text-xs font-semibold transition-all border border-white/20"
              >
                Switch
                <ChevronDown size={13} className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 z-50">
                  {children.map((c) => (
                    <button
                      key={c.student.id}
                      onClick={() => { onChildSelect?.(c.student.id); setIsDropdownOpen(false); }}
                      type="button"
                      className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors ${c.student.id === selectedChildId ? "bg-blue-50" : ""}`}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.student.id}`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{c.student.full_name}</p>
                        <p className="text-[10px] text-slate-400">{c.student.class_name} {c.student.class_section}</p>
                      </div>
                      {c.student.id === selectedChildId && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* quick stats strip */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {/* attendance */}
          <div className={`${attBg} rounded-xl px-3 py-2.5 border border-white/10`}>
            <p className="text-[9px] font-bold text-white/60 uppercase tracking-wider mb-0.5">Attendance</p>
            <p className={`text-lg font-black ${attColor}`}>{attPct.toFixed(0)}%</p>
            <p className="text-[9px] text-white/50">
              {child.attendance_summary?.present_days ?? 0}/{child.attendance_summary?.total_days ?? 0} days
            </p>
          </div>

          {/* fee status */}
          <div className={`${pendingFee > 0 ? "bg-rose-500/20" : "bg-emerald-500/20"} rounded-xl px-3 py-2.5 border border-white/10`}>
            <p className="text-[9px] font-bold text-white/60 uppercase tracking-wider mb-0.5">Fee Pending</p>
            <p className={`text-lg font-black ${pendingFee > 0 ? "text-rose-300" : "text-emerald-300"}`}>
              {pendingFee > 0 ? `₹${(pendingFee / 1000).toFixed(1)}k` : "Clear"}
            </p>
            <p className="text-[9px] text-white/50">
              {pendingFee > 0 ? `${child.fee_summary?.terms_left ?? 0} term(s) left` : "All paid"}
            </p>
          </div>

          {/* last exam */}
          <div className="bg-purple-500/20 rounded-xl px-3 py-2.5 border border-white/10">
            <p className="text-[9px] font-bold text-white/60 uppercase tracking-wider mb-0.5">Last Exam</p>
            {child.exam_result ? (
              <>
                <p className="text-lg font-black text-purple-300">{child.exam_result.overallPercentage}%</p>
                <p className="text-[9px] text-white/50 truncate">{child.exam_result.examName}</p>
              </>
            ) : (
              <p className="text-sm font-bold text-white/40 mt-1">—</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
