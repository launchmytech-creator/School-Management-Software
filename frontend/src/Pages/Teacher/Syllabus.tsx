import React, { useState, useCallback, useMemo } from 'react';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useTeacherAllocations } from '../../hooks/queries/useTeachers';
import { useUpdateChapterStatus } from '../../hooks/mutations/useSubjectMutations';
import { type TeacherAllocation } from '../../types/teacher';
import { type ChapterWithStatus } from '../../services/syllabusService';
import { BookOpen, CheckCircle, Clock, BookMarked, Users, Circle, Loader } from 'lucide-react';

interface TeacherSubjectProgress {
  allocationId: number;
  classId: number;
  className: string;
  classSection?: string;
  subjectId: number;
  subjectName: string;
  totalChapters: number;
  completedChapters: number;
  inProgressChapters: number;
  pendingChapters: number;
  progressPercentage: number;
}

interface TeacherSyllabusProps {
  customTitle?: string;
  isEditable?: boolean;
}

const TeacherSyllabus: React.FC<TeacherSyllabusProps> = ({ 
  customTitle, 
  isEditable = false 
}) => {
  const pageTitle = customTitle || "My Syllabus Progress";
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const { selectedYear } = useAcademicYear();

  const { data: allocationsData, isLoading: loadingAllocations } = useTeacherAllocations(
    user?.id ? Number(user.id) : 0,
    selectedYear?.id ? Number(selectedYear.id) : undefined
  );
  const allocations = allocationsData || [];

  const [chapterProgress, setChapterProgress] = useState<Record<number, ChapterWithStatus[]>>({});
  const [chapterLoading, setChapterLoading] = useState<Set<number>>(new Set());
  const [expandedClass, setExpandedClass] = useState<number | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);
  const [updatingChapter, setUpdatingChapter] = useState<number | null>(null);

  const updateChapterStatusMutation = useUpdateChapterStatus();

  const fetchChapters = useCallback(async (subjectId: number, classId: number, academicYearId: number) => {
    if (chapterProgress[subjectId]) return;
    
    setChapterLoading(prev => new Set(prev).add(subjectId));
    try {
      const chapters = await import('../../services/syllabusService').then(m => 
        m.syllabusService.getChaptersWithStatusDirect(classId, subjectId, academicYearId)
      );
      setChapterProgress(prev => ({ ...prev, [subjectId]: chapters }));
    } catch {
      showNotification('Failed to fetch chapters', 'error');
      setChapterProgress(prev => ({ ...prev, [subjectId]: [] }));
    } finally {
      setChapterLoading(prev => {
        const next = new Set(prev);
        next.delete(subjectId);
        return next;
      });
    }
  }, [chapterProgress, showNotification]);

  const updateChapterStatus = async (
    subjectId: number,
    chapterId: number,
    status: 'pending' | 'in-progress' | 'completed',
    classId: number,
  ) => {
    setUpdatingChapter(chapterId);
    try {
      await updateChapterStatusMutation.mutateAsync({
        classId,
        subjectId,
        chapterId,
        status,
        academicYearId: Number(selectedYear!.id),
      });

      setChapterProgress(prev => {
        const chapters = prev[subjectId] || [];
        const updated = chapters.map(c =>
          c.chapterId === chapterId ? { ...c, status } : c
        );
        return { ...prev, [subjectId]: updated };
      });

      showNotification(`Chapter marked as ${status}`, 'success');
    } catch {
      showNotification('Failed to update chapter status', 'error');
    } finally {
      setUpdatingChapter(null);
    }
  };

  const markAllComplete = async (subjectId: number, classId: number) => {
    const chapters = chapterProgress[subjectId] || [];
    const pendingChapters = chapters.filter(c => c.status !== 'completed');

    if (pendingChapters.length === 0) {
      showNotification('All chapters already completed', 'info');
      return;
    }

    setUpdatingChapter(-1);
    try {
      for (const chapter of pendingChapters) {
        await updateChapterStatusMutation.mutateAsync({
          classId,
          subjectId,
          chapterId: chapter.chapterId,
          status: 'completed',
          academicYearId: Number(selectedYear!.id),
        });
      }

      setChapterProgress(prev => {
        const updated = (prev[subjectId] || []).map(c => ({
          ...c,
          status: 'completed' as const,
        }));
        return { ...prev, [subjectId]: updated };
      });

      showNotification(`${pendingChapters.length} chapters marked as completed`, 'success');
    } catch {
      showNotification('Failed to mark all chapters complete', 'error');
    } finally {
      setUpdatingChapter(null);
    }
  };

  const toggleClass = (classId: number) => {
    setExpandedClass(expandedClass === classId ? null : classId);
    setExpandedSubject(null);
  };

  const toggleSubject = async (subjectId: number, classId: number) => {
    if (expandedSubject === subjectId) {
      setExpandedSubject(null);
      return;
    }
    setExpandedSubject(subjectId);
    await fetchChapters(subjectId, classId, Number(selectedYear?.id));
  };

  const subjectProgress = useMemo(() => {
    return allocations.map((allocation) => {
      const chapters = chapterProgress[allocation.subjectId] || [];
      const completedChapters = chapters.filter(c => c.status === 'completed').length;
      const inProgressChapters = chapters.filter(c => c.status === 'in-progress').length;
      const totalChapters = chapters.length;
      const progressPercentage = totalChapters > 0 
        ? Math.round((completedChapters / totalChapters) * 100) 
        : 0;

      return {
        allocationId: allocation.id,
        classId: allocation.classId,
        className: allocation.className,
        classSection: allocation.classSection,
        subjectId: allocation.subjectId,
        subjectName: allocation.subjectName,
        totalChapters,
        completedChapters,
        inProgressChapters,
        pendingChapters: totalChapters - completedChapters - inProgressChapters,
        progressPercentage,
      } as TeacherSubjectProgress;
    });
  }, [allocations, chapterProgress]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (percentage >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (status: string | null | undefined) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <Circle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">Completed</span>;
      case 'in-progress':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">In Progress</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">Pending</span>;
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'in-progress':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const overallStats = {
    totalSubjects: subjectProgress.length,
    totalChapters: subjectProgress.reduce((sum, p) => sum + p.totalChapters, 0),
    completedChapters: subjectProgress.reduce((sum, p) => sum + p.completedChapters, 0),
    overallPercentage: 0,
  };

  overallStats.overallPercentage = overallStats.totalChapters > 0
    ? Math.round((overallStats.completedChapters / overallStats.totalChapters) * 100)
    : 0;

  type ClassGroup = { 
    classId: number; 
    className: string; 
    classSection?: string; 
    allocations: TeacherAllocation[] 
  };
  
  const groupedByClass = allocations.reduce((acc, allocation) => {
    const key = `${allocation.classId}-${allocation.className}`;
    if (!acc[key]) {
      acc[key] = {
        classId: allocation.classId,
        className: allocation.className,
        classSection: allocation.classSection,
        allocations: [],
      } as ClassGroup;
    }
    acc[key].allocations.push(allocation);
    return acc;
  }, {} as Record<string, ClassGroup>);

  if (loadingAllocations) {
    return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-slate-400">Loading syllabus data...</div>
        </div>
    );
  }

  return (
      <div className="space-y-6 pb-12">
        <PageHeader 
          title={pageTitle}
          subtitle={isEditable 
            ? "Update syllabus completion status for your assigned classes and subjects" 
            : "Track syllabus completion for your assigned classes and subjects"
          }
          breadcrumb={{
            links: [
              { label: "Dashboard", href: "/teacher/dashboard" },
              { label: pageTitle, active: true }
            ]
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{overallStats.totalSubjects}</p>
                <p className="text-sm text-blue-100">Subjects Assigned</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <BookMarked className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{overallStats.overallPercentage}%</p>
                <p className="text-sm text-purple-100">Overall Progress</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{overallStats.completedChapters}</p>
                <p className="text-sm text-emerald-100">Chapters Done</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{overallStats.totalChapters}</p>
                <p className="text-sm text-slate-100">Total Chapters</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {allocations.length === 0 ? (
          <EmptyState
            icon={BookMarked}
            title="No subjects assigned"
            description="You haven't been assigned to any class and subject yet. Contact your school admin."
          />
        ) : (
          <div className="space-y-4">
            {Object.values(groupedByClass).map((classGroup) => {
              const classProgress = subjectProgress.filter(
                p => p.classId === classGroup.classId
              );
              const completedInClass = classProgress.reduce((sum, p) => sum + p.completedChapters, 0);
              const totalInClass = classProgress.reduce((sum, p) => sum + p.totalChapters, 0);
              const classPercentage = totalInClass > 0
                ? Math.round((completedInClass / totalInClass) * 100)
                : 0;

              return (
                <div key={`${classGroup.classId}-${classGroup.className}`} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div 
                    className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleClass(classGroup.classId)}
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
                            {classGroup.allocations.length} subject{classGroup.allocations.length !== 1 ? 's' : ''} assigned • {completedInClass}/{totalInClass} chapters completed
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
                          const progress = subjectProgress.find(p => p.allocationId === allocation.id);
                          const percentage = progress?.progressPercentage || 0;
                          const isSubjectExpanded = expandedSubject === allocation.subjectId;
                          const isChaptersLoading = chapterLoading.has(allocation.subjectId);
                          const chapters = chapterProgress[allocation.subjectId] || [];

                          return (
                            <div key={allocation.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                              <div 
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => toggleSubject(allocation.subjectId, allocation.classId)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    percentage >= 80 ? 'bg-emerald-100' :
                                    percentage >= 50 ? 'bg-amber-100' : 'bg-slate-100'
                                  }`}>
                                    <BookOpen className={`w-4 h-4 ${
                                      percentage >= 80 ? 'text-emerald-600' :
                                      percentage >= 50 ? 'text-amber-600' : 'text-slate-500'
                                    }`} />
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-800">{allocation.subjectName}</p>
                                    <p className="text-xs text-slate-500">
                                      {progress?.completedChapters || 0}/{progress?.totalChapters || 0} chapters completed
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
                                    <svg className="w-4 h-4 text-slate-400 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  )}
                                </div>
                              </div>

                              {isSubjectExpanded && (
                                <div className="border-t border-slate-200 p-4 bg-white">
                                  <div className="flex items-center justify-between mb-3">
                                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chapters</h5>
                                    {isEditable && chapters.length > 0 && (
                                      <button
                                        onClick={() => markAllComplete(allocation.subjectId, allocation.classId)}
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
                                              value={chapter.status || 'pending'}
                                              onChange={(e) => {
                                                if (updatingChapter === null) {
                                                  updateChapterStatus(
                                                    allocation.subjectId,
                                                    chapter.chapterId,
                                                    e.target.value as 'pending' | 'in-progress' | 'completed',
                                                    allocation.classId,
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
                                            getStatusBadge(chapter.status)
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
            })}
          </div>
        )}
      </div>
  );
};

export default TeacherSyllabus;
