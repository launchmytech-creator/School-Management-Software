import React, { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { useSelectedChild } from "../../context/SelectedChildContext";
import { useParentChildren, useStudentResults } from "../../hooks/queries";
import type { LinkedStudent } from "../../types/parent";
import { syllabusService, type ChapterWithStatus } from "../../services/syllabusService";
import { subjectIcon } from "../../lib/subject-utils";
import { ArrowLeft, BookOpen, CheckCircle, Clock, Loader2, GraduationCap, TrendingUp, TrendingDown, Award, AlertCircle } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import PerformanceTrendChart from "../../components/charts/PerformanceTrendChart";
import SubjectCard from "../../components/students/SubjectCard";

interface ExamInfo {
  examId: number;
  examName: string;
  examType: string;
  examDate: string;
  maxMarks: number;
  subjectCount: number;
}

const EMPTY_CHILDREN: LinkedStudent[] = [];

// ── Phase 1: Exam List View ───────────────────────────────────────────────
const ExamListView: React.FC<{
  child: LinkedStudent | null;
  onSelectExam: (examId: number) => void;
  onSelectSubject: (subjectId: number, subjectName: string) => void;
}> = ({ child, onSelectExam, onSelectSubject }) => {
  const navigate = useNavigate();
  const { selectedYear } = useAcademicYear();
  const { selectedChildId } = useSelectedChild();

  const { data: results = [], isLoading } = useStudentResults(selectedChildId || 0, {
    academicYearId: selectedYear?.id ? Number(selectedYear.id) : undefined,
  });

  const examsGrouped = useMemo(() => {
    const grouped: Record<number, ExamInfo> = {};
    results.forEach((r) => {
      if (!grouped[r.examId]) {
        grouped[r.examId] = {
          examId: r.examId,
          examName: r.examName,
          examType: r.examType,
          examDate: r.examDate,
          maxMarks: r.maxMarks,
          subjectCount: 0,
        };
      }
      grouped[r.examId].subjectCount++;
    });
    return Object.values(grouped).sort(
      (a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime()
    );
  }, [results]);

  const getExamPerformance = (examId: number) => {
    const examResults = results.filter((r) => r.examId === examId);
    const totalMarks = examResults.reduce((sum, r) => sum + r.marksObtained, 0);
    const totalMax = examResults.reduce((sum, r) => sum + r.maxMarks, 0);
    return totalMax > 0 ? Math.round((totalMarks / totalMax) * 100) : 0;
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B+";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C";
    return "F";
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 75) return "text-emerald-600 bg-emerald-50";
    if (percentage >= 50) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  const getExamTypeBadgeColor = (examType: string) => {
    switch (examType) {
      case "Annual": return "bg-purple-100 text-purple-700";
      case "Half Yearly": return "bg-blue-100 text-blue-700";
      case "Unit Test": return "bg-amber-100 text-amber-700";
      case "Class Test": return "bg-green-100 text-green-700";
      case "Final": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading exam results..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {examsGrouped.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No exam results found</p>
          <p className="text-sm text-slate-400 mt-1">Results will appear here once exams are graded.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {examsGrouped.map((exam) => {
            const percentage = getExamPerformance(exam.examId);
            const grade = getGrade(percentage);
            return (
              <div
                key={exam.examId}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectExam(exam.examId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${getPerformanceColor(percentage)}`}>
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{exam.examName}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getExamTypeBadgeColor(exam.examType)}`}>
                          {exam.examType}
                        </span>
                        <span className="text-sm text-slate-500">
                          {new Date(exam.examDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-sm text-slate-400">•</span>
                        <span className="text-sm text-slate-500">{exam.subjectCount} subjects</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-bold ${getPerformanceColor(percentage)}`}>
                      {percentage}%
                    </span>
                    <p className="text-xs text-slate-400 mt-1">Grade: {grade}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Phase 2: Subject Results View ───────────────────────────────────────────
const SubjectResultsView: React.FC<{
  examId?: number;
  onBack: () => void;
  onSelectExam: (examId: number) => void;
  onViewChapters: () => void;
}> = ({ examId, onBack, onSelectExam, onViewChapters }) => {
  const navigate = useNavigate();
  const { selectedYear } = useAcademicYear();
  const { selectedChildId } = useSelectedChild();

  const { data: results = [], isLoading } = useStudentResults(selectedChildId || 0, {
    academicYearId: selectedYear?.id ? Number(selectedYear.id) : undefined,
  });

  const examResults = examId ? results.filter((r) => r.examId === examId) : results;
  
  const latestBySubject = useMemo(() => {
    const latest: Record<string, typeof results[0]> = {};
    examResults.forEach((r) => {
      if (!latest[r.subjectName] || new Date(r.examDate) > new Date(latest[r.subjectName].examDate)) {
        latest[r.subjectName] = r;
      }
    });
    return Object.values(latest);
  }, [examResults]);

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      "A+": "text-emerald-600 bg-emerald-50",
      "A": "text-emerald-600 bg-emerald-50",
      "B+": "text-blue-600 bg-blue-50",
      "B": "text-blue-600 bg-blue-50",
      "C": "text-amber-600 bg-amber-50",
      "F": "text-red-600 bg-red-50",
    };
    return colors[grade] || "text-slate-600 bg-slate-50";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading subjects..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-slate-500">Back to Exam List</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {examId && (
          <button
            onClick={() => onSelectExam(examId)}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium whitespace-nowrap"
          >
            All Exams
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {latestBySubject.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-xl border border-slate-200 p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-900">{r.subjectName}</h3>
                <p className="text-xs text-slate-500">{r.examName}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(r.grade)}`}>
                {r.grade}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {r.marksObtained}/{r.maxMarks}
                </p>
                <p className="text-xs text-slate-500">
                  {Math.round((r.marksObtained / r.maxMarks) * 100)}% scored
                </p>
              </div>
              <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-800 rounded-full"
                  style={{ width: `${(r.marksObtained / r.maxMarks) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────
const ParentExamResults: React.FC = () => {
  const navigate = useNavigate();
  const { examId, subjectId } = useParams<{ examId?: string; subjectId?: string }>();
  const { selectedYear } = useAcademicYear();
  const { selectedChildId } = useSelectedChild();

  const { data: childrenData, isLoading: childrenLoading } = useParentChildren(0);
  const children = childrenData || EMPTY_CHILDREN;
  const selectedChild = children.find((c) => c.id === selectedChildId);

  const handleSelectExam = (examId: number) => {
    navigate(`/parent/exam-results/exam/${examId}`);
  };

  const handleSelectSubject = (subjectId: number, subjectName: string) => {
    navigate(`/parent/exam-results/subject/${subjectId}`, { state: { subjectName } });
  };

  const handleViewSyllabus = () => {
    navigate("/parent/syllabus");
  };

  if (childrenLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  if (!selectedChildId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={GraduationCap}
          title="No Student Selected"
          description="Please select a child from the dashboard to view exam results."
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <PageHeader
        title="Exam Results"
        subtitle={`${selectedChild?.fullName || "Student"} • ${selectedChild?.className || ""} • ${selectedYear?.name || ""} Session`}
        breadcrumb={{
          links: [
            { label: "Dashboard", href: "/parent/dashboard" },
            { label: "Exam Results", active: true },
          ],
        }}
      />

      {/* Navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => navigate("/parent/exam-results")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !examId && !subjectId
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Exam List
        </button>
        <button
          onClick={() => navigate("/parent/exam-results/subject")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            subjectId
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Subject-wise
        </button>
      </div>

      {/* Views */}
      {subjectId ? (
        <SubjectResultsView
          examId={examId ? parseInt(examId) : undefined}
          onBack={() => navigate("/parent/exam-results")}
          onSelectExam={handleSelectExam}
          onViewChapters={handleViewSyllabus}
        />
      ) : (
        <ExamListView
          child={selectedChild ?? null}
          onSelectExam={handleSelectExam}
          onSelectSubject={handleSelectSubject}
        />
      )}
    </div>
  );
};

export default ParentExamResults;