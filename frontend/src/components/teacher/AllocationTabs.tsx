import React from "react";

interface AllocationTabsProps {
  activeTab: "incharge" | "allocations";
  onChange: (tab: "incharge" | "allocations") => void;
  classesCount: number;
  allocationsCount: number;
}

export const AllocationTabs: React.FC<AllocationTabsProps> = ({
  activeTab,
  onChange,
  classesCount,
  allocationsCount,
}) => {
  return (
    <div className="flex border-b border-slate-100">
      <button
        onClick={() => onChange("incharge")}
        className={`flex-1 px-6 py-5 text-sm font-bold transition-colors relative ${
          activeTab === "incharge" ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <span className="flex items-center justify-center gap-2">
          Class Incharge
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "incharge" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
            }`}
          >
            {classesCount}
          </span>
        </span>
        {activeTab === "incharge" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
      </button>
      <button
        onClick={() => onChange("allocations")}
        className={`flex-1 px-6 py-5 text-sm font-bold transition-colors relative ${
          activeTab === "allocations" ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <span className="flex items-center justify-center gap-2">
          Subject Allocations
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "allocations" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
            }`}
          >
            {allocationsCount}
          </span>
        </span>
        {activeTab === "allocations" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
      </button>
    </div>
  );
};
