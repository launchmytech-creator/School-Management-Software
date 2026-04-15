import React from "react";
import { Users } from "lucide-react";

const CHART_COLORS = [
  "#4A9FD4",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

interface ClassStats {
  classId: number;
  className: string;
  totalAvg: number;
  totalPass: number;
  count: number;
  students: number;
}

interface ClassSummaryCardsProps {
  stats: ClassStats[];
  overallBestClassId?: number;
}

export const ClassSummaryCards: React.FC<ClassSummaryCardsProps> = ({
  stats,
  overallBestClassId,
}) => {
  if (stats.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((item, index) => {
        const avg = item.count > 0 ? item.totalAvg / item.count : 0;
        const passRate = item.count > 0 ? item.totalPass / item.count : 0;
        const isBest = overallBestClassId === item.classId;

        return (
          <div
            key={item.classId}
            className={`bg-white rounded-2xl border-2 p-6 transition-all ${
              isBest
                ? "border-emerald-300 shadow-lg shadow-emerald-100"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${CHART_COLORS[index % CHART_COLORS.length]}20` }}
                >
                  <Users
                    className="w-6 h-6"
                    style={{ color: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{item.className}</h3>
                  <p className="text-xs text-slate-500">{item.students} students</p>
                </div>
              </div>
              {isBest && (
                <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                  Best
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Average Marks</span>
                <span
                  className="text-2xl font-black"
                  style={{ color: CHART_COLORS[index % CHART_COLORS.length] }}
                >
                  {avg.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${avg}%`,
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Pass Rate</span>
                <span className="font-semibold">{passRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
