import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useAcademicYear } from '../../../context/AcademicYearContext';
import { useSelectedChild } from '../../../context/SelectedChildContext';
import { useParentChildren, useStudentResults, useExams } from '../../../hooks/queries';
import type { LinkedStudent } from '../../../types/parent';
import type { StudentResult } from '../../../services/examResultService';
import type { Exam } from '../../../services/examService';
import { ArrowRight, Award, Calendar, BookOpen, GraduationCap, Hourglass } from 'lucide-react';
import { LoadingSpinner } from '../../common/LoadingSpinner';

interface ExamCardInfo {
  examId: number;
  examName: string;
  examType: string;
  startDate: string;
  endDate: string;
  subjectCount: number;
  hasResults: boolean;
}

const EMPTY_CHILDREN: LinkedStudent[] = [];

const ParentExamList: React.FC = () => {
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

  const classId = selectedChild?.classId ?? undefined;
  const academicYearId = selectedYear?.id ? Number(selectedYear.id) : undefined;
  const studentId = selectedChild?.id || 0;

  const { data: exams = [], isLoading: examsLoading } = useExams(
    classId ? { classId, academicYearId } : {}
  );

  const { data: results = [], isLoading: resultsLoading } = useStudentResults(studentId, {
    academicYearId,
  });

  const isLoading = childrenLoading || examsLoading || resultsLoading;

  const resultsByExam = useMemo(() => {
    const map: Record<number, StudentResult[]> = {};
    results.forEach((r: StudentResult) => {
      if (!map[r.examId]) map[r.examId] = [];
      map[r.examId].push(r);
    });
    return map;
  }, [results]);

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

  const handleExamClick = (examId: number) => {
    navigate(`/parent/exam-results/exam/${examId}`);
  };

  const examCards = useMemo<ExamCardInfo[]>(() => {
    return exams.map((exam: Exam) => {
      const examResults = resultsByExam[exam.id];
      const hasResults = !!examResults && examResults.length > 0;
      return {
        examId: exam.id,
        examName: exam.name,
        examType: exam.examType || '',
        startDate: exam.startDate,
        endDate: exam.endDate,
        subjectCount: exam.subjectCount || (hasResults ? examResults!.length : 0),
        hasResults,
      };
    }).sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }, [exams, resultsByExam]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading exam results..." />
      </div>
    );
  }

  if (examCards.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">No exams scheduled</p>
        <p className="text-sm text-slate-400 mt-1">Exams will appear here once they are created for your child's class.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {examCards.map((exam) => (
        <button
          key={`exam-${exam.examId}`}
          onClick={() => handleExamClick(exam.examId)}
          className={`bg-white rounded-xl border text-left hover:shadow-lg transition-all group ${
            exam.hasResults
              ? 'border-slate-200 hover:border-blue-300'
              : 'border-slate-100 hover:border-slate-300 opacity-80'
          }`}
        >
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              {exam.hasResults ? (
                <div className="p-3 rounded-xl border text-emerald-600 bg-emerald-50 border-emerald-200">
                  <Award className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-3 rounded-xl border text-slate-400 bg-slate-50 border-slate-200">
                  <Hourglass className="w-6 h-6" />
                </div>
              )}
              <ArrowRight className="size-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>

            <h3 className="font-bold text-slate-900 text-lg mb-2">{exam.examName}</h3>

            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getExamTypeBadgeColor(exam.examType)}`}>
                {exam.examType}
              </span>
              {!exam.hasResults && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  Awaiting results
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="size-4" />
                {new Date(exam.startDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="size-4" />
                {exam.subjectCount} {exam.subjectCount === 1 ? 'subject' : 'subjects'}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ParentExamList;
