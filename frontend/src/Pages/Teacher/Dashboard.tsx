import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '../../components/common/DashboardCard';
import { useAuth } from '../../context/AuthContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useTeacherDashboard } from '../../hooks/queries';
import { School, Group, TrendingUp, BookMarked } from 'lucide-react';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const { selectedYear } = useAcademicYear();
  const navigate = useNavigate();

  const teacherId = user?.id as number;
  const { data, isLoading } = useTeacherDashboard(teacherId);

  const allocations = data?.allocations ?? [];
  const syllabusStats = data?.syllabusStats ?? {
    overallPercentage: 0,
    completedChapters: 0,
    totalChapters: 0,
  };

  const uniqueClasses = [...new Map(allocations.map(a => [a.classId, a])).values()];

  return (
      <div className="space-y-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <DashboardCard
            label="Classes Assigned"
            value={isLoading ? '-' : uniqueClasses.length}
            icon={School}
            iconBgColor="bg-blue-50"
            iconColor="text-blue-600"
          />

          <DashboardCard
            label="Subject Allocations"
            value={isLoading ? '-' : allocations.length}
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
            value={isLoading ? '-' : `${syllabusStats.overallPercentage}%`}
            icon={BookMarked}
            iconBgColor="bg-emerald-500"
            iconColor="text-white"
            onClick={() => navigate('/teacher/syllabus')}
          >
            {!isLoading && syllabusStats.totalChapters > 0 && (
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

          {isLoading ? (
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
  );
};

export default TeacherDashboard;
