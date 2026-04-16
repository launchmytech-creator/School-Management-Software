import React from "react";
import { BookOpen, Users, Loader } from "lucide-react";
import { type TeacherAllocation } from "../../types/teacher";
import { type ChapterWithStatus } from "../../services/syllabusService";

interface SubjectProgress {
  allocationId: number;
  classId: number;
  subjectId: number;
  progressPercentage: number;
  completedChapters: number;
  totalChapters: number;
  inProgressChapters: number;
}

interface ClassGroup {
  classId: number;
  className: string;
  classSection?: string;
  allocations: TeacherAllocation[];
}

interface ClassSyllabusCardProps {
  classGroup: ClassGroup;
  subjectProgress: SubjectProgress[];
  chapterProgress: Record<number, ChapterWithStatus[]>;
  chapterLoading: Set<number>;
  expandedClass: number | null;
  expandedSubject: number | null;
  updatingChapter: number | null;
  isEditable: boolean;
  onToggleClass: (classId: number) => void;
  onToggleSubject: (subjectId: number, classId: number) => void;
  onMarkAllComplete: (subjectId: number, classId: number) => void;
  onChapterStatusChange: (
    subjectId: number,
    chapterId: number,
    status: "pending" | "in-progress" | "completed",
    classId: number
  ) => void;
}

const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return "bg-emerald-100 text-emerald-600";
  if (percentage >= 50) return "bg-amber-100 text-amber-600";
  return "bg-slate-100 text-slate-500";
};

const getProgressBarColor = (percentage: number) => {
  if (percentage >= 80) return "bg-emerald-500";
  if (percentage >= 50) return "bg-amber-500";
  return "bg-slate-400";
};

const getStatusColor = (status?: string | null) => {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    case "in-progress":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

const getStatusIcon = (status?: string | null) => {
  switch (status) {
    case "completed":
      return (
        <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case "in-progress":
      return (
        <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
          <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
        </div>
      );
    default:
      return (
        <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-slate-400 rounded-full" />
        </div>
      );
  }
};

export const ClassSyllabusCard: React.FC<ClassSyllabusCardProps> = ({
  classGroup,
  subjectProgress,
  chapterProgress,
  chapterLoading,
  expandedClass,
  expandedSubject,
  updatingChapter,
  isEditable,
  onToggleClass,
  onToggleSubject,
  onMarkAllComplete,
  onChapterStatusChange,
}) => {
  const classProgress = subjectProgress.filter((p) => p.classId === classGroup.classId);
  const completedInClass = classProgress.reduce((sum, p) => sum + p.completedChapters, 0);
  const totalInClass = classProgress.reduce((sum, p) => sum + p.totalChapters, 0);
  const classPercentage =
    totalInClass > 0 ? Math.round((completedInClass / totalInClass) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div
        className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => onToggleClass(classGroup.classId)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${getProgressColor(classPercentage)}`}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                {classGroup.className}
                {classGroup.classSection && ` - Section ${classGroup.classSection}`}
              </h3>
              <p className="text-sm text-slate-500">
                {classGroup.allocations.length} subject
                {classGroup.allocations.length !== 1 ? "s" : ""} assigned • {completedInClass}/{totalInClass} chapters
                completed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-2xl font-bold text-slate-900">{classPercentage}%</span>
              <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full transition-all ${getProgressBarColor(classPercentage)}`}
                  style={{ width: `${classPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {expandedClass === classGroup.classId && (
        <div className="border-t border-slate-200 bg-slate-50 p-5">
          <div className="space-y-3">
            {classGroup.allocations.map((allocation) => {
              const progress = subjectProgress.find((p) => p.allocationId === allocation.id);
              const percentage = progress?.progressPercentage || 0;
              const isSubjectExpanded = expandedSubject === allocation.subjectId;
              const isChaptersLoading = chapterLoading.has(allocation.subjectId);
              const chapters = chapterProgress[allocation.subjectId] || [];

              return (
                <div
                  key={allocation.id}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden"
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => onToggleSubject(allocation.subjectId, allocation.classId)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          percentage >= 80
                            ? "bg-emerald-100"
                            : percentage >= 50
                            ? "bg-amber-100"
                            : "bg-slate-100"
                        }`}
                      >
                        <BookOpen
                          className={`w-4 h-4 ${
                            percentage >= 80
                              ? "text-emerald-600"
                              : percentage >= 50
                              ? "text-amber-600"
                              : "text-slate-500"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{allocation.subjectName}</p>
                        <p className="text-xs text-slate-500">
                          {progress?.completedChapters || 0}/{progress?.totalChapters || 0} chapters
                          completed
                          {progress && progress.inProgressChapters > 0 && (
                            <> • {progress.inProgressChapters} in progress</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getProgressBarColor(percentage)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 w-12 text-right">
                        {percentage}%
                      </span>
                      {isChaptersLoading ? (
                        <Loader className="w-4 h-4 animate-spin text-slate-400" />
                      ) : isSubjectExpanded ? (
                        <svg
                          className="w-4 h-4 text-slate-400 transform rotate-180"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 text-slate-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>

                  {isSubjectExpanded && (
                    <div className="border-t border-slate-200 p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Chapters
                        </h5>
                        {isEditable && chapters.length > 0 && (
                          <button
                            onClick={() =>
                              onMarkAllComplete(allocation.subjectId, allocation.classId)
                            }
                            disabled={updatingChapter !== null}
                            className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                          >
                            Mark All Complete
                          </button>
                        )}
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {chapters.length === 0 ? (
                          <p className="text-sm text-slate-500 text-center py-4">
                            No chapters available for this subject
                          </p>
                        ) : (
                          chapters.map((chapter) => (
                            <div
                              key={chapter.chapterId}
                              className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                {getStatusIcon(chapter.status)}
                                <div>
                                  <p className="text-sm font-medium text-slate-700">
                                    Ch. {chapter.sequenceNumber}: {chapter.chapterName}
                                  </p>
                                </div>
                              </div>
                              {isEditable ? (
                                <select
                                  value={chapter.status || "pending"}
                                  onChange={(e) => {
                                    if (updatingChapter === null) {
                                      onChapterStatusChange(
                                        allocation.subjectId,
                                        chapter.chapterId,
                                        e.target.value as "pending" | "in-progress" | "completed",
                                        allocation.classId
                                      );
                                    }
                                  }}
                                  disabled={updatingChapter !== null}
                                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border-0 cursor-pointer transition-colors ${getStatusColor(chapter.status)} disabled:opacity-50`}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="in-progress">In Progress</option>
                                  <option value="completed">Completed</option>
                                </select>
                              ) : (
                                <span
                                  className={`px-3 py-1 text-xs font-bold rounded-lg ${getStatusColor(chapter.status || "pending")}`}
                                >
                                  {chapter.status === "completed"
                                    ? "Done"
                                    : chapter.status === "in-progress"
                                    ? "In Progress"
                                    : "Pending"}
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
