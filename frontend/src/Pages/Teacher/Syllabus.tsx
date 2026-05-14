import React, { useState, useCallback, useMemo } from 'react';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { SyllabusStatsCards } from '../../components/teacher/SyllabusStatsCards';
import { ClassSyllabusCard } from '../../components/teacher/ClassSyllabusCard';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useTeacherAllocations } from '../../hooks/queries/useTeachers';
import { useUpdateChapterStatus } from '../../hooks/mutations/useSubjectMutations';
import { type TeacherAllocation } from '../../types/teacher';
import { type ChapterWithStatus } from '../../services/syllabusService';
import { BookMarked } from 'lucide-react';

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

        <SyllabusStatsCards stats={overallStats} />

        {allocations.length === 0 ? (
          <EmptyState
            icon={BookMarked}
            title="No subjects assigned"
            description="You haven't been assigned to any class and subject yet. Contact your school admin."
          />
        ) : (
          <div className="space-y-4">
            {Object.values(groupedByClass).map((classGroup) => (
              <ClassSyllabusCard
                key={`${classGroup.classId}-${classGroup.className}`}
                classGroup={classGroup}
                subjectProgress={subjectProgress}
                chapterProgress={chapterProgress}
                chapterLoading={chapterLoading}
                expandedClass={expandedClass}
                expandedSubject={expandedSubject}
                updatingChapter={updatingChapter}
                isEditable={isEditable}
                onToggleClass={toggleClass}
                onToggleSubject={toggleSubject}
                onMarkAllComplete={markAllComplete}
                onChapterStatusChange={updateChapterStatus}
              />
            ))}
          </div>
        )}
      </div>
  );
};

export default TeacherSyllabus;
