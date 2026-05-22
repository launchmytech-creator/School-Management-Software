import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useAcademicYear } from '../../../context/AcademicYearContext';
import { useSelectedChild } from '../../../context/SelectedChildContext';
import { useParentChildren, useStudentResults } from '../../../hooks/queries';
import type { LinkedStudent } from '../../../types/parent';
import type { StudentResult } from '../../../services/examResultService';
import { subjectIcon } from '../../../lib/subject-utils';
import { TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import PageHeader from '../../common/PageHeader';
import EmptyState from '../../common/EmptyState';

interface ParentExamSubjectGridProps {
  examId: number;
}

interface SubjectResult {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  examName: string;
  examType: string;
  maxMarks: number;
  marksObtained: number;
  grade: string;
  percentage: number;
}

const EMPTY_CHILDREN: LinkedStudent[] = [];

const ParentExamSubjectGrid: React.FC<ParentExamSubjectGridProps> = ({ examId }) => {
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

  const examResults = useMemo<StudentResult[]>(() => {
    return results.filter((r: StudentResult) => r.examId === examId);
  }, [results, examId]);

  const subjectResults = useMemo<SubjectResult[]>(() => {
    const latest: Record<string, SubjectResult> = {};
    examResults.forEach((r: StudentResult) => {
      const key = r.subjectName;
      if (!latest[key]) {
        const percentage = r.maxMarks > 0 ? Math.round((r.marksObtained / r.maxMarks) * 100) : 0;
        latest[key] = {
          subjectId: key,
          subjectName: r.subjectName,
          subjectCode: r.subjectCode,
          examName: r.examName,
          examType: r.examType,
          maxMarks: r.maxMarks,
          marksObtained: r.marksObtained,
          grade: r.grade,
          percentage,
        };
      }
    });
    return Object.values(latest);
  }, [examResults]);

  const examInfo = subjectResults[0] || null;

  const getGradeColor = (grade: string) => {
    if (["A+", "A"].includes(grade)) return "text-emerald-600 bg-emerald-50";
    if (["B+", "B"].includes(grade)) return "text-blue-600 bg-blue-50";
    if (["C+", "C"].includes(grade)) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading subjects..." />
      </div>
    );
  }

  if (subjectResults.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={TrendingUp}
          title="No subject results found"
          description="No results recorded for this exam yet."
          action={{
            label: 'Go Back',
            onClick: () => navigate("/parent/exam-results")
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <PageHeader
        title={examInfo?.examName || 'Exam Results'}
        subtitle={selectedChild ? `${selectedChild.fullName} • ${examInfo?.examType || ''}` : examInfo?.examType || ''}
        breadcrumb={{
          links: [
            { label: 'Dashboard', href: '/parent/dashboard' },
            { label: 'Exam Results', href: '/parent/exam-results' },
            { label: examInfo?.examName || 'Exam', active: true },
          ],
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjectResults.map((subject) => {
          const iconConfig = subjectIcon(subject.subjectName);
          
          return (
            <div
              key={subject.subjectId}
              className="bg-white rounded-xl border border-slate-200 p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${iconConfig.bg}`}>
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {iconConfig.icon}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{subject.subjectName}</h3>
                    <p className="text-xs text-slate-500">{subject.subjectCode}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-sm">Marks Obtained</span>
                  <span className="font-bold text-slate-900 text-lg">
                    {subject.marksObtained}/{subject.maxMarks}
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-800 rounded-full transition-all"
                    style={{ width: `${Math.min(subject.percentage, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-sm font-medium text-slate-700">{subject.percentage}%</span>
                  <div className="flex items-center gap-2">
                    {subject.grade && ["A+", "A", "B+", "B", "C+", "C"].includes(subject.grade) ? (
                      <CheckCircle className="size-4 text-emerald-600" />
                    ) : (
                      <XCircle className="size-4 text-red-600" />
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(subject.grade)}`}>
                      {subject.grade}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ParentExamSubjectGrid;