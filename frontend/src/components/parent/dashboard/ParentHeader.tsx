import React from "react";
import type { ChildOverview } from "../../../hooks/queries/useDashboard";

interface ParentHeaderProps {
  child: ChildOverview;
  academicYear?: string;
}

export const ParentHeader: React.FC<ParentHeaderProps> = ({
  child,
  academicYear,
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#4A9FD4] to-[#2563eb] rounded-3xl shadow-lg">
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative p-8 flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/20 border-2 border-white/30 flex-shrink-0">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${child.student.id}`}
            alt={child.student.full_name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1">
          <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">
            Student Profile
          </p>
          <h2 className="text-2xl font-black text-white">
            {child.student.full_name}
          </h2>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-sm text-white/80">
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                school
              </span>
              {child.student.class_name || "N/A"}
              {child.student.class_section
                ? ` - Section ${child.student.class_section}`
                : ""}
            </span>
            <span className="w-1 h-1 bg-white/40 rounded-full" />
            {academicYear && (
              <span className="flex items-center gap-1.5 text-sm text-white/80">
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  calendar_month
                </span>
                {academicYear}
              </span>
            )}
          </div>
        </div>

        {/* <button
          onClick={() => navigate(`/parent/students/${child.student.id}`)}
          className="px-5 py-2.5 bg-white text-[#4A9FD4] rounded-xl text-sm font-bold hover:bg-white/90 transition-colors shadow-md"
        >
          View Profile
        </button> */}
      </div>
    </div>
  );
};
