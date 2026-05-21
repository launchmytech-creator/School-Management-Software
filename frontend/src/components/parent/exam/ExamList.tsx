import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useAcademicYear } from '../../../context/AcademicYearContext';
import { useSelectedChild } from '../../../context/SelectedChildContext';
import { useParentChildren, useStudentResults } from '../../../hooks/queries';
import type { LinkedStudent } from '../../../types/parent';
import type { StudentResult } from '../../../services/examResultService';
import { ArrowRight, Award, Calendar, BookOpen, GraduationCap } from 'lucide-react';
import { LoadingSpinner } from '../../common/LoadingSpinner';

interface ExamInfo {
  examId: number;
  examName: string;
  examType: string;
  examDate: string;
  maxMarks: number;
  subjectCount: number;
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

  const { data: results = [], isLoading: resultsLoading } = useStudentResults(selectedChild?.id || 0, {
    academicYearId: selectedYear?.id ? Number(selectedYear.id) : undefined,
  });

  const isLoading = childrenLoading || resultsLoading;

  const examsGrouped = useMemo<ExamInfo[]>(() => {
    const grouped: Record<number, ExamInfo> = {};
    results.forEach((r: StudentResult) => {
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
    const examResults = results.filter((r: StudentResult) => r.examId === examId);
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
    if (percentage >= 75) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (percentage >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
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

  const handleExamClick = (examId: number) => {
    navigate(`/parent/exam-results/exam/${examId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading exam results..." />
      </div>
    );
  }

  if (examsGrouped.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">No exam results found</p>
        <p className="text-sm text-slate-400 mt-1">Results will appear here once exams are graded.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {examsGrouped.map((exam) => {
        const percentage = getExamPerformance(exam.examId);
        const grade = getGrade(percentage);
        
        return (
          <button
            key={`exam-${exam.examId}`}
            onClick={() => handleExamClick(exam.examId)}
            className="bg-white rounded-xl border border-slate-200 p-5 text-left hover:shadow-lg hover:border-blue-300 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${getPerformanceColor(percentage)} border`}>
                <Award className="w-6 h-6" />
              </div>
              <ArrowRight className="size-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>

            <h3 className="font-bold text-slate-900 text-lg mb-2">{exam.examName}</h3>

            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getExamTypeBadgeColor(exam.examType)}`}>
                {exam.examType}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="size-4" />
                {new Date(exam.examDate).toLocaleDateString("en-IN", {
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

            <div className="flex items-end justify-between pt-4 border-t border-slate-100">
              <div>
                <p className="text-2xl font-bold text-slate-900">{percentage}%</p>
                <p className="text-xs text-slate-500">Overall Score</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold text-lg">
                  {grade}
                </span>
                <p className="text-xs text-slate-500 mt-1">Grade</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ParentExamList;