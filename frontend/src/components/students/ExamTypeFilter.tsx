import React from "react";
import { EXAM_TYPES } from "../../lib/subject-utils";

interface ExamTypeFilterProps {
  activeType: string;
  onChange: (type: string) => void;
}

const ExamTypeFilter: React.FC<ExamTypeFilterProps> = ({ activeType, onChange }) => {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-6">
      {EXAM_TYPES.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
            activeType === t
              ? "bg-[#1E3A5F] text-white border-[#1E3A5F]"
              : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
};

export default ExamTypeFilter;
