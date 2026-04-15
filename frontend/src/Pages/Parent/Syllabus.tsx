import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useParentChildren, useStudentClass, useParentSubjects } from '../../hooks/queries';
import type { LinkedStudent } from '../../types/parent';
import type { ChapterWithStatus } from '../../services/syllabusService';

interface SubjectCard {
  classSubjectId: number;
  subjectId: number;
  subjectName: string;
  teacherName?: string;
  totalChapters: number;
  completedChapters: number;
  progressPercentage: number;
  chapters: ChapterWithStatus[];
}

const ACCENTS = [
  { border: 'border-l-green-400',  bar: 'bg-green-400',  pct: 'text-green-500',  badge: 'bg-green-50 text-green-600'  },
  { border: 'border-l-blue-400',   bar: 'bg-blue-400',   pct: 'text-blue-500',   badge: 'bg-blue-50 text-blue-600'    },
  { border: 'border-l-orange-400', bar: 'bg-orange-400', pct: 'text-orange-500', badge: 'bg-orange-50 text-orange-600' },
  { border: 'border-l-purple-400', bar: 'bg-purple-400', pct: 'text-purple-500', badge: 'bg-purple-50 text-purple-600' },
  { border: 'border-l-rose-400',   bar: 'bg-rose-400',   pct: 'text-rose-500',   badge: 'bg-rose-50 text-rose-600'    },
  { border: 'border-l-teal-400',   bar: 'bg-teal-400',   pct: 'text-teal-500',   badge: 'bg-teal-50 text-teal-600'    },
];

const accent = (i: number) => ACCENTS[i % ACCENTS.length];

const fmtDate = (d?: string) => {
  if (!d) return '';
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const ChapterRow: React.FC<{ ch: ChapterWithStatus; idx: number }> = ({ ch, idx }) => {
  const isCompleted  = ch.status === 'completed';
  const isInProgress = ch.status === 'in-progress';

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-3">
        {isCompleted ? (
          <span className="material-symbols-outlined text-[18px] text-green-500 flex-shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        ) : isInProgress ? (
          <span className="material-symbols-outlined text-[18px] text-amber-400 flex-shrink-0"
            style={{ fontVariationSettings: "'FILL' 0" }}>pending</span>
        ) : (
          <span className="material-symbols-outlined text-[18px] text-slate-300 flex-shrink-0"
            style={{ fontVariationSettings: "'FILL' 0" }}>radio_button_unchecked</span>
        )}
        <span className={`text-sm ${isCompleted ? 'text-slate-700' : 'text-slate-500'}`}>
          Chapter {idx + 1}: {ch.chapterName}
        </span>
      </div>
      <div className="flex-shrink-0 ml-4">
        {isCompleted && ch.completedDate ? (
          <span className="text-xs text-slate-400">{fmtDate(ch.completedDate)}</span>
        ) : isInProgress ? (
          <span className="text-[11px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">IN PROGRESS</span>
        ) : (
          <span className="text-[11px] font-bold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">PENDING</span>
        )}
      </div>
    </div>
  );
};

const SubjectCardComponent: React.FC<{
  card: SubjectCard;
  colorIdx: number;
  onToggleChapters: () => void;
  expanded: boolean;
}> = ({ card, colorIdx, onToggleChapters, expanded }) => {
  const c = accent(colorIdx);
  const pct = Math.round(card.progressPercentage);

  const completedChapters = card.chapters.filter(ch => ch.status === 'completed');
  const pendingChapters   = card.chapters.filter(ch => ch.status === 'pending' || ch.status === 'in-progress');
  const nextChapter       = pendingChapters[0];

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 border-l-4 ${c.border} shadow-sm overflow-hidden`}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="font-black text-slate-900 text-base">{card.subjectName}</h3>
            {card.teacherName && (
              <p className="text-xs text-slate-400 mt-0.5">Teacher: {card.teacherName}</p>
            )}
          </div>
          <span className={`text-xs font-black px-2.5 py-1 rounded-full ${c.badge}`}>
            {pct}% Complete
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Progress</span>
            <span className="text-[11px] font-bold text-slate-500">
              {card.completedChapters} of {card.totalChapters} Chapters
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${c.bar} rounded-full transition-all duration-700`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {!expanded && (
          <div className="mt-4">
            {completedChapters.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                  Chapter Breakdown
                </p>
                {completedChapters.slice(0, 3).map((ch) => (
                  <ChapterRow key={ch.chapterId} ch={ch} idx={card.chapters.indexOf(ch)} />
                ))}
                {nextChapter && (
                  <ChapterRow key={nextChapter.chapterId} ch={nextChapter} idx={card.chapters.indexOf(nextChapter)} />
                )}
              </div>
            )}
            {completedChapters.length === 0 && nextChapter && (
              <p className="text-xs text-slate-400 mt-1">
                Upcoming: Chapter {card.chapters.indexOf(nextChapter) + 1} – {nextChapter.chapterName}
              </p>
            )}
            {completedChapters.length > 0 && !nextChapter && (
              <p className="text-xs text-slate-400 mt-1">
                Completed: {completedChapters[completedChapters.length - 1].chapterName}
              </p>
            )}
          </div>
        )}

        {expanded && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            {card.chapters.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No chapters found.</p>
            ) : (
              card.chapters.map((ch, i) => (
                <ChapterRow key={ch.chapterId} ch={ch} idx={i} />
              ))
            )}
          </div>
        )}
      </div>

      <button
        onClick={onToggleChapters}
        className="w-full py-3 border-t border-slate-100 text-xs font-bold text-slate-500 hover:text-[#4A9FD4] hover:bg-slate-50 transition-colors"
      >
        {expanded
          ? 'Hide Chapters'
          : completedChapters.length > 0
            ? 'Show More Chapters'
            : 'View Syllabus Details'}
      </button>
    </div>
  );
};

