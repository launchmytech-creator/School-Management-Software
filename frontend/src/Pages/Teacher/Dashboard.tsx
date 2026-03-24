import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../../layouts/TeacherLayout';
import DashboardCard from '../../components/common/DashboardCard';
import { useAuth } from '../../context/AuthContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useNotification } from '../../context/NotificationContext';
import { teacherService } from '../../services/teacherService';
import { syllabusService } from '../../services/syllabusService';
import { type TeacherAllocation } from '../../types/teacher';
import { School, Group, TrendingUp, BookMarked } from 'lucide-react';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const { selectedYear } = useAcademicYear();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  
  const [allocations, setAllocations] = useState<TeacherAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [syllabusLoading, setSyllabusLoading] = useState(true);
  const [syllabusStats, setSyllabusStats] = useState({
    overallPercentage: 0,
    completedChapters: 0,
    totalChapters: 0,
  });

  const teacherId = user?.id as number;

  const fetchAllocations = useCallback(async () => {
    if (!teacherId || !selectedYear?.id) return;
    try {
      setLoading(true);
      const data = await teacherService.getAllocationsByTeacher(teacherId, Number(selectedYear.id));
      setAllocations(data);
    } catch {
      showNotification('Failed to fetch your classes', 'error');
    } finally {
      setLoading(false);
    }
  }, [teacherId, selectedYear, showNotification]);

  const fetchSyllabusProgress = useCallback(async () => {
    if (!teacherId || !selectedYear?.id || allocations.length === 0) {
      setSyllabusLoading(false);
      return;
    }
    try {
      setSyllabusLoading(true);
      let totalChapters = 0;
      let completedChapters = 0;

      const progressPromises = allocations.slice(0, 5).map(async (allocation) => {
        try {
          const progress = await syllabusService.getClassSubjectProgress(allocation.id);
          return { completed: progress.completedChapters, total: progress.totalChapters };
        } catch {
          return { completed: 0, total: 0 };
        }
      });

      const results = await Promise.all(progressPromises);
      results.forEach(r => {
        totalChapters += r.total;
        completedChapters += r.completed;
      });

      setSyllabusStats({
        overallPercentage: totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0,
        completedChapters,
        totalChapters,
      });
    } catch {
      setSyllabusStats({
        overallPercentage: 0,
        completedChapters: 0,
        totalChapters: 0,
      });
    } finally {
      setSyllabusLoading(false);
    }
  }, [teacherId, selectedYear, allocations]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  useEffect(() => {
    if (allocations.length > 0) {
      fetchSyllabusProgress();
    } else {
      setSyllabusLoading(false);
    }
  }, [fetchSyllabusProgress, allocations.length]);

  const uniqueClasses = [...new Map(allocations.map(a => [a.classId, a])).values()];

  return (
    <TeacherLayout title="Teacher Hub">
      <div className="space-y-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <DashboardCard
            label="Classes Assigned"
            value={loading ? '-' : uniqueClasses.length}
            icon={School}
            iconBgColor="bg-blue-50"
            iconColor="text-blue-600"
          />

          <DashboardCard
            label="Subject Allocations"
            value={loading ? '-' : allocations.length}
            icon={Group}
            iconBgColor="bg-emerald-50"
            iconColor="text-emerald-600"
          />

          <DashboardCard
            label="Current Academic Year"
            value={selectedYear?.name || '-'}
            icon={TrendingUp}
            iconBgColor="bg-purple-50"
            iconColor="text-purple-600"
          />

          <DashboardCard
            label="Syllabus Progress"
            value={syllabusLoading ? '-' : `${syllabusStats.overallPercentage}%`}
            icon={BookMarked}
            iconBgColor="bg-emerald-500"
            iconColor="text-white"
            onClick={() => navigate('/teacher/syllabus')}
          >
            {!syllabusLoading && syllabusStats.totalChapters > 0 && (
              <p className="text-xs text-emerald-200 mt-1">
                {syllabusStats.completedChapters}/{syllabusStats.totalChapters} chapters
              </p>
            )}
          </DashboardCard>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">My Classes</h3>
            <p className="text-sm text-slate-500">Classes and subjects you teach</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : allocations.length > 0 ? (
            <div className="space-y-3">
              {allocations.map((allocation) => (
                <div
                  key={allocation.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <School className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {allocation.className} - Section {allocation.classSection || 'A'}
                      </p>
                      <p className="text-sm text-slate-500">{allocation.subjectName}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-white rounded-lg text-xs font-semibold text-slate-600 border border-slate-200">
                    {allocation.yearName}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <School className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No classes assigned yet</p>
              <p className="text-sm text-slate-400">Contact your administrator to assign classes</p>
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
};

export default TeacherDashboard;
