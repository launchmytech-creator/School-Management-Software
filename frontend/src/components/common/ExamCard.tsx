import React from "react";
import { BookOpen, Calendar, Edit2, Trash2 } from "lucide-react";
import { formatDate } from "../../lib/utils";
import type { Exam } from "../../services/examService";

interface ExamCardProps {
  exam: Exam;
  basePath: string;
  onEdit: (exam: Exam) => void;
  onDelete: (examId: number) => void;
  onNavigate: (path: string) => void;
  isCheckingResults?: boolean;
}

export const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  basePath,
  onEdit,
  onDelete,
  onNavigate,
  isCheckingResults,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-blue-50 rounded-xl">
          <BookOpen className="w-6 h-6 text-blue-500" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(exam)}
            disabled={isCheckingResults}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <Edit2 className="w-4 h-4 text-slate-400" />
          </button>
          <button
            onClick={() => onDelete(exam.id)}
            className="p-2 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
          </button>
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-1">{exam.name}</h3>
      <p className="text-sm text-slate-500 mb-3">
        {exam.className} - Section {exam.classSection || "A"}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {exam.examType && (
          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
            {exam.examType}
          </span>
        )}
        {exam.weightage && (
          <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
            Weightage: {exam.weightage}%
          </span>
        )}
        {exam.subjects && exam.subjects.length > 0 && (
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
            {exam.subjects.length} Subjects
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{formatDate(exam.startDate)} - {formatDate(exam.endDate)}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
        <button
          onClick={() => onNavigate(`${basePath}/marks-entry?examId=${exam.id}&classId=${exam.classId}`)}
          className="flex-1 py-2 bg-blue-500 text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors"
        >
          Enter Marks
        </button>
        <button
          onClick={() => onNavigate(`${basePath}/exam-results/class/${exam.classId}?examId=${exam.id}`)}
          className="flex-1 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-200 transition-colors"
        >
          View Results
        </button>
      </div>
    </div>
  );
};
