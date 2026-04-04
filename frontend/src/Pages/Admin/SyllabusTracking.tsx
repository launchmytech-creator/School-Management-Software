import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { useClasses, useSubjectsByClass } from '../../hooks/queries';
import { subjectService, type Chapter, type ClassSubject } from '../../services/subjectService';
import { syllabusService, type ChapterWithStatus, type AllClassesProgress, type ClassProgress } from '../../services/syllabusService';
import type { Class } from '../../types/class';
import { BookOpen, CheckCircle, Clock, AlertCircle, BookMarked, LayoutGrid, ListChecks, ChevronRight, Users } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/button';

type TabType = 'class-overview' | 'subject-detail';

const EMPTY_CLASSES: Class[] = [];
const EMPTY_CLASS_SUBJECTS: ClassSubject[] = [];

const SyllabusTracking: React.FC = () => {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<TabType>('class-overview');
  const [loading, setLoading] = useState(true);
  const [classesProgress, setClassesProgress] = useState<ClassProgress[]>([]);
  const [schoolOverallPercentage, setSchoolOverallPercentage] = useState(0);
  const [expandedClass, setExpandedClass] = useState<number | null>(null);

  const { data: classesData } = useClasses();
  const classes = classesData || EMPTY_CLASSES;
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const { data: classSubjectsData } = useSubjectsByClass(selectedClass);
  const classSubjects = classSubjectsData || EMPTY_CLASS_SUBJECTS;
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterStatuses, setChapterStatuses] = useState<Record<number, ChapterWithStatus | null>>({});
  const [updating, setUpdating] = useState(false);
  const [subjectLoading, setSubjectLoading] = useState(false);

  const fetchAllClassesProgress = useCallback(async () => {
    try {
      setLoading(true);
      const data: AllClassesProgress = await syllabusService.getAllClassesProgress();
      setClassesProgress(data.classes);
      setSchoolOverallPercentage(data.schoolOverallPercentage);
    } catch {
      showNotification('Failed to fetch class progress', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (activeTab === 'class-overview') {
      fetchAllClassesProgress();
    }
  }, [activeTab, fetchAllClassesProgress]);



  useEffect(() => {
    const fetchChapters = async () => {
      if (!selectedSubject) {
        setChapters([]);
        setChapterStatuses({});
        setSubjectLoading(false);
        return;
      }
      try {
        setSubjectLoading(true);
        const subjectChapters = await subjectService.getChaptersBySubject(parseInt(selectedSubject));
        setChapters(subjectChapters);

        const classSubject = classSubjects.find(cs => cs.subjectId === parseInt(selectedSubject));
        if (classSubject) {
          try {
            const statuses = await syllabusService.getChaptersWithStatus(classSubject.id, parseInt(selectedSubject));
            const statusMap: Record<number, ChapterWithStatus | null> = {};
            subjectChapters.forEach(chapter => {
              const status = statuses.find(s => s.chapterId === chapter.id);
              statusMap[chapter.id] = status || null;
            });
            setChapterStatuses(statusMap);
          } catch {
            const emptyStatus: Record<number, ChapterWithStatus | null> = {};
            subjectChapters.forEach(chapter => {
              emptyStatus[chapter.id] = null;
            });
            setChapterStatuses(emptyStatus);
          }
        }
      } catch {
        showNotification('Failed to fetch chapters', 'error');
      } finally {
        setSubjectLoading(false);
      }
    };
    fetchChapters();
  }, [selectedSubject, classSubjects, showNotification]);

  const selectedClassSubject = classSubjects.find(cs => cs.subjectId === parseInt(selectedSubject));

  const stats = {
    total: chapters.length,
    completed: chapters.filter(ch => chapterStatuses[ch.id]?.status === 'completed').length,
    inProgress: chapters.filter(ch => chapterStatuses[ch.id]?.status === 'in-progress').length,
    pending: chapters.filter(ch => !chapterStatuses[ch.id] || chapterStatuses[ch.id]?.status === 'pending').length,
  };

  const progressPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const updateChapterStatus = async (chapterId: number, status: 'completed' | 'in-progress' | 'pending') => {
    if (!selectedClassSubject) return;

    try {
      setUpdating(true);
      await syllabusService.markCompletion({
        classSubjectId: selectedClassSubject.id,
        chapterId,
        status,
      });
      showNotification(`Chapter marked as ${status.replace('_', ' ')}`, 'success');

      const updatedStatuses = await syllabusService.getChaptersWithStatus(selectedClassSubject.id, parseInt(selectedSubject));
      const statusMap: Record<number, ChapterWithStatus | null> = {};
      chapters.forEach(chapter => {
        const statusData = updatedStatuses.find(s => s.chapterId === chapter.id);
        statusMap[chapter.id] = statusData || null;
      });
      setChapterStatuses(statusMap);
    } catch {
      showNotification('Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status: string | null | undefined) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
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

  const getStatusTextColor = (status: string | null | undefined) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-600';
      case 'in-progress':
        return 'text-amber-600';
      default:
        return 'text-slate-500';
    }
  };

  const getStatusLabel = (status: string | null | undefined) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      default:
        return 'Pending';
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

  const handleClassClick = (classId: number) => {
    setExpandedClass(expandedClass === classId ? null : classId);
  };

  const handleViewSubjects = (classProgress: ClassProgress) => {
    setSelectedClass(String(classProgress.classId));
    setActiveTab('subject-detail');
    setSelectedSubject('');
  };

  const renderClassOverview = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{classesProgress.length}</p>
              <p className="text-sm text-blue-100">Total Classes</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{schoolOverallPercentage}%</p>
              <p className="text-sm text-purple-100">School Overall</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <BookMarked className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{classesProgress.reduce((sum, c) => sum + c.totalChapters, 0)}</p>
              <p className="text-sm text-emerald-100">Total Chapters</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex items-center justify-center">
          <div className="animate-pulse text-slate-400">Loading class progress...</div>
        </div>
      ) : classesProgress.length > 0 ? (
        <div className="space-y-4">
          {classesProgress.map((classProgress) => (
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
                    <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedClass === classProgress.classId ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              </div>

              {expandedClass === classProgress.classId && (
                <div className="border-t border-slate-200 bg-slate-50 p-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-slate-700">Subject-wise Progress</h4>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewSubjects(classProgress)}
                      >
                        View Details & Update
                      </Button>
                    </div>
                    {classProgress.subjects.length > 0 ? (
                      classProgress.subjects.map((subject) => (
                        <div key={subject.classSubjectId} className="bg-white rounded-lg p-4 border border-slate-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                subject.progressPercentage >= 80 ? 'bg-emerald-100' :
                                subject.progressPercentage >= 50 ? 'bg-amber-100' : 'bg-slate-100'
                              }`}>
                                <BookOpen className={`w-4 h-4 ${
                                  subject.progressPercentage >= 80 ? 'text-emerald-600' :
                                  subject.progressPercentage >= 50 ? 'text-amber-600' : 'text-slate-500'
                                }`} />
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{subject.subjectName}</p>
                                <p className="text-xs text-slate-500">
                                  {subject.completedChapters}/{subject.totalChapters} chapters
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
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-4">No subjects assigned to this class</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookMarked}
          title="No classes found"
          description="No classes have been set up yet"
        />
      )}
    </>
  );

  const renderSubjectDetail = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-500">Total Chapters</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <BookOpen className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-emerald-700">{stats.completed}</p>
              <p className="text-sm text-emerald-600">Completed</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-amber-700">{stats.inProgress}</p>
              <p className="text-sm text-amber-600">In Progress</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-slate-700">{stats.pending}</p>
              <p className="text-sm text-slate-500">Pending</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl">
              <AlertCircle className="w-5 h-5 text-slate-500" />
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-purple-700">{progressPercentage}%</p>
              <p className="text-sm text-purple-600">Progress</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <BookMarked className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Select Class</label>
          <select
            value={selectedClass}
            onChange={(e) => { setSelectedClass(e.target.value); setSelectedSubject(''); }}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Class</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name} - Section {cls.section || 'A'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Select Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!selectedClass}
          >
            <option value="">Select Subject</option>
            {classSubjects.map(cs => (
              <option key={cs.id} value={cs.subjectId}>
                {cs.subjectName}
              </option>
            ))}
          </select>
        </div>

        {selectedSubject && (
          <div className="flex items-end">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-slate-700">Progress:</span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-emerald-600">{progressPercentage}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedSubject ? (
        subjectLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 flex items-center justify-center">
            <div className="animate-pulse text-slate-400">Loading chapters...</div>
          </div>
        ) : chapters.length > 0 ? (
          <div className="space-y-3">
            {chapters.map((chapter) => {
              const status = chapterStatuses[chapter.id];
              return (
                <div
                  key={chapter.id}
                  className={`bg-white rounded-xl border p-5 ${getStatusColor(status?.status)} transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        status?.status === 'completed' ? 'bg-emerald-100' :
                        status?.status === 'in-progress' ? 'bg-amber-100' : 'bg-slate-100'
                      }`}>
                        <span className="text-sm font-bold text-slate-600">{chapter.sequenceNumber}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{chapter.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(status?.status)}
                          <span className={`text-sm font-medium ${getStatusTextColor(status?.status)}`}>
                            {getStatusLabel(status?.status)}
                          </span>
                          {status?.completedDate && (
                            <span className="text-xs text-slate-400">
                              • {formatDate(status.completedDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateChapterStatus(chapter.id, 'pending')}
                        disabled={updating || !selectedClassSubject}
                        className={`${status?.status === 'pending' ? 'bg-slate-200' : ''}`}
                      >
                        Pending
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateChapterStatus(chapter.id, 'in-progress')}
                        disabled={updating || !selectedClassSubject}
                        className={`${status?.status === 'in-progress' ? 'bg-amber-200' : ''}`}
                      >
                        In Progress
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateChapterStatus(chapter.id, 'completed')}
                        disabled={updating || !selectedClassSubject}
                        className={`${status?.status === 'completed' ? 'bg-emerald-200' : ''}`}
                      >
                        Completed
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No chapters found"
            description="This subject doesn't have any chapters yet"
          />
        )
      ) : (
        <EmptyState
          icon={BookMarked}
          title="Select class and subject"
          description="Choose a class and subject to view syllabus progress"
        />
      )}
    </>
  );

  return (
    <AdminLayout title="Syllabus Tracking">
      <div className="space-y-6 pb-12">
        <PageHeader 
          title="Syllabus Tracking"
          subtitle="Track and manage syllabus completion progress"
          breadcrumb={{
            links: [
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Syllabus", active: true }
            ]
          }}
        />

        <div className="flex items-center gap-4 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('class-overview')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
              activeTab === 'class-overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Class Overview
          </button>
          <button
            onClick={() => setActiveTab('subject-detail')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
              activeTab === 'subject-detail'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            Subject Detail
          </button>
        </div>

        {activeTab === 'class-overview' ? renderClassOverview() : renderSubjectDetail()}
      </div>
    </AdminLayout>
  );
};

export default SyllabusTracking;
