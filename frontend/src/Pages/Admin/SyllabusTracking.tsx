import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { useAllClassesProgress } from '../../hooks/queries/useSyllabus';
import { gradeRank } from '../../lib/utils';
import { BookMarked, ChevronRight } from 'lucide-react';
import { QueryErrorFallback } from '../../components/error';

const SyllabusTracking: React.FC = () => {
  const navigate = useNavigate();

  const { data: classesProgressData, isLoading: loadingProgress } = useAllClassesProgress();
  const classesProgress = [...(classesProgressData?.classes || [])].sort(
    (a, b) => gradeRank(a.className) - gradeRank(b.className) || (a.classSection || '').localeCompare(b.classSection || '')
  );

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
            <div className="animate-pulse text-slate-400">Loading classes...</div>
          </div>
        ) : classesProgress.length > 0 ? (
          <div className="space-y-4">
            {classesProgress.map((classProgress) => {
              return (
                <div
                  key={classProgress.classId}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/admin/syllabus-tracking/class/${classProgress.classId}`)}
                >
                  <div className="p-5">
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
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  </div>
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

export default SyllabusTracking;
