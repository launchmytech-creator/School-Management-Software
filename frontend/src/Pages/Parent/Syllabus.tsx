import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { useSelectedChild } from "../../context/SelectedChildContext";
import {
  useParentChildren,
  useStudentClass,
  useParentSubjects,
} from "../../hooks/queries";
import type { LinkedStudent } from "../../types/parent";
import { syllabusService, type ChapterWithStatus } from "../../services/syllabusService";
import PageHeader from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { getSubjectIcon } from "../../lib/subject-utils";

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
  { bg: "bg-green-50", bar: "bg-green-400", pct: "text-green-500", icon: "text-green-500" },
  { bg: "bg-blue-50", bar: "bg-blue-400", pct: "text-blue-500", icon: "text-blue-500" },
  { bg: "bg-orange-50", bar: "bg-orange-400", pct: "text-orange-500", icon: "text-orange-500" },
  { bg: "bg-purple-50", bar: "bg-purple-400", pct: "text-purple-500", icon: "text-purple-500" },
  { bg: "bg-rose-50", bar: "bg-rose-400", pct: "text-rose-500", icon: "text-rose-500" },
  { bg: "bg-teal-50", bar: "bg-teal-400", pct: "text-teal-500", icon: "text-teal-500" },
];

const accent = (i: number) => ACCENTS[i % ACCENTS.length];

const ChapterRow: React.FC<{ ch: ChapterWithStatus; idx: number }> = ({
  ch,
}) => {
  const isCompleted = ch.status === "completed";
  const isInProgress = ch.status === "in-progress";

  return (
    <div className="flex items-center justify-between py-2 last:border-0 border-b border-slate-100">
      <div className="flex items-center gap-2">
        {isCompleted ? (
          <span className="text-green-500 text-sm">✓</span>
        ) : isInProgress ? (
          <span className="text-amber-500 text-sm">◐</span>
        ) : (
          <span className="text-slate-300 text-sm">○</span>
        )}
        <span className={`text-xs ${isCompleted ? "text-slate-600" : "text-slate-400"}`}>
          {ch.chapterName}
        </span>
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
        isCompleted ? "bg-green-50 text-green-600" : 
        isInProgress ? "bg-amber-50 text-amber-600" : 
        "bg-slate-100 text-slate-400"
      }`}>
        {isCompleted ? "Done" : isInProgress ? "In Progress" : "Pending"}
      </span>
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

  const completedChapters = card.chapters.filter(
    (ch) => ch.status === "completed",
  );

  return (
    <div className={`${c.bg} rounded-2xl border border-slate-100 p-5`}>
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 rounded-xl ${c.bg.replace('50', '100')} flex items-center justify-center`}>
          <span
            className={`material-symbols-outlined text-2xl ${c.icon}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {getSubjectIcon(card.subjectName)}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="font-black text-slate-900 text-base">
            {card.subjectName}
          </h3>
          {card.teacherName && (
            <p className="text-xs text-slate-400 mt-0.5">
              {card.teacherName}
            </p>
          )}
        </div>
        <span className={`text-lg font-black ${c.pct}`}>
          {pct}%
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Progress
          </span>
          <span className="text-xs font-bold text-slate-500">
            {card.completedChapters}/{card.totalChapters} Chapters
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${c.bar} rounded-full transition-all`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {!expanded && completedChapters.length > 0 && (
        <div className="border-t border-slate-100 pt-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            Recent
          </p>
          {completedChapters.slice(0, 2).map((ch) => (
            <ChapterRow
              key={ch.chapterId}
              ch={ch}
              idx={card.chapters.indexOf(ch)}
            />
          ))}
        </div>
      )}

      {expanded && (
        <div className="border-t border-slate-200 pt-3 mt-3">
          {card.chapters.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              No chapters found.
            </p>
          ) : (
            card.chapters.map((ch, i) => (
              <ChapterRow key={ch.chapterId} ch={ch} idx={i} />
            ))
          )}
        </div>
      )}

      <button
        onClick={onToggleChapters}
        className="w-full mt-4 py-2 text-xs font-bold text-slate-500 hover:text-blue-500 hover:bg-slate-100 rounded-lg transition-colors"
      >
        {expanded ? 'Show Less' : 'View All Chapters'}
      </button>
    </div>
  );
};

