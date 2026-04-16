import React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { LoadingSpinner } from "../common/LoadingSpinner";

interface CalendarDay {
  date: Date;
  dateStr: string;
  status: "present" | "absent" | "holiday" | "sunday" | "none";
  isCurrentMonth: boolean;
  holiday?: { description: string } | undefined;
}

interface AttendanceCalendarProps {
  calendarDays: CalendarDay[];
  loading: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  monthYear: string;
  onPrev: () => void;
  onNext: () => void;
}

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const getDayClass = (day: CalendarDay): string => {
  if (day.status === "present")
    return "bg-emerald-500 text-white shadow-md shadow-emerald-500/10";
  if (day.status === "absent")
    return "bg-rose-500 text-white shadow-md shadow-rose-500/10";
  if (day.status === "holiday")
    return "bg-amber-400 text-amber-900 shadow-md shadow-amber-400/10";
  if (day.status === "sunday")
    return "bg-red-50 text-red-400 border border-red-100";
  if (!day.isCurrentMonth) return "bg-transparent text-slate-200";
  return "bg-slate-50 text-slate-300";
};

const getDayTitle = (day: CalendarDay): string => {
  if (day.holiday?.description) return day.holiday.description;
  if (day.status === "sunday") return "Sunday";
  return "";
};

const truncateHoliday = (desc: string): string => {
  return desc.length > 10 ? desc.substring(0, 8) + ".." : desc;
};

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  calendarDays,
  loading,
  canGoPrev,
  canGoNext,
  monthYear,
  onPrev,
  onNext,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <CalendarDays size={20} className="text-blue-500" />
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {monthYear} Attendance
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onPrev}
            disabled={!canGoPrev}
            className={`p-1 transition-colors ${canGoPrev ? "text-slate-300 hover:text-slate-600" : "text-slate-200 cursor-not-allowed"}`}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className={`p-1 transition-colors ${canGoNext ? "text-slate-300 hover:text-slate-600" : "text-slate-200 cursor-not-allowed"}`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4 mb-4">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className={`text-[10px] font-black text-center uppercase tracking-widest ${d === "SUN" ? "text-red-400" : "text-slate-300"}`}
          >
            {d}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="md" message="Loading attendance..." />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-4 flex-1">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-sm font-black transition-all cursor-default relative ${getDayClass(day)}`}
              title={getDayTitle(day)}
            >
              <span>{day.date.getDate()}</span>
              {day.status === "holiday" && day.holiday && (
                <span className="text-[6px] font-bold mt-0.5 px-1 text-center leading-tight truncate max-w-full">
                  {truncateHoliday(day.holiday.description)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
