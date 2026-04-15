import React, { useState, useCallback } from 'react';

import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useAllClassesProgress } from '../../hooks/queries/useSyllabus';
import { useUpdateChapterStatus, useBulkUpdateChapterStatus } from '../../hooks/mutations/useSubjectMutations';
import { syllabusService, type ChapterWithStatus } from '../../services/syllabusService';
import { BookOpen, CheckCircle, Clock, BookMarked, ChevronRight, Loader, Circle } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { QueryErrorFallback } from '../../components/error';

const SyllabusTracking: React.FC = () => {
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();

  const { data: classesProgressData, isLoading: loadingProgress } = useAllClassesProgress();
  const classesProgress = classesProgressData?.classes || [];
  
  const [expandedClass, setExpandedClass] = useState<number | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);
  const [chapterStatusesCache, setChapterStatusesCache] = useState<Record<string, ChapterWithStatus[]>>({});
  const [loadingChapters, setLoadingChapters] = useState<Set<string>>(new Set());
  const [updatingChapter, setUpdatingChapter] = useState<number | null>(null);

  const updateChapterStatusMutation = useUpdateChapterStatus();
  const bulkUpdateMutation = useBulkUpdateChapterStatus();

  const fetchSubjectChapters = useCallback(async (classId: number, subjectId: number, academicYearId: number) => {
    const cacheKey = `${classId}-${subjectId}`;
    
    if (chapterStatusesCache[cacheKey]) return;
    if (loadingChapters.has(cacheKey)) return;
    
    setLoadingChapters(prev => new Set(prev).add(cacheKey));
    
    try {
      const chaptersWithStatus = await syllabusService.getChaptersWithStatusDirect(
        classId,
        subjectId,
        academicYearId
      );
      setChapterStatusesCache(prev => ({ ...prev, [cacheKey]: chaptersWithStatus }));
    } catch {
      showNotification('Failed to fetch chapters', 'error');
    } finally {
      setLoadingChapters(prev => {
        const next = new Set(prev);
        next.delete(cacheKey);
        return next;
      });
    }
  }, [chapterStatusesCache, loadingChapters]);

  const handleClassClick = async (classId: number) => {
    if (expandedClass === classId) {
      setExpandedClass(null);
      setExpandedSubject(null);
    } else {
      setExpandedClass(classId);
      setExpandedSubject(null);
    }
  };

  const handleSubjectClick = async (classId: number, subjectId: number) => {
    if (expandedSubject === subjectId) {
      setExpandedSubject(null);
    } else {
      setExpandedSubject(subjectId);
      await fetchSubjectChapters(classId, subjectId, Number(selectedYear?.id));
    }
  };

  const updateChapterStatus = async (
    classId: number,
    subjectId: number,
    chapterId: number,
    status: 'completed' | 'in-progress' | 'pending'
  ) => {
    setUpdatingChapter(chapterId);
    try {
      await updateChapterStatusMutation.mutateAsync({
        classId,
        subjectId,
        chapterId,
        status,
        academicYearId: Number(selectedYear?.id),
      });
      
      const cacheKey = `${classId}-${subjectId}`;
      setChapterStatusesCache(prev => ({
        ...prev,
        [cacheKey]: (prev[cacheKey] || []).map(ch =>
          ch.chapterId === chapterId ? { ...ch, status } : ch
        )
      }));
      
      showNotification(`Chapter marked as ${status}`, 'success');
    } catch {
      showNotification('Failed to update status', 'error');
    } finally {
      setUpdatingChapter(null);
    }
  };

  const bulkUpdateChapters = async (
    classId: number,
    subjectId: number,
    chapters: ChapterWithStatus[],
    newStatus: 'completed' | 'in-progress' | 'pending'
  ) => {
    setUpdatingChapter(-1);
    try {
      await bulkUpdateMutation.mutateAsync({
        classId,
        subjectId,
        chapterIds: chapters.map(ch => ch.chapterId),
        status: newStatus,
        academicYearId: Number(selectedYear?.id),
      });
      
      const cacheKey = `${classId}-${subjectId}`;
      setChapterStatusesCache(prev => ({
        ...prev,
        [cacheKey]: (prev[cacheKey] || []).map(ch => ({ ...ch, status: newStatus }))
      }));
      
      showNotification(`All chapters marked as ${newStatus}`, 'success');
    } catch {
      showNotification('Failed to update chapters', 'error');
    } finally {
      setUpdatingChapter(null);
    }
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

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 border-emerald-200';
      case 'in-progress':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getStatusSelectColor = (status: string | null | undefined) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'in-progress':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-600 bg-emerald-50';
    if (percentage >= 50) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Syllabus Tracking"
        subtitle="Track and manage syllabus completion progress"
        breadcrumb={{
          links: [
            { label: "Academics", href: "/admin/syllabus-tracking" },
            { label: "Syllabus Tracking", active: true }
          ]
        }}
      />

      <QueryErrorFallback>
        {loadingProgress ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 flex items-center justify-center">
            <div className="animate-pulse text-slate-400">Loading class progress...</div>
          </div>
        ) : classesProgress.length > 0 ? (
          <div className="space-y-4">
          {classesProgress.map((classProgress) => {
            const isClassExpanded = expandedClass === classProgress.classId;
            
            return (
              <div key={classProgress.classId} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div 
                  className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => handleClassClick(classProgress.classId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${getProgressColor(classProgress.overallPercentage)}`}>
                        <BookMarked className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {classProgress.className}
                          {classProgress.classSection && ` - Section ${classProgress.classSection}`}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {classProgress.totalSubjects} subjects • {classProgress.completedChapters}/{classProgress.totalChapters} chapters completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-2xl font-bold text-slate-900">{classProgress.overallPercentage}%</span>
                        <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden mt-1">
                          <div 
                            className={`h-full rounded-full transition-all ${getProgressBarColor(classProgress.overallPercentage)}`}
                            style={{ width: `${classProgress.overallPercentage}%` }}
                          />
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isClassExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </div>

                {isClassExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50 p-5">
                    <SubjectSection
                      classProgress={classProgress}
                      expandedSubject={expandedSubject}
                      chapterStatusesCache={chapterStatusesCache}
                      loadingChapters={loadingChapters}
                      updatingChapter={updatingChapter}
                      onSubjectClick={handleSubjectClick}
                      onUpdateChapterStatus={updateChapterStatus}
                      onBulkUpdateChapters={bulkUpdateChapters}
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                      getStatusSelectColor={getStatusSelectColor}
                      getProgressBarColor={getProgressBarColor}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={BookMarked}
          title="No classes found"
          description="No classes have been set up yet"
        />
      )}
      </QueryErrorFallback>
    </div>
  );
};

interface SubjectSectionProps {
  classProgress: {
    classId: number;
    subjects: Array<{
      classSubjectId: number;
      subjectId: number;
      subjectName: string;
      totalChapters: number;
      completedChapters: number;
      inProgressChapters: number;
      progressPercentage: number;
    }>;
  };
  expandedSubject: number | null;
  chapterStatusesCache: Record<string, ChapterWithStatus[]>;
  loadingChapters: Set<string>;
  updatingChapter: number | null;
  onSubjectClick: (classId: number, subjectId: number) => void;
  onUpdateChapterStatus: (classId: number, subjectId: number, chapterId: number, status: 'completed' | 'in-progress' | 'pending') => void;
  onBulkUpdateChapters: (classId: number, subjectId: number, chapters: ChapterWithStatus[], newStatus: 'completed' | 'in-progress' | 'pending') => void;
  getStatusIcon: (status: string | null | undefined) => React.ReactNode;
  getStatusColor: (status: string | null | undefined) => string;
  getStatusSelectColor: (status: string | null | undefined) => string;
  getProgressBarColor: (percentage: number) => string;
}

const SubjectSection: React.FC<SubjectSectionProps> = ({
  classProgress,
  expandedSubject,
  chapterStatusesCache,
  loadingChapters,
  updatingChapter,
  onSubjectClick,
  onUpdateChapterStatus,
  onBulkUpdateChapters,
  getStatusIcon,
  getStatusColor,
  getStatusSelectColor,
  getProgressBarColor,
}) => {
  if (classProgress.subjects.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-4">No subjects assigned to this class</p>;
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-slate-700 mb-4">Subjects & Chapters</h4>
      
      {classProgress.subjects.map((subject) => {
        const isSubjectExpanded = expandedSubject === subject.subjectId;
        const cacheKey = `${classProgress.classId}-${subject.subjectId}`;
        const subjectChapters = chapterStatusesCache[cacheKey] || [];
        const isLoadingChapters = loadingChapters.has(cacheKey);
        
        return (
          <div key={subject.classSubjectId} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => onSubjectClick(classProgress.classId, subject.subjectId)}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  subject.progressPercentage >= 80 ? 'bg-emerald-100' :
                  subject.progressPercentage >= 50 ? 'bg-amber-100' : 'bg-slate-100'
                }`}>
                  <BookOpen className={`w-4 h-4 ${
                    subject.progressPercentage >= 80 ? 'text-emerald-600' :
                    subject.progressPercentage >= 50 ? 'text-amber-600' : 'text-slate-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{subject.subjectName}</p>
                  <p className="text-xs text-slate-500">
                    {subject.completedChapters}/{subject.totalChapters} chapters completed
                    {subject.inProgressChapters > 0 && ` • ${subject.inProgressChapters} in progress`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${getProgressBarColor(subject.progressPercentage)}`}
                    style={{ width: `${subject.progressPercentage}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-700 w-12 text-right">
                  {subject.progressPercentage}%
                </span>
                {isLoadingChapters ? (
                  <Loader className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSubjectExpanded ? 'rotate-90' : ''}`} />
                )}
              </div>
            </div>

            {isSubjectExpanded && (
              <div className="border-t border-slate-200 p-4 bg-white">
                {subjectChapters.length > 0 && (
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Bulk Actions:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBulkUpdateChapters(classProgress.classId, subject.subjectId, subjectChapters, 'pending');
                      }}
                      disabled={updatingChapter !== null}
                      className="text-xs h-7 px-2"
                    >
                      Mark All Pending
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBulkUpdateChapters(classProgress.classId, subject.subjectId, subjectChapters, 'in-progress');
                      }}
                      disabled={updatingChapter !== null}
                      className="text-xs h-7 px-2"
                    >
                      Mark All In Progress
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBulkUpdateChapters(classProgress.classId, subject.subjectId, subjectChapters, 'completed');
                      }}
                      disabled={updatingChapter !== null}
                      className="text-xs h-7 px-2 text-emerald-600"
                    >
                      Mark All Complete
                    </Button>
                  </div>
                )}
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {isLoadingChapters ? (
                    <div className="text-center py-4 text-slate-400">
                      <Loader className="w-5 h-5 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Loading chapters...</p>
                    </div>
                  ) : subjectChapters.length > 0 ? (
                    subjectChapters.map((chapter) => (
                      <div
                        key={chapter.chapterId}
                        className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(chapter.status)}`}
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(chapter.status)}
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              Ch. {chapter.sequenceNumber}: {chapter.chapterName}
                            </p>
                            {chapter.completedDate && (
                              <p className="text-xs text-slate-400">
                                Completed on {formatDate(chapter.completedDate)}
                              </p>
                            )}
                          </div>
                        </div>
                        <select
                          value={chapter.status || 'pending'}
                          onChange={(e) => {
                            onUpdateChapterStatus(
                              classProgress.classId,
                              subject.subjectId,
                              chapter.chapterId,
                              e.target.value as 'pending' | 'in-progress' | 'completed'
                            );
                          }}
                          disabled={updatingChapter !== null && updatingChapter !== chapter.chapterId}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border-0 cursor-pointer transition-colors ${getStatusSelectColor(chapter.status)} disabled:opacity-50`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No chapters available for this subject</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SyllabusTracking;
