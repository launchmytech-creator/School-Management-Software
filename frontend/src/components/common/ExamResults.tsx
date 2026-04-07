import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import EmptyState from "../../components/common/EmptyState";
import { useNotification } from "../../context/NotificationContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import {
  examResultService,
  type ExamResult,
  type ClassPerformance,
} from "../../services/examResultService";
import { classService } from "../../services/classService";
import type { Class } from "../../types/class";
import {
  GraduationCap,
  TrendingUp,
  Award,
  BarChart3,
  Download,
  BookOpen,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { SkeletonTable } from "../../components/common/Skeleton";

interface ExamResultsProps {
  layout?: "admin" | "accountant";
}

const EXAM_TYPES = ["All", "Unit Test", "Half Yearly", "Annual"];

const ExamResults: React.FC<ExamResultsProps> = ({ layout = "admin" }) => {
  const { showNotification } = useNotification();
  const { allYears: academicYears, selectedYear } = useAcademicYear();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [performance, setPerformance] = useState<ClassPerformance[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(
    selectedYear?.id?.toString() || "",
  );
  const [selectedExamType, setSelectedExamType] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(
    new Set(),
  );

  const layoutTitle = layout === "accountant" ? "Exam Results" : undefined;
  const selectedAcademicYearId = selectedAcademicYear
    ? parseInt(selectedAcademicYear)
    : undefined;

  const fetchClasses = useCallback(async () => {
    try {
      const data = await classService.getClasses();
      setClasses(data);
    } catch {
      showNotification("Failed to fetch classes", "error");
    }
  }, [showNotification]);

  const fetchResults = useCallback(
    async (classId?: number, academicYearId?: number) => {
      try {
        setLoading(true);
        const filters: { classId?: number; academicYearId?: number } = {};
        if (classId) filters.classId = classId;
        if (academicYearId) filters.academicYearId = academicYearId;

        const resultsData = await examResultService.getResults(filters);
        setResults(resultsData);

        let perfData: ClassPerformance[] = [];
        if (resultsData.length > 0) {
          const uniqueExamIds = [
            ...new Set(resultsData.map((r) => r.examId).filter(Boolean)),
          ];
          const perfPromises = uniqueExamIds.map((eId) =>
            examResultService
              .getClassPerformance(eId!, academicYearId)
              .catch(() => []),
          );
          const perfResults = await Promise.allSettled(perfPromises);
          perfData = perfResults
            .filter((r) => r.status === "fulfilled")
            .flatMap((r) => r.value);
        }

        setPerformance(Array.isArray(perfData) ? perfData : []);
      } catch {
        showNotification("Failed to fetch results", "error");
        setResults([]);
        setPerformance([]);
      } finally {
        setLoading(false);
      }
    },
    [showNotification],
  );

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    const classIdParam = searchParams.get("classId");
    if (classIdParam) {
      setSelectedClass(classIdParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const classId = selectedClass ? parseInt(selectedClass) : undefined;
    fetchResults(classId, selectedAcademicYearId);
  }, [selectedClass, selectedAcademicYearId, fetchResults]);

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
  };

  const handleAcademicYearChange = (yearId: string) => {
    setSelectedAcademicYear(yearId);
    setSelectedClass("");
  };

  const toggleSubject = (subjectName: string) => {
    setExpandedSubjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subjectName)) {
        newSet.delete(subjectName);
      } else {
        newSet.add(subjectName);
      }
      return newSet;
    });
  };

  const filteredResults = results.filter(
    (r) =>
      (r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.subjectName.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!selectedExamType ||
        selectedExamType === "All" ||
        r.examType === selectedExamType),
  );

  const resultsBySubject = useMemo(() => {
    const grouped: Record<string, ExamResult[]> = {};
    filteredResults.forEach((result) => {
      const key = result.subjectName;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(result);
    });
    Object.values(grouped).forEach((students) => {
      students.sort((a, b) => (a.rollNumber || 999) - (b.rollNumber || 999));
    });
    return grouped;
  }, [filteredResults]);

  const stats = {
    total: results.length,
    passed: results.filter((r) => r.marksObtained >= r.maxMarks * 0.4).length,
    failed: results.filter((r) => r.marksObtained < r.maxMarks * 0.4).length,
    passPercentage:
      results.length > 0
        ? (
            (results.filter((r) => r.marksObtained >= r.maxMarks * 0.4).length /
              results.length) *
            100
          ).toFixed(1)
        : "0",
  };

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

  const getSubjectStats = (subjectResults: ExamResult[]) => {
    const evaluated = subjectResults.filter(
      (r) => !r.isAbsent && r.marksObtained > 0,
    ).length;
    const absent = subjectResults.filter((r) => r.isAbsent).length;
    const avgMarks =
      evaluated > 0
        ? subjectResults
            .filter((r) => !r.isAbsent)
            .reduce((sum, r) => sum + r.marksObtained, 0) / evaluated
        : 0;
    return { evaluated, absent, total: subjectResults.length, avgMarks };
  };

  const content = (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Exam Results"
        subtitle="View and analyze student examination results"
        breadcrumb={
          layout === "admin"
            ? {
                links: [
                  { label: "Dashboard", href: "/admin/dashboard" },
                  { label: "Exams", href: "/admin/exams" },
                  { label: "Results", active: true },
                ],
              }
            : undefined
        }
        actions={[
          {
            label: "Export",
            icon: Download,
            onClick: () =>
              showNotification("Export feature coming soon", "info"),
            variant: "outline",
          },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-500">Total Records</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <GraduationCap className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-emerald-700">
                {stats.passed}
              </p>
              <p className="text-sm text-emerald-600">Passed</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-xl border border-red-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
              <p className="text-sm text-red-600">Failed</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <TrendingUp className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-purple-700">
                {stats.passPercentage}%
              </p>
              <p className="text-sm text-purple-600">Pass rate</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onReset={() => {
          setSearchTerm("");
          setSelectedClass("");
          setSelectedAcademicYear(selectedYear?.id?.toString() || "");
          setSelectedExamType("");
        }}
        searchPlaceholder="Search by student, admission number, or subject..."
      >
        <select
          value={selectedAcademicYear}
          onChange={(e) => handleAcademicYearChange(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 min-w-48"
        >
          <option value="">All Academic Years</option>
          {academicYears.map((year) => (
            <option key={year.id} value={year.id}>
              {year.name}
            </option>
          ))}
        </select>
        <select
          value={selectedClass}
          onChange={(e) => handleClassChange(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 min-w-48"
          disabled={!selectedAcademicYear}
        >
          <option value="">All Classes</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name} - Section {cls.section || "A"}
            </option>
          ))}
        </select>
        <select
          value={selectedExamType}
          onChange={(e) => setSelectedExamType(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 min-w-48"
        >
          {EXAM_TYPES.map((type) => (
            <option key={type} value={type === "All" ? "" : type}>
              {type}
            </option>
          ))}
        </select>
      </FilterBar>

      {loading ? (
        <SkeletonTable columns={6} rows={10} />
      ) : filteredResults.length > 0 ? (
        <div className="space-y-4">
          {Object.entries(resultsBySubject).map(
            ([subjectName, subjectResults]) => {
              const subjectStats = getSubjectStats(subjectResults);
              const perf = performance.find(
                (p) => p.subjectName === subjectName,
              );
              const isExpanded = expandedSubjects.has(subjectName);

              return (
                <div
                  key={subjectName}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                >
                  <div
                    className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => toggleSubject(subjectName)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSubject(subjectName);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-slate-500" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-500" />
                          )}
                        </div>
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-slate-900">
                              {subjectName}
                            </h3>
                            {perf?.subjectCode && (
                              <span className="text-xs text-slate-400">
                                {perf.subjectCode}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">
                            {subjectStats.total} students
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
                                    {result.studentName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .substring(0, 2)
                                      .toUpperCase()}
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
                                    <CheckCircle className="w-4 h-4" />{" "}
                                    Evaluated
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {perf && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg">
                            {Number(perf.maxMarks).toFixed(2)} marks
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500">
                            Average:
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {perf.averageMarks != null &&
                            !isNaN(perf.averageMarks)
                              ? Number(perf.averageMarks).toFixed(1)
                              : "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500">
                            Highest:
                          </span>
                          <span className="text-sm font-bold text-emerald-600">
                            {perf.highestMarks || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500">
                            Lowest:
                          </span>
                          <span className="text-sm font-bold text-red-600">
                            {perf.lowestMarks || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500">
                            Evaluated:
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {subjectStats.evaluated}/{subjectStats.total}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            },
          )}
        </div>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="No results found"
          description={
            searchTerm ||
            selectedClass ||
            selectedAcademicYear ||
            selectedExamType
              ? "Try adjusting your filters"
              : "No exam results recorded yet"
          }
        />
      )}
    </div>
  );

  return content;
};

export default ExamResults;
