import React from "react";
import { BookOpen } from "lucide-react";
import type {
  ClassSubjectComparisonData,
  ClassSubjectComparisonSubject,
} from "../../services/examResultService";

const CHART_COLORS = [
  "#4A9FD4",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

interface ClassComparisonTableProps {
  data: ClassSubjectComparisonData;
  getBestClass: (subject: ClassSubjectComparisonSubject) => ClassSubjectComparisonSubject["classes"][number] | null;
}

export const ClassComparisonTable: React.FC<ClassComparisonTableProps> = ({
  data,
  getBestClass,
}) => {
  if (!data || data.subjects.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <BookOpen className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Subject-wise Performance</h3>
            <p className="text-xs text-slate-500">Average marks and pass rate by subject</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50">
                Subject
              </th>
              {data.subjects[0]?.classes.map((cls, idx) => (
                <th
                  key={cls.classId}
                  colSpan={2}
                  className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider"
                  style={{ color: CHART_COLORS[idx % CHART_COLORS.length] }}
                >
                  {cls.className}
                </th>
              ))}
            </tr>
            <tr className="bg-slate-50">
              <th className="px-6 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-50" />
              {data.subjects[0]?.classes.map((cls) => (
                <React.Fragment key={`header-${cls.classId}`}>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-slate-400">Avg</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-slate-400">Pass%</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.subjects.map((subject) => {
              const best = getBestClass(subject);
              return (
                <tr key={subject.subjectId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 sticky left-0 bg-white">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-100 rounded-lg">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="font-semibold text-slate-800">{subject.subjectName}</span>
                    </div>
                  </td>
                  {subject.classes.map((cls, idx) => {
                    const isBest = best?.classId === cls.classId;
                    return (
                      <React.Fragment key={`${subject.subjectId}-${cls.classId}`}>
                        <td className="px-4 py-4 text-center">
                          <span className={`text-lg font-bold ${isBest ? "text-emerald-600" : "text-slate-700"}`}>
                            {cls.averageMarks}%
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${cls.passRate}%`,
                                  backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                                }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-slate-600">{cls.passRate}%</span>
                          </div>
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
        <div className="flex flex-wrap gap-4 justify-center">
          {data.subjects[0]?.classes.map((cls, idx) => (
            <div key={cls.classId} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
              />
              <span className="text-sm font-medium text-slate-600">{cls.className}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
