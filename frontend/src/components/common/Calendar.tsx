import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSunday: boolean;
  holiday?: { id?: number; description: string; holidayDate?: string };
  attendance?: "present" | "absent" | "leave" | "half_day" | null;
}

export type CalendarItemType = "holiday" | "attendance" | "teacher";

interface CalendarProps {
  calendarDays: CalendarDay[];
  loading?: boolean;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  monthYear: string;
  onPrev: () => void;
  onNext: () => void;
  itemType?: CalendarItemType;
  title?: string;
  onDayClick?: (day: CalendarDay) => void;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getHolidayClass = (day: CalendarDay): string => {
  if (!day.isCurrentMonth) return "";
  if (day.holiday)
    return "border-2 border-emerald-500 bg-emerald-100 shadow-sm";
  if (day.isSunday) return "border border-red-200 bg-red-50";
  if (!day.holiday && !day.isToday && !day.isSunday)
    return "border border-slate-100 hover:bg-slate-50";
  return "";
};

const getAttendanceClass = (day: CalendarDay): string => {
  if (!day.isCurrentMonth) return "bg-transparent text-slate-200";
  if (day.attendance === "present")
    return "border border-emerald-500 bg-emerald-100";
  if (day.attendance === "absent") return "border border-rose-500 bg-rose-100";
  if (day.attendance === "leave") return "border border-amber-500 bg-amber-100";
  if (day.attendance === "half_day")
    return "border border-orange-500 bg-orange-100";
  if (day.isSunday) return "border border-red-200 bg-red-50";
  if (day.holiday) return "border border-amber-500 bg-amber-100";
  if (day.isToday) return "border-2 border-blue-500 bg-blue-50";
  return "border border-slate-100 hover:bg-slate-50";
};

const getTeacherClass = (day: CalendarDay): string => {
  if (!day.isCurrentMonth) return "bg-transparent text-slate-200";
  if (day.attendance === "present")
    return "border border-green-500 bg-green-100";
  if (day.attendance === "absent") return "border border-red-500 bg-red-100";
  if (day.attendance === "leave")
    return "border border-yellow-500 bg-yellow-100";
  if (day.isSunday) return "border border-red-200 bg-red-50";
  if (day.isToday) return "border-2 border-blue-500 bg-blue-50";
  return "border border-slate-100 hover:bg-slate-50";
};

const getDayClass = (day: CalendarDay, itemType: CalendarItemType): string => {
  if (day.isToday && !day.holiday && !day.attendance) {
    return "border-2 border-blue-500 bg-blue-50";
  }

  switch (itemType) {
    case "holiday":
      return getHolidayClass(day);
    case "attendance":
      return getAttendanceClass(day);
    case "teacher":
      return getTeacherClass(day);
    default:
      return getHolidayClass(day);
  }
};

const getTextClass = (day: CalendarDay, itemType: CalendarItemType): string => {
  if (!day.isCurrentMonth) return "text-slate-300";
  if (day.holiday) return "text-emerald-700";
  if (day.attendance === "present") return "text-emerald-700";
  if (day.attendance === "absent") return "text-rose-700";
  if (day.attendance === "leave") return "text-amber-700";
  if (day.attendance === "half_day") return "text-orange-700";
  if (day.isSunday && !day.holiday) return "text-red-500";
  if (day.isToday && !day.holiday && !day.attendance) return "text-blue-600";
  return "text-slate-700";
};

const getDayLabel = (
  day: CalendarDay,
  itemType: CalendarItemType,
): React.ReactNode => {
  if (day.holiday && day.isCurrentMonth) {
    return (
      <p className="text-[10px] mt-1 font-bold text-emerald-700 leading-tight truncate">
        {day.holiday.description}
      </p>
    );
  }

  if (day.isToday && day.isCurrentMonth) {
    return (
      <p className="text-[10px] mt-1 font-bold text-blue-600 uppercase">
        Today
      </p>
    );
  }

  if (day.isSunday && day.isCurrentMonth && !day.holiday) {
    return (
      <p className="text-[10px] mt-1 font-bold text-red-500 uppercase">Sun</p>
    );
  }

  if (day.attendance && day.isCurrentMonth) {
    const labels: Record<string, string> = {
      present: "P",
      absent: "A",
      leave: "L",
      half_day: "HD",
    };
    return (
      <p className="text-[10px] mt-1 font-bold uppercase">
        {labels[day.attendance]}
      </p>
    );
  }

  return null;
};

export const Calendar: React.FC<CalendarProps> = ({
  calendarDays,
  loading = false,
  canGoPrev = true,
  canGoNext = true,
  monthYear,
  onPrev,
  onNext,
  itemType = "holiday",
  title,
  onDayClick,
}) => {
  const getContainerClass = () => {
    switch (itemType) {
      case "attendance":
        return "bg-white rounded-2xl shadow-sm border border-slate-200 p-4";
      case "teacher":
        return "bg-white rounded-xl shadow-sm border border-slate-200 p-6";
      default:
        return "bg-white rounded-xl shadow-sm border border-slate-200 p-6";
    }
  };

  return (
    <div className={getContainerClass()}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {title && (
            <h2 className="font-bold text-lg text-slate-900">{title}</h2>
          )}
          {!title && itemType === "attendance" && (
            <h2 className="font-bold text-lg text-slate-900">
              Attendance Calendar
            </h2>
          )}
          {!title && itemType === "teacher" && (
            <h2 className="font-bold text-lg text-slate-900">
              Attendance Calendar
            </h2>
          )}
          {!title && itemType === "holiday" && (
            <h2 className="font-bold text-lg text-slate-900">
              Academic Calendar
            </h2>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onPrev}
            disabled={!canGoPrev}
            className={`p-1 hover:bg-slate-100 rounded-full transition-colors ${
              !canGoPrev
                ? "text-slate-200 cursor-not-allowed"
                : "text-slate-600"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-slate-900 text-lg">{monthYear}</span>
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className={`p-1 hover:bg-slate-100 rounded-full transition-colors ${
              !canGoNext
                ? "text-slate-200 cursor-not-allowed"
                : "text-slate-600"
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map((day, index) => (
          <div
            key={day}
            className={`text-center py-2 text-xs font-bold uppercase tracking-widest ${
              index === 0 ? "text-red-500" : "text-slate-400"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="md" message="Loading calendar..." />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              onClick={() => onDayClick?.(day)}
              className={`
                h-16 p-1.5 rounded-lg transition-colors cursor-default
                ${getDayClass(day, itemType)}
                ${onDayClick ? "cursor-pointer" : ""}
              `}
            >
              <span
                className={`text-xs font-bold ${getTextClass(day, itemType)}`}
              >
                {day.date.getDate()}
              </span>
              {getDayLabel(day, itemType)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
