import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { ChildExamResult } from '../../../hooks/queries/useDashboard';

interface ExamResultProps {
  examResult: ChildExamResult | null;
  studentId: number;
}

const getGradeColor = (grade: string): string => {
  const colors: Record<string, string> = {
    'A+': '#16a34a',
    'A': '#16a34a',
    'A-': '#22c55e',
    'B+': '#eab308',
    'B': '#eab308',
    'B-': '#f59e0b',
    'C': '#f97316',
    'D': '#ef4444',
    'F': '#dc2626',
  };
  return colors[grade] || '#4A9FD4';
};

const CircularProgress: React.FC<{ percentage: number }> = ({ percentage }) => {
  const radius = 36;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percentage / 100);
  const color = percentage >= 75 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-[96px] h-[96px] flex items-center justify-center">
      <svg width="96" height="96" className="absolute">
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-black text-slate-800">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
};

export const ExamResultCard: React.FC<ExamResultProps> = ({ examResult, studentId }) => {
  const navigate = useNavigate();

  if (!examResult) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-lg text-purple-500"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                school
              </span>
            </div>
            <h3 className="font-bold text-slate-800">Exam Results</h3>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-slate-300">
              assignment
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">No exam results yet</p>
        </div>
      </div>
    );
  }

  const { examName, examDate, overallPercentage, subjects } = examResult;
  const maxMarks = Math.max(...subjects.map((s) => s.maxMarks));
  const grade = subjects[0]?.grade || 'N/A';
  const gradeColor = getGradeColor(grade);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-lg text-purple-500"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                school
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Latest Exam</h3>
              <p className="text-xs text-slate-500">
                {examName} • {formatDate(examDate)}
              </p>
            </div>
          </div>
          <span
            className="px-3 py-1.5 rounded-lg font-bold text-sm"
            style={{ backgroundColor: gradeColor + '20', color: gradeColor }}
          >
            Grade: {grade}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-6">
          <CircularProgress percentage={overallPercentage} />

          <div className="flex-1 flex justify-around">
            <div className="text-center">
              <p className="text-2xl font-black text-slate-800">
                {subjects.length}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Subjects</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-slate-800">
                {maxMarks}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Max Marks</p>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-slate-100">
          <p className="text-sm font-bold text-slate-700 mb-3">Subject Performance</p>
          <div className="space-y-3">
            {subjects.slice(0, 4).map((subject, index) => (
              <div key={subject.subjectId || index}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-slate-700 truncate w-28">
                    {subject.subjectName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">
                      {subject.marksObtained}/{subject.maxMarks}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{
                        backgroundColor: getGradeColor(subject.grade) + '20',
                        color: getGradeColor(subject.grade),
                      }}
                    >
                      {subject.grade}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(subject.marksObtained / subject.maxMarks) * 100}%`,
                      backgroundColor: getGradeColor(subject.grade),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {subjects.length > 4 && (
            <p className="text-xs text-slate-400 mt-3">
              +{subjects.length - 4} more subjects
            </p>
          )}
        </div>
      </div>

      <div className="px-5 pb-5">
        <button
          onClick={() => navigate('/parent/exam-results')}
          className="text-sm font-semibold text-[#4A9FD4] hover:underline"
        >
          View All Results
        </button>
      </div>
    </div>
  );
};