const EMPTY_CHILDREN: LinkedStudent[] = [];

const ParentSyllabus: React.FC = () => {
  const { user } = useAuth();
  const { selectedYear } = useAcademicYear();

  const { data: childrenData, isLoading: loading } = useParentChildren(Number(user?.id));
  const children = childrenData || EMPTY_CHILDREN;
  const [selected, setSelected] = useState<LinkedStudent | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const { data: studentData } = useStudentClass(selected?.id ?? 0);
  const classId = studentData?.currentClassId ?? 0;

  const { data: subjectsData = [] } = useParentSubjects(
    classId,
    selectedYear?.id ? Number(selectedYear.id) : 0
  );

  const subjectCards = React.useMemo<SubjectCard[]>(() => {
    return subjectsData.map((cs) => ({
      classSubjectId: cs.id,
      subjectId: cs.subjectId,
      subjectName: cs.subjectName,
      totalChapters: 0,
      completedChapters: 0,
      progressPercentage: 0,
      chapters: [],
    }));
  }, [subjectsData]);

  React.useEffect(() => {
    if (children.length > 0 && !selected) {
      setSelected(children[0]);
    }
  }, [children, selected]);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
      setTimeout(() => updateScrollState(), 300);
    }
  };

  const updateScrollState = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  React.useEffect(() => {
    if (tabsRef.current) {
      updateScrollState();
      tabsRef.current.addEventListener('scroll', updateScrollState);
      return () => tabsRef.current?.removeEventListener('scroll', updateScrollState);
    }
  }, [children]);

  const toggleExpand = (classSubjectId: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(classSubjectId)) next.delete(classSubjectId);
      else next.add(classSubjectId);
      return next;
    });
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-[#4A9FD4] border-t-transparent rounded-full animate-spin" />
        </div>
    );
  }

  if (children.length === 0) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-slate-200 block mb-4">menu_book</span>
            <h3 className="text-lg font-bold text-slate-700 mb-1">No Students Linked</h3>
            <p className="text-sm text-slate-400">Contact school administration to link your children.</p>
          </div>
        </div>
    );
  }

  return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">

        <div className="relative">
          <div ref={tabsRef} className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto scrollbar-hide px-10">
            {children.map(child => (
              <button
                key={child.id}
                onClick={() => setSelected(child)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap flex-shrink-0 ${
                  selected?.id === child.id
                    ? 'border-[#4A9FD4] text-[#4A9FD4]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  account_circle
                </span>
                {child.fullName.split(' ')[0]}
              </button>
            ))}
          </div>
          {canScrollLeft && (
            <button
              onClick={() => scrollTabs('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center z-20 hover:bg-slate-50 hover:border-slate-300 hover:shadow transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-slate-600" style={{ fontVariationSettings: "'FILL' 1" }}>chevron_left</span>
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scrollTabs('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center z-20 hover:bg-slate-50 hover:border-slate-300 hover:shadow transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-slate-600" style={{ fontVariationSettings: "'FILL' 1" }}>chevron_right</span>
            </button>
          )}
        </div>

        {selected && (
          <>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Syllabus Completion</h1>
              <p className="text-sm text-slate-400 mt-1">
                Tracking academic progress for {selected.fullName}
                {selected.className ? ` • Class ${selected.className}${selected.classSection ? selected.classSection : ''}` : ''}
              </p>
            </div>

            {subjectCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="material-symbols-outlined text-6xl text-slate-200 block mb-4">auto_stories</span>
                <h3 className="text-base font-bold text-slate-600 mb-1">No Syllabus Data</h3>
                <p className="text-sm text-slate-400">No subjects or chapters found for this student.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {subjectCards.map((card, idx) => (
                  <SubjectCardComponent
                    key={card.classSubjectId}
                    card={card}
                    colorIdx={idx}
                    expanded={expanded.has(card.classSubjectId)}
                    onToggleChapters={() => toggleExpand(card.classSubjectId)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
  );
};

export default ParentSyllabus;
