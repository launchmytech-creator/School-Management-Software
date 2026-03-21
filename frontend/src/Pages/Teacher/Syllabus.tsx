import React, { useState, useEffect, useCallback } from 'react';
import TeacherLayout from '../../layouts/TeacherLayout';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { teacherService } from '../../services/teacherService';
import { syllabusService } from '../../services/syllabusService';
import { type TeacherAllocation } from '../../types/teacher';
import { BookOpen, CheckCircle, Clock, BookMarked, Users } from 'lucide-react';

interface TeacherSubjectProgress {
  allocationId: number;
  classId: number;
  className: string;
  classSection?: string;
  subjectId: number;
  subjectName: string;
  classSubjectId: number;
  totalChapters: number;
  completedChapters: number;
  inProgressChapters: number;
  pendingChapters: number;
  progressPercentage: number;
}

const TeacherSyllabus: React.FC = () => {
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState<TeacherAllocation[]>([]);
  const [subjectProgress, setSubjectProgress] = useState<TeacherSubjectProgress[]>([]);
  const [expandedAllocation, setExpandedAllocation] = useState<number | null>(null);

  const fetchAllocations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await teacherService.getAllocationsByTeacher(user?.id as number);
      setAllocations(data);
    } catch {
      showNotification('Failed to fetch your allocations', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, showNotification]);

  const fetchSubjectProgress = useCallback(async () => {
    if (allocations.length === 0) return;

    try {
      const progressPromises = allocations.map(async (allocation) => {
        try {
          const progress = await syllabusService.getClassSubjectProgress(allocation.id);
          return {
            allocationId: allocation.id,
            classId: allocation.classId,
            className: allocation.className,
            classSection: allocation.classSection,
            subjectId: allocation.subjectId,
            subjectName: allocation.subjectName,
            classSubjectId: allocation.id,
            totalChapters: progress.totalChapters,
            completedChapters: progress.completedChapters,
            inProgressChapters: 0,
            pendingChapters: progress.totalChapters - progress.completedChapters,
            progressPercentage: progress.progressPercentage,
          } as TeacherSubjectProgress;
        } catch {
          return null;
        }
      });

      const results = await Promise.all(progressPromises);
      const validProgress = results.filter((p): p is TeacherSubjectProgress => p !== null);
      setSubjectProgress(validProgress);
    } catch {
      showNotification('Failed to fetch syllabus progress', 'error');
    }
  }, [allocations]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  useEffect(() => {
    if (allocations.length > 0) {
      fetchSubjectProgress();
    }
  }, [allocations, fetchSubjectProgress]);

  const handleAllocationClick = (allocationId: number) => {
    setExpandedAllocation(expandedAllocation === allocationId ? null : allocationId);
  };

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

  const overallStats = {
    totalSubjects: subjectProgress.length,
    totalChapters: subjectProgress.reduce((sum, p) => sum + p.totalChapters, 0),
    completedChapters: subjectProgress.reduce((sum, p) => sum + p.completedChapters, 0),
    overallPercentage: 0,
  };

  overallStats.overallPercentage = overallStats.totalChapters > 0
    ? Math.round((overallStats.completedChapters / overallStats.totalChapters) * 100)
    : 0;

  type ClassGroup = { classId: number; className: string; classSection?: string; allocations: TeacherAllocation[] };
  
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

  if (loading) {
    return (
      <TeacherLayout title="Syllabus Progress">
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-slate-400">Loading syllabus data...</div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="Syllabus Progress">
      <div className="space-y-6 pb-12">
        <PageHeader 
          title="My Syllabus Progress"
          subtitle="Track syllabus completion for your assigned classes and subjects"
          breadcrumb={{
            links: [
              { label: "Dashboard", href: "/teacher/dashboard" },
              { label: "Syllabus", active: true }
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
                    onClick={() => handleAllocationClick(classGroup.classId)}
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

                  {expandedAllocation === classGroup.classId && (
                    <div className="border-t border-slate-200 bg-slate-50 p-5">
                      <div className="space-y-3">
                        {classGroup.allocations.map((allocation) => {
                          const progress = subjectProgress.find(p => p.allocationId === allocation.id);
                          const percentage = progress?.progressPercentage || 0;

                          return (
                            <div key={allocation.id} className="bg-white rounded-lg p-4 border border-slate-200">
                              <div className="flex items-center justify-between">
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
                                </div>
                              </div>
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
    </TeacherLayout>
  );
};

export default TeacherSyllabus;
