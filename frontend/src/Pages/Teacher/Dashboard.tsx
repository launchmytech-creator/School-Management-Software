import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useTeacherDashboard } from '../../hooks/queries';
import { announcementService } from '../../services/announcementService';
import { useQuery } from '@tanstack/react-query';
import { School, BookOpen, TrendingUp, Users, ArrowRight, Megaphone } from 'lucide-react';

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const { selectedYear } = useAcademicYear();
  const navigate = useNavigate();

  const teacherId = user?.id as number;
  const { data, isLoading } = useTeacherDashboard(teacherId);

  const { data: announcements } = useQuery({
    queryKey: ['announcements', 'recent'],
    queryFn: () => announcementService.getAnnouncements({ limit: 5 }),
    staleTime: 5 * 60 * 1000,
  });

  const allocations = data?.allocations ?? [];
  const syllabusStats = data?.syllabusStats ?? {
    overallPercentage: 0,
    completedChapters: 0,
    totalChapters: 0,
  };

  const uniqueClasses = useMemo(() => {
    const classMap = new Map<number, { classId: number; className: string; classSection: string; yearName: string }>();
    
    allocations.forEach(a => {
      if (!classMap.has(a.classId)) {
        classMap.set(a.classId, {
          classId: a.classId,
          className: a.className,
          classSection: a.classSection || 'A',
          yearName: a.yearName,
        });
      }
    });
    
    return Array.from(classMap.values());
  }, [allocations]);

  const teacherSubjects = useMemo(() => {
    return [...new Set(allocations.map(a => a.subjectName))];
  }, [allocations]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#4A9FD4] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Header - No Background */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Welcome back, {user?.fullName?.split(' ')[0] || 'Teacher'}!
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <span className="material-symbols-outlined text-[16px] text-[#4A9FD4]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
              Academic Year {selectedYear?.name || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-black text-slate-900">{uniqueClasses.length}</p>
              <p className="text-sm text-slate-500 mt-1">Classes Assigned</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <School className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-black text-slate-900">{teacherSubjects.length}</p>
              <p className="text-sm text-slate-500 mt-1">Subject Allocations</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <BookOpen className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/teacher/syllabus')}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/20 p-5 hover:shadow-emerald-500/30 transition-shadow text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-black text-white">{syllabusStats.overallPercentage}%</p>
              <p className="text-sm text-emerald-100 mt-1">Syllabus Progress</p>
              {syllabusStats.totalChapters > 0 && (
                <p className="text-xs text-emerald-200 mt-2">
                  {syllabusStats.completedChapters}/{syllabusStats.totalChapters} chapters completed
                </p>
              )}
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left Column - Classes & Quick Actions */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Classes Overview */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">My Classes Overview</h3>
                <p className="text-sm text-slate-500 mt-1">Quick overview of your assigned classes</p>
              </div>
              <button
                onClick={() => navigate('/teacher/students')}
                className="flex items-center gap-2 text-sm font-semibold text-[#4A9FD4] hover:underline"
              >
                View All Students
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {allocations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uniqueClasses.slice(0, 4).map((cls) => {
                  const classAllocations = allocations.filter(a => a.classId === cls.classId);
                  const subjects = [...new Set(classAllocations.map(a => a.subjectName))];
                  
                  return (
                    <button
                      key={cls.classId}
                      onClick={() => navigate('/teacher/students')}
                      className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors text-left border border-slate-100 hover:border-slate-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <School className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200">
                          {cls.yearName || selectedYear?.name}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">
                        {cls.className} - Section {cls.classSection}
                      </h4>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {subjects.slice(0, 2).map((subject, idx) => (
                          <span key={idx} className="text-xs bg-white px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                            {subject}
                          </span>
                        ))}
                        {subjects.length > 2 && (
                          <span className="text-xs text-slate-400">+{subjects.length - 2} more</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <School className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No classes assigned yet</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/teacher/students')}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">View My Students</h4>
                  <p className="text-sm text-slate-500 mt-1">Browse your students</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </button>

            <button
              onClick={() => navigate('/teacher/attendance')}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <span className="material-symbols-outlined text-emerald-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>how_to_reg</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">Mark Attendance</h4>
                  <p className="text-sm text-slate-500 mt-1">Record attendance</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </button>
          </div>
        </div>

        {/* Right Column - Announcements */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold text-slate-900">Recent Announcements</h3>
            </div>

            {!announcements || announcements.length === 0 ? (
              <div className="text-center py-8">
                <Megaphone className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No announcements</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.slice(0, 5).map((announcement) => (
                  <div
                    key={announcement.id}
                    className="border-l-4 border-amber-400 pl-4 py-2 hover:bg-slate-50 rounded-r transition-colors cursor-pointer"
                    onClick={() => navigate('/teacher/announcements')}
                  >
                    <h4 className="font-semibold text-slate-900 text-sm line-clamp-2">
                      {announcement.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {announcement.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {announcement.priority === 'high' && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                          URGENT
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {timeAgo(announcement.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => navigate('/teacher/announcements')}
                  className="w-full text-center text-sm font-semibold text-[#4A9FD4] hover:underline mt-2"
                >
                  View All Announcements
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
