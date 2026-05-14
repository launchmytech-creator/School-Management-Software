import React from "react";
import { type StudentResult } from "../../services/examResultService";
import { gradeColor, progressColor, subjectIcon } from "../../lib/subject-utils";

interface SubjectCardProps {
  result: StudentResult;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ result }) => {
  const pct = Math.round((result.marksObtained / result.maxMarks) * 100);
  const { bar, label } = progressColor(pct);
  const { icon, bg, text } = subjectIcon(result.subjectName);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${text}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {icon}
            </span>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              {result.subjectName}
            </h4>
            <p className="text-[11px] text-slate-400">
              Exam: {result.examName}
            </p>
          </div>
        </div>
        <span
          className={`text-xs font-black px-2 py-0.5 rounded-lg ${gradeColor(result.grade)}`}
        >
          {result.grade}
        </span>
      </div>

      <div className="mb-3">
        <span className="text-3xl font-black text-slate-900">
          {result.marksObtained}
        </span>
        <span className="text-sm text-slate-400 font-semibold">
          {" "}
          / {result.maxMarks}
        </span>
      </div>

      <div className="space-y-1">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wide">
          <span>Progress</span>
          <span className={bar.replace("bg-", "text-")}>{label}</span>
        </div>
      </div>
    </div>
  );
};

export default SubjectCard;
