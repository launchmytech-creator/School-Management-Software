import React, { useState } from "react";
import { Filter, ChevronDown } from "lucide-react";

type FilterOption = "all" | "assigned" | "unassigned";

interface AllocationFilterBarProps {
  filterOption: FilterOption;
  onChange: (option: FilterOption) => void;
  totalCount: number;
  assignedCount: number;
  unassignedCount: number;
}

export const AllocationFilterBar: React.FC<AllocationFilterBarProps> = ({
  filterOption,
  onChange,
  totalCount,
  assignedCount,
  unassignedCount,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const label =
    filterOption === "all" ? "All Classes" : filterOption === "assigned" ? "Assigned" : "Unassigned";

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <Filter className="size-4 text-slate-400" />
          {label}
          <ChevronDown className={`size-4 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
        </button>
        {showDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
            <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-20 min-w-[160px]">
              {[
                { value: "all" as FilterOption, label: `All (${totalCount})` },
                { value: "assigned" as FilterOption, label: `Assigned (${assignedCount})` },
                { value: "unassigned" as FilterOption, label: `Unassigned (${unassignedCount})` },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setShowDropdown(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                    filterOption === option.value
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
