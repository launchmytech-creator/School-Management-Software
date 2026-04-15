import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { subjectColor } from "../../lib/subject-utils";

interface PerformanceTrendChartProps {
  trendData: Record<string, number | string>[];
  allSubjects: string[];
  activeSubject: string;
  onSubjectChange: (subject: string) => void;
  height?: "sm" | "md";
  showFullReport?: boolean;
  onFullReport?: () => void;
}

const PerformanceTrendChart: React.FC<PerformanceTrendChartProps> = ({
  trendData,
  allSubjects,
  activeSubject,
  onSubjectChange,
  height = "md",
  showFullReport = false,
  onFullReport,
}) => {
  const chartHeight = height === "sm" ? "h-56" : "h-64";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="font-bold text-slate-900">Performance Trend</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Academic progress over recent examinations
          </p>
        </div>
        {showFullReport && (
          <button
            onClick={onFullReport}
            className="flex items-center gap-1 text-xs font-bold text-[#4A9FD4] hover:underline"
          >
            <span className="material-symbols-outlined text-[14px]">
              bar_chart
            </span>
            Full Report
          </button>
        )}
      </div>

      <div className={`mt-4 ${chartHeight}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trendData}
            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
              formatter={(val: number) => [`${val}%`]}
            />
            {allSubjects.map((sub) => (
              <Line
                key={sub}
                type="monotone"
                dataKey={sub}
                stroke={subjectColor(sub)}
                strokeWidth={activeSubject === sub ? 3 : 1.5}
                dot={{
                  r: activeSubject === sub ? 5 : 3,
                  fill: subjectColor(sub),
                }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {allSubjects.map((sub) => (
          <button
            key={sub}
            onClick={() => onSubjectChange(sub)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
              activeSubject === sub
                ? "text-white shadow-sm"
                : "text-slate-500 bg-slate-100 hover:bg-slate-200"
            }`}
            style={
              activeSubject === sub
                ? { backgroundColor: subjectColor(sub) }
                : {}
            }
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: subjectColor(sub) }}
            />
            {sub}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PerformanceTrendChart;
