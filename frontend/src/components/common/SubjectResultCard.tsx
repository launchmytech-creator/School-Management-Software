import React from "react";
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { subjectIcon } from "../../lib/subject-utils";
import type { ExamResult, ClassPerformance } from "../../services/examResultService";

interface SubjectStats {
  evaluated: number;
  absent: number;
  total: number;
  avgMarks: number;
}

interface SubjectResultCardProps {
  subjectResults: ExamResult[];
  subjectStats: SubjectStats;
  isExpanded: boolean;
  performance?: ClassPerformance;
  onToggle: () => void;
}

const getGradeColor = (grade: string) => {
  switch (grade.toUpperCase()) {
    case "A":
    case "A+":
      return "bg-emerald-100 text-emerald-700";
    case "B":
    case "B+":
      return "bg-blue-100 text-blue-700";
    case "C":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-red-100 text-red-700";
  }
};

export const SubjectResultCard: React.FC<SubjectResultCardProps> = ({
  subjectResults,
  subjectStats,
  isExpanded,
  performance,
  onToggle,
}) => {
  const firstResult = subjectResults[0];
  const actualSubjectName = firstResult?.subjectName || "Unknown";
  const classInfo = firstResult?.classSection
    ? `${firstResult.className} - ${firstResult.classSection}`
    : firstResult?.className || "";
  const { icon: subjectIconName, bg: iconBg, text: iconText } = subjectIcon(actualSubjectName);
  const studentInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div
        className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={onToggle}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-slate-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-500" />
              )}
            </div>
            <div className={`p-2 rounded-lg ${iconBg}`}>
              <span
                className={`material-symbols-outlined text-lg ${iconText}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {subjectIconName}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900">
                  {actualSubjectName}
                </h3>
                {performance?.subjectCode && (
                  <span className="text-xs text-slate-400">
                    {performance.subjectCode}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">
                {classInfo} • {subjectStats.total} students
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
              <CheckCircle className="w-4 h-4" />
              {subjectStats.evaluated} Evaluated
            </span>
            {subjectStats.absent > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                <XCircle className="w-4 h-4" />
                {subjectStats.absent} Absent
              </span>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Roll No
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Admission No
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Marks
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjectResults.map((result) => (
                <tr
                  key={result.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">
                    {result.rollNumber || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600">
                        {studentInitials(result.studentName)}
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {result.studentName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                    {result.admissionNumber}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-sm font-semibold ${result.isAbsent ? "text-red-500" : "text-slate-900"}`}
                    >
                      {result.isAbsent
                        ? "-"
                        : `${result.marksObtained}/${result.maxMarks}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {result.isAbsent ? (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                        AB
                      </span>
                    ) : (
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full ${getGradeColor(result.grade)}`}
                      >
                        {result.grade}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {result.isAbsent ? (
                      <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
                        <XCircle className="w-4 h-4" /> Absent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" /> Evaluated
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {performance && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg">
                {Number(performance.maxMarks).toFixed(2)} marks
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">Average:</span>
              <span className="text-sm font-bold text-slate-900">
                {performance.averageMarks != null && !isNaN(performance.averageMarks)
                  ? Number(performance.averageMarks).toFixed(1)
                  : "-"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">Highest:</span>
              <span className="text-sm font-bold text-emerald-600">
                {performance.highestMarks || "-"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">Lowest:</span>
              <span className="text-sm font-bold text-red-600">
                {performance.lowestMarks || "-"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">Evaluated:</span>
              <span className="text-sm font-bold text-slate-900">
                {subjectStats.evaluated}/{subjectStats.total}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