const EMPTY_CHILDREN: LinkedStudent[] = [];

/** Parent Syllabus Page
 * 
 * Displays child's subject-wise syllabus progress.
 * Shows chapters completed, progress percentage per subject.
 * Uses SelectedChildContext for child selection.
 */
const ParentSyllabus: React.FC = () => {
  const { user } = useAuth();
  const { selectedYear } = useAcademicYear();
  const { selectedChildId } = useSelectedChild();

  const { data: childrenData, isLoading: loading } = useParentChildren(
    Number(user?.id),
  );
  const children = childrenData || EMPTY_CHILDREN;

  const selected = useMemo(() => {
    if (selectedChildId && children.length > 0) {
      return children.find(c => c.id === selectedChildId) || children[0] || null;
    }
    return children[0] || null;
  }, [children, selectedChildId]);
  
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const { data: studentData } = useStudentClass(selected?.id ?? 0);
  const classId = studentData?.currentClassId ?? 0;

  const { data: subjectsData = [] } = useParentSubjects(
    classId,
    selectedYear?.id ? Number(selectedYear.id) : 0,
  );

  const [subjectCards, setSubjectCards] = useState<SubjectCard[]>([]);

  React.useEffect(() => {
    if (!classId || !selectedYear?.id || subjectsData.length === 0) {
      setSubjectCards([]);
      return;
    }

    const fetchChapters = async () => {
      const academicYearId = Number(selectedYear.id);
      const cards = await Promise.all(
        subjectsData.map(async (cs) => {
          try {
            const chapters = await syllabusService.getChaptersWithStatusDirect(
              classId,
              cs.subjectId,
              academicYearId
            );
            const completedChapters = chapters.filter(
              (ch) => ch.status === "completed"
            ).length;
            const progressPercentage =
              chapters.length > 0
                ? Math.round((completedChapters / chapters.length) * 100)
                : 0;
            
            return {
              classSubjectId: cs.id,
              subjectId: cs.subjectId,
              subjectName: cs.subjectName,
              teacherName: undefined as string | undefined,
              totalChapters: chapters.length,
              completedChapters,
              progressPercentage,
              chapters,
            };
          } catch {
            return {
              classSubjectId: cs.id,
              subjectId: cs.subjectId,
              subjectName: cs.subjectName,
              teacherName: undefined as string | undefined,
              totalChapters: 0,
              completedChapters: 0,
              progressPercentage: 0,
              chapters: [] as ChapterWithStatus[],
            };
          }
        })
      );
      setSubjectCards(cards);
    };

    fetchChapters();
  }, [subjectsData, classId, selectedYear?.id]);

  const toggleExpand = (classSubjectId: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(classSubjectId)) next.delete(classSubjectId);
      else next.add(classSubjectId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-slate-200 block mb-4">
            menu_book
          </span>
          <h3 className="text-lg font-bold text-slate-700 mb-1">
            No Students Linked
          </h3>
          <p className="text-sm text-slate-400">
            Contact school administration to link your children.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <PageHeader
        title="Syllabus Completion"
        subtitle={
          selected
            ? `${selected.fullName} • ${selected.className ? `Class ${selected.className}${selected.classSection || ""}` : ""}`
            : undefined
        }
        breadcrumb={{
          links: [
            { label: "Dashboard", href: "/parent/dashboard" },
            { label: "Syllabus", active: true },
          ],
        }}
      />

      {selected && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {subjectCards.length === 0 ? (
            <div className="text-center py-12 col-span-2">
              <p className="text-sm text-slate-500">No syllabus data found</p>
              <p className="text-xs text-slate-400 mt-1">
                No subjects or chapters found for this student.
              </p>
            </div>
          ) : (
            subjectCards.map((card, idx) => (
              <SubjectCardComponent
                key={card.classSubjectId}
                card={card}
                colorIdx={idx}
                expanded={expanded.has(card.classSubjectId)}
                onToggleChapters={() => toggleExpand(card.classSubjectId)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ParentSyllabus;
