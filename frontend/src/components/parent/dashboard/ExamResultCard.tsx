import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, Trophy } from 'lucide-react';
import type { ChildExamResult } from '../../../hooks/queries/useDashboard';

interface ExamResultProps {
  examResult: ChildExamResult | null;
  studentId: number;
}

const gradeStyle = (grade: string): { bg: string; text: string } => {
  const map: Record<string, { bg: string; text: string }> = {
    'A+': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    'A':  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    'B':  { bg: 'bg-blue-100',    text: 'text-blue-700'    },
    'C':  { bg: 'bg-amber-100',   text: 'text-amber-700'   },
    'D':  { bg: 'bg-orange-100',  text: 'text-orange-700'  },
    'F':  { bg: 'bg-rose-100',    text: 'text-rose-700'    },
  };
  return map[grade] ?? { bg: 'bg-slate-100', text: 'text-slate-600' };
};

const barColor = (pct: number) => {
  if (pct >= 75) return 'bg-emerald-400';
  if (pct >= 50) return 'bg-amber-400';
  return 'bg-rose-400';
};

const ringColor = (pct: number) => {
  if (pct >= 75) return '#10b981';
  if (pct >= 50) return '#f59e0b';
  return '#ef4444';
};

const ringTrack = (pct: number) => {
  if (pct >= 75) return '#d1fae5';
  if (pct >= 50) return '#fef3c7';
  return '#fee2e2';
};

const OverallRing: React.FC<{ pct: number }> = ({ pct }) => {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
      <svg width="80" height="80" className="absolute -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke={ringTrack(pct)} strokeWidth="7" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={ringColor(pct)} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="relative text-sm font-black text-slate-800">{pct}%</span>
    </div>
  );
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const ExamResultCard: React.FC<ExamResultProps> = ({ examResult, studentId }) => {
  const navigate = useNavigate();

  if (!examResult) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 flex items-center gap-2 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
            <BookOpen size={14} className="text-purple-500" />
          </div>
          <span className="font-bold text-slate-800 text-sm">Exam Results</span>
        </div>
        <div className="p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
            <BookOpen size={24} className="text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-400">No exam results yet</p>
        </div>
      </div>
    );
  }

  const { examName, examType, examDate, overallPercentage, subjects } = examResult;
  const topSubject = [...subjects].sort((a, b) => (b.marksObtained / b.maxMarks) - (a.marksObtained / a.maxMarks))[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* header */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
            <BookOpen size={14} className="text-purple-500" />
          </div>
          <div>
            <span className="font-bold text-slate-800 text-sm">Latest Exam</span>
            <p className="text-[10px] text-slate-400 leading-none mt-0.5">{examType} · {formatDate(examDate)}</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg max-w-30 truncate">
          {examName}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* overall score row */}
        <div className="flex items-center gap-4">
          <OverallRing pct={overallPercentage} />
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500 mb-1">Overall Score</p>
            <p className="text-2xl font-black text-slate-800">{overallPercentage}<span className="text-sm font-semibold text-slate-400">%</span></p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-400">{subjects.length} subjects</span>
              {topSubject && (
                <>
                  <span className="w-0.5 h-3 bg-slate-200 rounded" />
                  <span className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                    <Trophy size={9} /> Best: {topSubject.subjectName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* subject bars */}
        <div className="space-y-2.5">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Subject Breakdown</p>
          {subjects.slice(0, 5).map((s, i) => {
            const pct = s.maxMarks > 0 ? Math.round((s.marksObtained / s.maxMarks) * 100) : 0;
            const gs = gradeStyle(s.grade);
            return (
              <div key={s.subjectId ?? i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-700 truncate w-28">{s.subjectName}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">{s.marksObtained}/{s.maxMarks}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${gs.bg} ${gs.text}`}>{s.grade}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor(pct)}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {subjects.length > 5 && (
            <p className="text-[10px] text-slate-400">+{subjects.length - 5} more subjects</p>
          )}
        </div>
      </div>

      {/* footer */}
      <div className="px-5 pb-4">
        <button
          type="button"
          onClick={() => navigate(`/parent/exams?studentId=${studentId}`)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 transition-colors"
        >
          View All Results <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};
