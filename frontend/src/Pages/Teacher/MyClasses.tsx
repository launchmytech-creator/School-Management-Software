import React, { useState, useEffect, useCallback } from "react";
import TeacherLayout from "../../layouts/TeacherLayout";
import { useAuth } from "../../context/AuthContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { useNotification } from "../../context/NotificationContext";
import { teacherService } from "../../services/teacherService";
import {
  syllabusService,
  type ChapterWithStatus,
} from "../../services/syllabusService";
import { type TeacherAllocation } from "../../types/teacher";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  CheckCircle,
  Clock,
  Circle,
  School,
  GraduationCap,
} from "lucide-react";

interface ClassGroup {
  classId: number;
  className: string;
  classSection: string;
  allocations: TeacherAllocation[];
  totalChapters: number;
  completedChapters: number;
  progressPercentage: number;
}


const MyClasses: React.FC = () => {
  const { user } = useAuth();
  const { selectedYear } = useAcademicYear();
  const { showNotification } = useNotification();

  const [allocations, setAllocations] = useState<TeacherAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(
    new Set(),
  );
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(
    new Set(),
  );
  const [chapterProgress, setChapterProgress] = useState<
    Record<string, ChapterWithStatus[]>
  >({});
  const [chapterLoading, setChapterLoading] = useState<Set<string>>(new Set());
  const [updatingChapter, setUpdatingChapter] = useState<number | null>(null);
  const [initialChapterLoading, setInitialChapterLoading] = useState(true);

  const teacherId = user?.id as number;

  const fetchAllocations = useCallback(async () => {
    if (!teacherId || !selectedYear?.id) return;
    console.log("[MyClasses] fetchAllocations called:", {
      teacherId,
      selectedYearId: selectedYear.id,
    });
    try {
      setLoading(true);
      const data = await teacherService.getAllocationsByTeacher(
        teacherId,
        Number(selectedYear.id),
      );
      console.log("[MyClasses] allocations from backend:", data);
      setAllocations(data);
    } catch {
      showNotification("Failed to fetch your classes", "error");
    } finally {
      setLoading(false);
    }
  }, [teacherId, selectedYear, showNotification]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  useEffect(() => {
    if (allocations.length === 0 || !selectedYear?.id) return;

    const fetchAllChapters = async () => {
      setInitialChapterLoading(true);
      try {
        const chapterPromises = allocations.map(async (allocation) => {
          const key = `${allocation.classId}-${allocation.subjectId}`;
          try {
            const chapters = await syllabusService.getChaptersWithStatusDirect(
              allocation.classId,
              allocation.subjectId,
              Number(selectedYear.id),
            );
            return { key, chapters };
          } catch (err) {
            console.error(`[MyClasses] Failed to fetch chapters for ${key}:`, err);
            return { key, chapters: [] };
          }
        });

        const results = await Promise.all(chapterPromises);
        const newChapterProgress: Record<string, ChapterWithStatus[]> = {};
        results.forEach(({ key, chapters }) => {
          newChapterProgress[key] = chapters;
        });
        setChapterProgress(newChapterProgress);
      } catch (err) {
        console.error("[MyClasses] Error fetching chapters:", err);
        showNotification("Failed to fetch chapter progress", "error");
      } finally {
        setInitialChapterLoading(false);
      }
    };

    fetchAllChapters();
  }, [allocations, selectedYear, showNotification]);


  const groupedByClass = useCallback((): ClassGroup[] => {
    const groups: Record<number, ClassGroup> = {};

    allocations.forEach((allocation) => {
      const key = allocation.classId;
      if (!groups[key]) {
        groups[key] = {
          classId: allocation.classId,
          className: allocation.className,
          classSection: allocation.classSection || "A",
          allocations: [],
          totalChapters: 0,
          completedChapters: 0,
          progressPercentage: 0,
        };
      }
      groups[key].allocations.push(allocation);
    });

    Object.values(groups).forEach((group) => {
      let totalChapters = 0;
      let completedChapters = 0;

      group.allocations.forEach((allocation) => {
        const chapters = chapterProgress[`${allocation.classId}-${allocation.subjectId}`] || [];
        totalChapters += chapters.length;
        completedChapters += chapters.filter(
          (c) => c.status === "completed",
        ).length;
      });

      group.totalChapters = totalChapters;
      group.completedChapters = completedChapters;
      group.progressPercentage =
        totalChapters > 0
          ? Math.round((completedChapters / totalChapters) * 100)
          : 0;
    });

    return Object.values(groups);
  }, [allocations, chapterProgress]);

  const toggleClass = async (classId: number) => {
    setExpandedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      return next;
    });
  };

  const toggleSubject = async (subjectId: number, classId: number) => {
    const key = `${classId}-${subjectId}`;
    if (expandedSubjects.has(key)) {
      setExpandedSubjects((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      return;
    }

    setExpandedSubjects((prev) => new Set(prev).add(key));

    if (!chapterProgress[key]) {
      // Use classId + subjectId + academicYearId directly to get chapters with status
      setChapterLoading((prev) => new Set(prev).add(key));
      try {
        const chapters = await syllabusService.getChaptersWithStatusDirect(
          classId,
          subjectId,
          Number(selectedYear!.id),
        );
        console.log(
          "[MyClasses] getChaptersWithStatusDirect result:",
          chapters,
        );
        setChapterProgress((prev) => ({ ...prev, [key]: chapters }));
      } catch (err) {
        console.error("[MyClasses] error fetching chapters:", err);
        showNotification("Failed to fetch chapters", "error");
        setChapterProgress((prev) => ({ ...prev, [key]: [] }));
      } finally {
        setChapterLoading((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    }
  };

  const updateChapterStatus = async (
    subjectId: number,
    chapterId: number,
    status: "pending" | "in-progress" | "completed",
    classId: number,
  ) => {
    const key = `${classId}-${subjectId}`;
    setUpdatingChapter(chapterId);
    try {
      // Use direct method - finds classSubjectId automatically
      await syllabusService.markCompletionDirect(
        classId,
        subjectId,
        chapterId,
        status,
        Number(selectedYear!.id),
      );
      console.log("[MyClasses] markCompletionDirect success");

      // Update local state
      const chapters = chapterProgress[key] || [];
      const updatedChapters = chapters.map((c) =>
        c.chapterId === chapterId ? { ...c, status } : c,
      );
      setChapterProgress((prev) => ({ ...prev, [key]: updatedChapters }));

      showNotification(`Chapter marked as ${status}`, "success");
    } catch (err) {
      console.error("[MyClasses] updateChapterStatus error:", err);
      showNotification("Failed to update chapter status", "error");
    } finally {
      setUpdatingChapter(null);
    }
  };

  const markAllComplete = async (subjectId: number, classId: number) => {
    const key = `${classId}-${subjectId}`;
    const chapters = chapterProgress[key] || [];
    const pendingChapters = chapters.filter((c) => c.status !== "completed");

    if (pendingChapters.length === 0) {
      showNotification("All chapters are already completed", "info");
      return;
    }

    setUpdatingChapter(-1);
    try {
      // Mark each chapter as completed using direct method
      for (const chapter of pendingChapters) {
        await syllabusService.markCompletionDirect(
          classId,
          subjectId,
          chapter.chapterId,
          "completed",
          Number(selectedYear!.id),
        );
      }
      console.log("[MyClasses] markAllComplete success");

      // Update local state
      const updatedChapters = chapters.map((c) => ({
        ...c,
        status: "completed" as const,
      }));
      setChapterProgress((prev) => ({ ...prev, [key]: updatedChapters }));

      showNotification(
        `${pendingChapters.length} chapters marked as completed`,
        "success",
      );
    } catch (err) {
      console.error("[MyClasses] markAllComplete error:", err);
      showNotification("Failed to mark all chapters complete", "error");
    } finally {
      setUpdatingChapter(null);
    }
  };

  const getStatusIcon = (status: string | null | undefined) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <Circle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "in-progress":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getSubjectProgress = (classId: number, subjectId: number) => {
    const chapters = chapterProgress[`${classId}-${subjectId}`] || [];
    if (chapters.length === 0) return { completed: 0, total: 0, percentage: 0 };
    const completed = chapters.filter((c) => c.status === "completed").length;
    return {
      completed,
      total: chapters.length,
      percentage: Math.round((completed / chapters.length) * 100),
    };
  };

  const classGroups = groupedByClass();

  if (loading || initialChapterLoading) {
    return (
      <TeacherLayout title="My Classes">
        <div className="h-96 flex items-center justify-center">
          <LoadingSpinner size="lg" message="Loading your classes..." />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="My Classes">
      <div className="space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            <span>Dashboard</span>
            <span className="text-slate-300">/</span>
            <span className="text-blue-500">My Classes</span>
          </div>
          {selectedYear && (
            <span className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">
              {selectedYear.name}
            </span>
          )}
        </div>

        {classGroups.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-slate-100 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <School className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">
              No Classes Assigned
            </h3>
            <p className="text-slate-500 font-medium">
              Contact your administrator to assign classes and subjects.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {classGroups.map((classGroup) => (
              <div
                key={classGroup.classId}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
              >
                <div
                  className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleClass(classGroup.classId)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        {classGroup.className} - Section{" "}
                        {classGroup.classSection}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {classGroup.allocations.length} subject
                        {classGroup.allocations.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${classGroup.progressPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-600 w-12">
                        {classGroup.progressPercentage}%
                      </span>
                    </div>
                    {expandedClasses.has(classGroup.classId) ? (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {expandedClasses.has(classGroup.classId) && (
                  <div className="border-t border-slate-100 p-6 bg-slate-50/50">
                    <div className="space-y-3">
                      {classGroup.allocations.map((allocation) => {
                        const subjectProgress = getSubjectProgress(
                          allocation.classId,
                          allocation.subjectId,
                        );
                        const isExpanded = expandedSubjects.has(
                          `${allocation.classId}-${allocation.subjectId}`,
                        );
                        const isChapterLoading = chapterLoading.has(
                          `${allocation.classId}-${allocation.subjectId}`,
                        );

                        return (
                          <div
                            key={allocation.id}
                            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                          >
                            <div
                              className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                              onClick={() =>
                                toggleSubject(
                                  allocation.subjectId,
                                  allocation.classId,
                                )
                              }
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                  <BookOpen className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900">
                                    {allocation.subjectName}
                                  </h4>
                                  <p className="text-xs text-slate-500">
                                    {allocation.subjectCode}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-sm font-bold text-slate-700">
                                    {subjectProgress.total > 0
                                      ? `${subjectProgress.completed}/${subjectProgress.total} Chapters`
                                      : "No chapters"}
                                  </p>
                                  {subjectProgress.total > 0 && (
                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                                      <div
                                        className="h-full bg-indigo-500 rounded-full"
                                        style={{
                                          width: `${subjectProgress.percentage}%`,
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                                {isChapterLoading ? (
                                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                ) : isExpanded ? (
                                  <ChevronDown className="w-5 h-5 text-slate-400" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="border-t border-slate-200 p-4 bg-white">
                                <div className="flex items-center justify-between mb-4">
                                  <h5 className="text-sm font-bold text-slate-700">
                                    Chapters
                                  </h5>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAllComplete(
                                        allocation.subjectId,
                                        allocation.classId,
                                      );
                                    }}
                                    disabled={updatingChapter !== null}
                                    className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                  >
                                    Mark All Complete
                                  </button>
                                </div>
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                  {(chapterProgress[`${allocation.classId}-${allocation.subjectId}`] || [])
                                    .length === 0 ? (
                                    <p className="text-sm text-slate-500 text-center py-4">
                                      No chapters available for this subject
                                    </p>
                                  ) : (
                                    (
                                      chapterProgress[`${allocation.classId}-${allocation.subjectId}`] ||
                                      []
                                    ).map((chapter) => (
                                      <div
                                        key={chapter.chapterId}
                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                      >
                                        <div className="flex items-center gap-3">
                                          {getStatusIcon(chapter.status)}
                                          <span className="text-sm font-medium text-slate-700">
                                            Ch. {chapter.sequenceNumber}:{" "}
                                            {chapter.chapterName}
                                          </span>
                                        </div>
                                        <select
                                          value={chapter.status || "pending"}
                                          onChange={(e) => {
                                            if (updatingChapter === null) {
                                              updateChapterStatus(
                                                allocation.subjectId,
                                                chapter.chapterId,
                                                e.target.value as
                                                  | "pending"
                                                  | "in-progress"
                                                  | "completed",
                                                allocation.classId,
                                              );
                                            }
                                          }}
                                          disabled={updatingChapter !== null}
                                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border-0 cursor-pointer transition-colors ${getStatusColor(chapter.status)} disabled:opacity-50`}
                                        >
                                          <option value="pending">
                                            Pending
                                          </option>
                                          <option value="in-progress">
                                            In Progress
                                          </option>
                                          <option value="completed">
                                            Completed
                                          </option>
                                        </select>
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
            ))}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default MyClasses;
