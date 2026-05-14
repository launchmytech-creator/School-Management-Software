import React from "react";
import type { Holiday } from "../../services/holidayService";

interface HolidayCardProps {
  holiday: Holiday;
}

export const HolidayCard: React.FC<HolidayCardProps> = ({ holiday }) => {
  const getMonthName = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  };

  return (
    <div className="flex items-center gap-4 group">
      <div className="w-12 h-12 rounded-lg bg-slate-100 flex flex-col items-center justify-center shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase">
          {getMonthName(new Date(holiday.holidayDate))}
        </span>
        <span className="text-lg font-bold text-slate-900 leading-none">
          {new Date(holiday.holidayDate).getDate()}
        </span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-900">
          {holiday.description}
        </p>
        {holiday.academicYearName && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-700 font-bold uppercase tracking-tighter">
            {holiday.academicYearName}
          </span>
        )}
      </div>
    </div>
  );
};
