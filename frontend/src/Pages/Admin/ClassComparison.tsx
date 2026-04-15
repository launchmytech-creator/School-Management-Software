import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  type ClassSubjectComparisonData,
  type ClassSubjectComparisonSubject,
} from "../../services/examResultService";
import { useClasses, useClassesForComparison, useClassSubjectComparison } from "../../hooks/queries";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { TrendingUp, Award, Target, Loader2 } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import { ClassComparisonTable } from "../../components/academic/ClassComparisonTable";
import { ClassSummaryCards } from "../../components/academic/ClassSummaryCards";

const CHART_COLORS = [
  "#4A9FD4",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

const ClassComparison: React.FC = () => {
  const { selectedYear } = useAcademicYear();
  const { data: classesData = [] } = useClasses();

  const uniqueClassNames = useMemo(() => {
    return [...new Set(classesData.map(c => c.name))].sort();
  }, [classesData]);

  const [selectedClassName, setSelectedClassName] = useState<string>("");
  const [subjectComparisonData, setSubjectComparisonData] = useState<ClassSubjectComparisonData | null>(null);

  const { data: sections = [], isLoading: loadingSections } = useClassesForComparison(
    selectedClassName,
    selectedYear?.id ? parseInt(selectedYear.id) : undefined
  );

  const classIds = useMemo(() => sections.map(s => s.id), [sections]);

  const { data: comparisonData, isLoading } = useClassSubjectComparison(
    classIds.length > 0 ? classIds : [0],
    selectedYear?.id ? parseInt(selectedYear.id) : undefined
  );

  React.useEffect(() => {
    if (comparisonData) {
      setSubjectComparisonData(comparisonData);
    } else {
      setSubjectComparisonData(null);
    }
  }, [comparisonData]);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClassName(e.target.value);
    setSubjectComparisonData(null);
  };

  const handleClearSelection = () => {
    setSelectedClassName("");
    setSubjectComparisonData(null);
  };

  const getBestClass = (subject: ClassSubjectComparisonSubject) => {
    if (subject.classes.length === 0) return null;
    return subject.classes.reduce((best, current) =>
      current.averageMarks > best.averageMarks ? current : best
    );
  };

  const getOverallBest = () => {
    if (!subjectComparisonData || subjectComparisonData.subjects.length === 0) return null;
    const averages = new Map<number, { classId: number; className: string; totalMarks: number; count: number }>();
    
    for (const subject of subjectComparisonData.subjects) {
      for (const cls of subject.classes) {
        if (!averages.has(cls.classId)) {
          averages.set(cls.classId, { classId: cls.classId, className: cls.className, totalMarks: 0, count: 0 });
        }
        const entry = averages.get(cls.classId)!;
        entry.totalMarks += cls.averageMarks;
        entry.count++;
      }
    }
    
    let best: { classId: number; className: string; avg: number } | null = null;
    for (const [classId, data] of averages) {
      const avg = data.totalMarks / data.count;
      if (!best || avg > best.avg) {
        best = { classId, className: data.className, avg };
      }
    }
    return best;
  };

  const overallBest = getOverallBest();

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

  const summaryStats = useMemo(() => {
    if (!subjectComparisonData || subjectComparisonData.subjects.length === 0) return [];

    const classStats = new Map<number, { classId: number; className: string; totalAvg: number; totalPass: number; count: number; students: number }>();
    
    for (const subject of subjectComparisonData.subjects) {
      for (const cls of subject.classes) {
        if (!classStats.has(cls.classId)) {
          classStats.set(cls.classId, {
            classId: cls.classId,
            className: cls.className,
            totalAvg: 0,
            totalPass: 0,
            count: 0,
            students: cls.totalStudents,
          });
        }
        const stats = classStats.get(cls.classId)!;
        stats.totalAvg += cls.averageMarks;
        stats.totalPass += cls.passRate;
        stats.count++;
      }
    }

    return Array.from(classStats.values());
  }, [subjectComparisonData]);

  const renderBarChart = () => {
    if (!subjectComparisonData || subjectComparisonData.subjects.length === 0) return null;

    const chartData = subjectComparisonData.subjects.map(subject => {
      const dataPoint: Record<string, any> = { subjectName: subject.subjectName };
      subject.classes.forEach((cls) => {
        dataPoint[`class_${cls.classId}_avg`] = cls.averageMarks;
        dataPoint[`class_${cls.classId}_pass`] = cls.passRate;
      });
      return dataPoint;
    });

    const classes = subjectComparisonData.subjects[0]?.classes || [];

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Average Marks by Subject</h3>
            <p className="text-xs text-slate-500">Compare average marks across sections</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ left: 20, right: 30, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="subjectName"
              tick={{ fontSize: 12, fill: "#64748b" }}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "#64748b" }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => {
                const isPassRate = name.includes("_pass");
                return [`${value}%`, isPassRate ? "Pass Rate" : "Average"];
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
              formatter={(value) => {
                const classId = value.replace("class_", "").replace("_avg", "").replace("_pass", "");
                const cls = classes.find(c => c.classId === parseInt(classId));
                return cls?.className || value;
              }}
            />
            {classes.map((cls, index) => (
              <Bar
                key={`avg_${cls.classId}`}
                dataKey={`class_${cls.classId}_avg`}
                name={`class_${cls.classId}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderPassRateChart = () => {
    if (!subjectComparisonData || subjectComparisonData.subjects.length === 0) return null;

    const chartData = subjectComparisonData.subjects.map(subject => {
      const dataPoint: Record<string, any> = { subjectName: subject.subjectName };
      subject.classes.forEach((cls) => {
        dataPoint[`class_${cls.classId}`] = cls.passRate;
      });
      return dataPoint;
    });

    const classes = subjectComparisonData.subjects[0]?.classes || [];

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <Award className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Pass Rate by Subject</h3>
            <p className="text-xs text-slate-500">Compare pass percentages across sections</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ left: 20, right: 30, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="subjectName"
              tick={{ fontSize: 12, fill: "#64748b" }}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "#64748b" }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value}%`, "Pass Rate"]}
            />
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
              formatter={(value) => {
                const classId = value.replace("class_", "");
                const cls = classes.find(c => c.classId === parseInt(classId));
                return cls?.className || value;
              }}
            />
            {classes.map((cls, index) => (
              <Bar
                key={`pass_${cls.classId}`}
                dataKey={`class_${cls.classId}`}
                name={`class_${cls.classId}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Class Comparison"
        subtitle="Compare performance across classes"
        breadcrumb={{
          links: [
            { label: "Exams", href: "/admin/exams" },
            { label: "Class Comparison", active: true },
          ],
        }}
      />

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
              disabled={false}
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

          {/* Selected Sections Info */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Sections
            </label>
            {loadingSections ? (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sections.length > 0 ? (
                  sections.map((section) => (
                    <span
                      key={section.id}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {section.section || "No Section"}
                    </span>
                  ))
                ) : selectedClassName ? (
                  <span className="text-sm text-amber-600">
                    No sections found
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">
                    Select a class above
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {selectedClassName && sections.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleClearSelection}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
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
      ) : subjectComparisonData && subjectComparisonData.subjects.length > 0 ? (
        <div className="space-y-6">
          <ClassSummaryCards stats={summaryStats} overallBestClassId={overallBest?.classId} />
          <ClassComparisonTable data={subjectComparisonData!} getBestClass={getBestClass} />
          {renderBarChart()}
          {renderPassRateChart()}
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
