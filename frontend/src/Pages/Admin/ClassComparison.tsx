import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  examResultService,
  type ClassComparisonData,
  type ClassComparisonSummary,
} from "../../services/examResultService";
import { classService } from "../../services/classService";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { useNotification } from "../../context/NotificationContext";
import { formatDate } from "../../lib/utils";
import { TrendingUp, Users, Award, Target, Loader2 } from "lucide-react";

const CHART_COLORS = [
  "#4A9FD4",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

const EXAM_TYPES = [
  { value: "", label: "All Types" },
  { value: "Unit Test", label: "Unit Test" },
  { value: "Half Yearly", label: "Half Yearly" },
  { value: "Annual", label: "Annual" },
];

interface ClassSection {
  id: number;
  name: string;
  section: string | null;
}

const ClassComparison: React.FC = () => {
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();

  const [uniqueClassNames, setUniqueClassNames] = useState<string[]>(
    []
  );
  const [selectedClassName, setSelectedClassName] = useState<string>("");
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [selectedExamType, setSelectedExamType] = useState<string>("");
  const [comparisonData, setComparisonData] = useState<ClassComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      setLoadingClasses(true);
      const data = await classService.getClasses(selectedYear?.id || undefined);
      
      const uniqueNames = [...new Set(data.map(c => c.name))].sort();
      setUniqueClassNames(uniqueNames);
    } catch {
      showNotification("Failed to fetch classes", "error");
    } finally {
      setLoadingClasses(false);
    }
  }, [selectedYear, showNotification]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const fetchSections = useCallback(async (className: string) => {
    if (!className) {
      setSections([]);
      return;
    }

    setLoadingSections(true);
    try {
      const data = await examResultService.getClassesForComparison(
        className,
        selectedYear?.id ? parseInt(selectedYear.id) : undefined
      );
      setSections(data);
    } catch {
      showNotification("Failed to fetch class sections", "error");
      setSections([]);
    } finally {
      setLoadingSections(false);
    }
  }, [selectedYear, showNotification]);

  useEffect(() => {
    fetchSections(selectedClassName);
  }, [selectedClassName, fetchSections]);

  const fetchComparison = useCallback(async () => {
    if (sections.length === 0) return;

    const classIds = sections.map(s => s.id);
    setLoading(true);
    try {
      const data = await examResultService.getClassComparison(
        classIds,
        selectedYear?.id ? parseInt(selectedYear.id) : undefined,
        selectedExamType || undefined
      );
      setComparisonData(data);
    } catch {
      showNotification("Failed to fetch comparison data", "error");
    } finally {
      setLoading(false);
    }
  }, [sections, selectedYear, selectedExamType, showNotification]);

  useEffect(() => {
    if (sections.length > 0) {
      fetchComparison();
    } else {
      setComparisonData(null);
    }
  }, [sections, selectedExamType, fetchComparison]);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClassName(e.target.value);
    setComparisonData(null);
  };

  const handleClearSelection = () => {
    setSelectedClassName("");
    setSections([]);
    setSelectedExamType("");
    setComparisonData(null);
  };

  const getBestClass = (data: ClassComparisonSummary[]) => {
    if (data.length === 0) return null;
    return data.reduce((best, current) =>
      current.averageMarks > best.averageMarks ? current : best
    );
  };

  const bestClass = comparisonData ? getBestClass(comparisonData.summary) : null;

  const renderEmptyState = () => (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Target className="w-10 h-10 text-slate-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-700 mb-2">
        Select a Class to Compare
      </h3>
      <p className="text-slate-500 max-w-md mx-auto">
        Choose a class from the dropdown above to compare performance across all its sections.
      </p>
    </div>
  );

  const renderSummaryCards = () => {
    if (!comparisonData || comparisonData.summary.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {comparisonData.summary.map((item, index) => {
          const isBest = bestClass?.classId === item.classId;
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
                    <p className="text-xs text-slate-500">
                      {item.totalStudents} students
                    </p>
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
                    {item.averageMarks}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.averageMarks}%`,
                      backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Pass Rate</span>
                  <span className="font-semibold">{item.passRate}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderBarChart = () => {
    if (!comparisonData || comparisonData.summary.length === 0) return null;

    const chartData = comparisonData.summary.map((item, index) => ({
      name: item.className,
      marks: item.averageMarks,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Average Marks Comparison</h3>
            <p className="text-xs text-slate-500">Performance across all sections of {selectedClassName}</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 12, fill: "#64748b" }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value}%`, "Average Marks"]}
            />
            <Bar dataKey="marks" radius={[0, 8, 8, 0]}>
              {chartData.map((entry, index) => (
                <rect key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderLineChart = () => {
    if (!comparisonData || comparisonData.trend.length === 0) return null;

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <Award className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Performance Trend</h3>
            <p className="text-xs text-slate-500">Average marks across exams over time</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={comparisonData.trend} margin={{ left: 20, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="examName"
              tick={{ fontSize: 11, fill: "#64748b" }}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
            />
            <Legend />
            {comparisonData.trend[0] &&
              Object.keys(comparisonData.trend[0])
                .filter((k) => k.startsWith("class_"))
                .map((key, index) => {
                  const classId = key.replace("class_", "");
                  const classNameKey = `className_${classId}`;
                  const className =
                    comparisonData.trend[0]?.[classNameKey] ||
                    `Class ${classId}`;
                  return (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={String(className)}
                      stroke={CHART_COLORS[index % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4, fill: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                  );
                })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderComparisonTable = () => {
    if (!comparisonData || comparisonData.exams.length === 0) return null;

    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Exam-wise Comparison</h3>
              <p className="text-xs text-slate-500">Detailed comparison by exam</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Exam
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Date
                </th>
            {comparisonData.exams[0]?.results.map((r) => (
                      <th
                        key={r.classId}
                        className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider"
                      >
                        {r.className}
                      </th>
                    ))}
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Best
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisonData.exams.map((exam) => {
                const maxMarks = Math.max(...exam.results.map((r) => r.averageMarks));
                const bestResult = exam.results.find((r) => r.averageMarks === maxMarks);
                return (
                  <tr key={exam.examId} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-800">{exam.examName}</p>
                        <p className="text-xs text-slate-400">{exam.examType}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(exam.examDate)}
                    </td>
                    {exam.results.map((result) => (
                      <td
                        key={result.classId}
                        className="px-6 py-4 text-center"
                      >
                        <span
                          className={`font-bold ${
                            result.averageMarks === maxMarks
                              ? "text-emerald-600"
                              : "text-slate-600"
                          }`}
                        >
                          {result.averageMarks}%
                        </span>
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center">
                      <span
                        className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold"
                        style={{
                          color: CHART_COLORS[
                            exam.results.findIndex((r) => r.classId === bestResult?.classId) %
                              CHART_COLORS.length
                          ],
                        }}
                      >
                        {bestResult?.className}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Class Performance Comparison</h1>
        <p className="text-sm text-slate-500 mt-1">
          Compare performance across sections of the same class
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Academic Year */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Academic Year
            </label>
            <div className="px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-600">
              {selectedYear?.name || "All Years"}
            </div>
          </div>

          {/* Class Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Class
            </label>
            <select
              value={selectedClassName}
              onChange={handleClassChange}
              disabled={loadingClasses}
              className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Select a class...</option>
              {uniqueClassNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Type */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Exam Type
            </label>
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
              disabled={!selectedClassName}
              className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {EXAM_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Sections Info */}
        {selectedClassName && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">
                  Comparing sections:
                </span>
                {loadingSections ? (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading sections...</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {sections.length > 0 ? (
                      sections.map((section) => (
                        <span
                          key={section.id}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                        >
                          {section.section || "No Section"}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-amber-600">
                        No sections found for this class
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={handleClearSelection}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 opacity-30" />
        </div>
      ) : !selectedClassName ? (
        renderEmptyState()
      ) : sections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">
            No Sections Found
          </h3>
          <p className="text-slate-500">
            No sections found for {selectedClassName}. Please ensure classes are properly configured.
          </p>
        </div>
      ) : comparisonData && comparisonData.summary.length > 0 ? (
        <div className="space-y-6">
          {renderSummaryCards()}
          {renderBarChart()}
          {renderLineChart()}
          {renderComparisonTable()}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">
            No Exam Data Available
          </h3>
          <p className="text-slate-500">
            No exam results found for the selected class. Please ensure marks have been entered for the exams.
          </p>
        </div>
      )}
    </div>
  );
};

export default ClassComparison;
