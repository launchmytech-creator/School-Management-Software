import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useAcademicYear } from '../../../context/AcademicYearContext';
import { useSelectedChild } from '../../../context/SelectedChildContext';
import { useParentChildren, useStudentResults } from '../../../hooks/queries';
import type { LinkedStudent } from '../../../types/parent';
import type { StudentResult } from '../../../services/examResultService';
import { subjectIcon } from '../../../lib/subject-utils';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, TrendingUp, Award, Target, Star } from 'lucide-react';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import PageHeader from '../../common/PageHeader';
import EmptyState from '../../common/EmptyState';

interface ExamMarksDetailProps {
  examId: number;
  subjectName: string;
}

const EMPTY_CHILDREN: LinkedStudent[] = [];

const ParentExamMarksDetail: React.FC<ExamMarksDetailProps> = ({ examId, subjectName }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedYear } = useAcademicYear();
  const { selectedChildId } = useSelectedChild();

  const { data: childrenData, isLoading: childrenLoading } = useParentChildren(Number(user?.id));
  const children = childrenData || EMPTY_CHILDREN;
  const selectedChild = useMemo(() => {
    if (selectedChildId && children.length > 0) {
      return children.find(c => c.id === selectedChildId) || children[0] || null;
    }
    return children[0] || null;
  }, [children, selectedChildId]);

  const { data: results = [], isLoading: resultsLoading } = useStudentResults(selectedChild?.id || 0, {
    academicYearId: selectedYear?.id ? Number(selectedYear.id) : undefined,
  });

  const isLoading = childrenLoading || resultsLoading;

  const subjectResult = useMemo<StudentResult | null>(() => {
    const filtered = results.filter(
      (r: StudentResult) => r.examId === examId && r.subjectName === subjectName
    );
    return filtered.length > 0 ? filtered[0] : null;
  }, [results, examId, subjectName]);

  const examResults = useMemo(() => {
    return results.filter((r: StudentResult) => r.examId === examId);
  }, [results, examId]);

  const examStats = useMemo(() => {
    if (examResults.length === 0) return null;
    const totalMarks = examResults.reduce((sum, r) => sum + r.marksObtained, 0);
    const totalMax = examResults.reduce((sum, r) => sum + r.maxMarks, 0);
    const percentage = totalMax > 0 ? Math.round((totalMarks / totalMax) * 100) : 0;
    const totalSubjects = examResults.length;
    const passedSubjects = examResults.filter((r) => {
      if (r.isAbsent) return false;
      const pct = r.maxMarks > 0 ? (r.marksObtained / r.maxMarks) * 100 : 0;
      return pct >= 50;
    }).length;
    
    return {
      totalMarks,
      totalMax,
      percentage,
      totalSubjects,
      passedSubjects,
      failedSubjects: totalSubjects - passedSubjects,
    };
  }, [examResults]);

  const getGradeColor = (grade: string) => {
    if (["A+", "A"].includes(grade)) return "text-emerald-600 bg-emerald-50";
    if (["B+", "B"].includes(grade)) return "text-blue-600 bg-blue-50";
    if (["C+", "C"].includes(grade)) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  const getGradeLabel = (grade: string) => {
    const labels: Record<string, string> = {
      "A+": "Outstanding",
      "A": "Excellent",
      "B+": "Very Good",
      "B": "Good",
      "C+": "Fair",
      "C": "Pass",
      "F": "Fail",
    };
    return labels[grade] || grade;
  };

  const getPercentageColor = (pct: number) => {
    if (pct >= 90) return "text-emerald-600";
    if (pct >= 75) return "text-blue-600";
    if (pct >= 60) return "text-amber-600";
    if (pct >= 50) return "text-orange-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading marks..." />
      </div>
    );
  }

  if (!subjectResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/parent/exam-results/exam/${examId}`)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-slate-500">Back to Subjects</span>
        </div>
        <EmptyState
          icon={AlertCircle}
          title="Result not found"
          description="No result found for this subject in the selected exam."
          action={{
            label: 'Go Back',
            onClick: () => navigate(`/parent/exam-results/exam/${examId}`)
          }}
        />
      </div>
    );
  }

  const percentage = subjectResult.maxMarks > 0 
    ? Math.round((subjectResult.marksObtained / subjectResult.maxMarks) * 100) 
    : 0;
  const iconConfig = subjectIcon(subjectName);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/parent/exam-results/exam/${examId}`)}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-slate-500">Back to Subject List</span>
      </div>

      <PageHeader
        title={subjectName}
        subtitle={selectedChild ? `${selectedChild.fullName} • ${subjectResult.examName}` : subjectResult.examName}
        breadcrumb={{
          links: [
            { label: 'Dashboard', href: '/parent/dashboard' },
            { label: 'Exam Results', href: '/parent/exam-results' },
            { label: subjectResult.examName, href: `/parent/exam-results/exam/${examId}` },
            { label: subjectName, active: true },
          ],
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className={`p-4 rounded-xl ${iconConfig.bg}`}>
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {iconConfig.icon}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{subjectName}</h2>
                <p className="text-slate-500">{subjectResult.subjectCode} • {subjectResult.examType}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-slate-900">{subjectResult.marksObtained}</p>
                <p className="text-sm text-slate-500">Marks Obtained</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-slate-900">/{subjectResult.maxMarks}</p>
                <p className="text-sm text-slate-500">Maximum Marks</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className={`text-3xl font-bold ${getPercentageColor(percentage)}`}>{percentage}%</p>
                <p className="text-sm text-slate-500">Percentage</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">Progress</span>
                <span className="text-sm font-medium text-slate-700">{percentage}%</span>
              </div>
              <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    percentage >= 75 ? 'bg-emerald-500' :
                    percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${getGradeColor(subjectResult.grade)}`}>
                  <Award className="size-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{subjectResult.grade}</p>
                  <p className="text-sm text-slate-500">{getGradeLabel(subjectResult.grade)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {subjectResult.isAbsent ? (
                  <span className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg font-medium">
                    <XCircle className="size-5" />
                    Absent
                  </span>
                ) : percentage >= 50 ? (
                  <span className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg font-medium">
                    <CheckCircle className="size-5" />
                    Passed
                  </span>
                ) : (
                  <span className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg font-medium">
                    <XCircle className="size-5" />
                    Needs Improvement
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {examStats && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Exam Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Target className="size-4" /> Total Score
                  </span>
                  <span className="font-bold text-slate-900">{examStats.percentage}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <TrendingUp className="size-4" /> Subjects Appeared
                  </span>
                  <span className="font-bold text-slate-900">{examStats.totalSubjects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <CheckCircle className="size-4 text-emerald-600" /> Passed
                  </span>
                  <span className="font-bold text-emerald-600">{examStats.passedSubjects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <XCircle className="size-4 text-red-600" /> Needs Improvement
                  </span>
                  <span className="font-bold text-red-600">{examStats.failedSubjects}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Exam Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Exam Name</span>
                <span className="font-medium text-slate-900">{subjectResult.examName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Exam Type</span>
                <span className="font-medium text-slate-900">{subjectResult.examType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Date</span>
                <span className="font-medium text-slate-900">
                  {new Date(subjectResult.examDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Academic Year</span>
                <span className="font-medium text-slate-900">{subjectResult.academicYearName}</span>
              </div>
            </div>
          </div>

          {percentage >= 90 && (
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <Star className="size-8" />
                <span className="text-2xl font-bold">Outstanding!</span>
              </div>
              <p className="text-emerald-100">Keep up the excellent work!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentExamMarksDetail;