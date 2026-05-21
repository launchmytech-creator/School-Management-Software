import React from "react";
import { Plus, ChevronRight, Loader, Trash2, Pencil } from "lucide-react";
import { subjectIcon } from "../../lib/subject-utils";
import type { ClassSubject, Chapter } from "../../services/subjectService";

interface SubjectCardProps {
  classSubject: ClassSubject;
  isExpanded: boolean;
  chapters: Chapter[];
  isLoadingChapters: boolean;
  onToggle: () => void;
  onAddChapter: () => void;
  onEditSubject: () => void;
  onDeleteSubject: () => void;
  onDeleteChapter: (chapterId: number) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  classSubject,
  isExpanded,
  chapters,
  isLoadingChapters,
  onToggle,
  onAddChapter,
  onEditSubject,
  onDeleteSubject,
  onDeleteChapter,
}) => {
  const { icon: subjectIconName, bg: iconBg, text: iconText } = subjectIcon(classSubject.subjectName);
  
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
      <div
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-1.5 rounded-lg ${iconBg}`}>
            <span
              className={`material-symbols-outlined text-sm ${iconText}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {subjectIconName}
            </span>
          </div>
          <span className="font-medium text-slate-700">{classSubject.subjectName}</span>
          <span className="text-xs text-slate-400">({chapters.length} chapters)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddChapter();
            }}
            className="p-1.5 hover:bg-slate-100 rounded-lg"
            title="Add Chapter"
          >
            <Plus className="size-4 text-slate-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditSubject();
            }}
            className="p-1.5 hover:bg-blue-50 rounded-lg"
            title="Edit Subject"
          >
            <Pencil className="size-4 text-blue-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSubject();
            }}
            className="p-1.5 hover:bg-red-50 rounded-lg"
            title="Delete Subject"
          >
            <Trash2 className="size-4 text-red-400" />
          </button>
          <ChevronRight
            className={`size-4 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-100 p-3 bg-slate-50">
          {isLoadingChapters ? (
            <div className="text-center py-2">
              <Loader className="size-4 animate-spin mx-auto text-slate-400" />
            </div>
          ) : chapters.length > 0 ? (
            <div className="space-y-1">
              {chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-200 rounded flex items-center justify-center font-bold text-xs text-slate-600">
                      {chapter.sequenceNumber}
                    </div>
                    <span className="text-sm text-slate-600">{chapter.name}</span>
                  </div>
                  <button
                    onClick={() => onDeleteChapter(chapter.id)}
                    className="p-1 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="size-3 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-2">No chapters yet</p>
          )}
        </div>
      )}
    </div>
  );
};
