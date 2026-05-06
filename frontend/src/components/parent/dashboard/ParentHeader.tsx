import React, { useState, useRef, useEffect } from "react";
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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasMultipleChildren = children.length > 1;

  return (
    <div className="relative  bg-gradient-to-br from-[#4A9FD4] to-[#2563eb] rounded-3xl shadow-lg">
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

        {hasMultipleChildren && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white text-sm font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                swap_horiz
              </span>
              Switch Student
              <span className="material-symbols-outlined text-[18px]">
                {isDropdownOpen ? "expand_less" : "expand_more"}
              </span>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                {children.map((c) => (
                  <button
                    key={c.student.id}
                    onClick={() => {
                      onChildSelect?.(c.student.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${
                      c.student.id === selectedChildId ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.student.id}`}
                        alt={c.student.full_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-800">
                        {c.student.full_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {c.student.class_name}
                        {c.student.class_section
                          ? ` - Section ${c.student.class_section}`
                          : ""}
                      </p>
                    </div>
                    {c.student.id === selectedChildId && (
                      <span className="material-symbols-outlined text-[18px] text-green-600 ml-auto">
                        check_circle
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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
