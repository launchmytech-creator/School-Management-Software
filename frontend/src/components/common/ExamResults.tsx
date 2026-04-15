import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import EmptyState from "../../components/common/EmptyState";
import { ExamResultsStats } from "./ExamResultsStats";
import { SubjectResultCard } from "./SubjectResultCard";
import { useNotification } from "../../context/NotificationContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { useClasses } from "../../hooks/queries/useClasses";
import { useExamResults, useExamResultsPerformance } from "../../hooks/queries/useExamResults";
import type { ExamResult } from "../../services/examResultService";
import {
  GraduationCap,
  Download,
} from "lucide-react";
import { SkeletonTable } from "../../components/common/Skeleton";
import { QueryErrorFallback } from "../../components/error";
import { EXAM_TYPES } from "../../lib/subject-utils";

interface ExamResultsProps {
  layout?: "admin" | "accountant";
}

const ExamResults: React.FC<ExamResultsProps> = ({ layout = "admin" }) => {
  const { showNotification } = useNotification();
  const { allYears: academicYears, selectedYear } = useAcademicYear();
  const [searchParams] = useSearchParams();
  
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(
    selectedYear?.id?.toString() || "",
  );
  const [selectedExamType, setSelectedExamType] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(
    new Set(),
  );

  const selectedAcademicYearId = selectedAcademicYear
    ? parseInt(selectedAcademicYear)
    : undefined;

  const selectedClassId = selectedClass ? parseInt(selectedClass) : undefined;

  const { data: allClasses = [] } = useClasses();
  
  const { data: results = [], isLoading } = useExamResults({
    classId: selectedClassId,
    academicYearId: selectedAcademicYearId,
  });

  const uniqueExamIds = useMemo(() => {
    return [...new Set(results.map((r) => r.examId).filter(Boolean))];
  }, [results]);

  const { data: performanceData = [] } = useExamResultsPerformance(
    uniqueExamIds[0] || 0,
    selectedAcademicYearId
  );

  React.useEffect(() => {
    const classIdParam = searchParams.get("classId");
    if (classIdParam) {
      setSelectedClass(classIdParam);
    }
  }, [searchParams]);

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
      const classKey = result.classSection
        ? `${result.className} - ${result.classSection}`
        : result.className;
      const key = `${classKey} - ${result.subjectName}`;
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
                  { label: "Exams", href: "/admin/exams" },
                  { label: "Exam Results", active: true },
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

      <ExamResultsStats
        total={stats.total}
        passed={stats.passed}
        failed={stats.failed}
        passPercentage={stats.passPercentage}
      />

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
          {allClasses.map((cls) => (
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

      {isLoading ? (
        <SkeletonTable columns={6} rows={10} />
      ) : filteredResults.length > 0 ? (
        <div className="space-y-4">
          {Object.entries(resultsBySubject).map(([groupKey, subjectResults]) => {
            const subjectStats = getSubjectStats(subjectResults);
            const isExpanded = expandedSubjects.has(groupKey);
            const firstResult = subjectResults[0];
            const actualSubjectName = firstResult?.subjectName || "Unknown";
            const perf = performanceData.find((p) => p.subjectName === actualSubjectName);

            return (
              <SubjectResultCard
                key={groupKey}
                subjectResults={subjectResults}
                subjectStats={subjectStats}
                isExpanded={isExpanded}
                performance={perf}
                onToggle={() => toggleSubject(groupKey)}
              />
            );
          })}
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

  return <QueryErrorFallback>{content}</QueryErrorFallback>;
};

export default ExamResults;
