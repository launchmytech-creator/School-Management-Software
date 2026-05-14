import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, GraduationCap, Download, ChevronRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useClasses } from '../../hooks/queries/useClasses';
import { useNotification } from '../../context/NotificationContext';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { subjectIcon } from '../../lib/subject-utils';
import { examResultService } from '../../services/examResultService';
import { examService } from '../../services/examService';

interface ExamResultsPageProps {
  layout: 'admin' | 'accountant';
}

const ExamResultsPage: React.FC<ExamResultsPageProps> = ({ layout }) => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedYear } = useAcademicYear();
  const { showNotification } = useNotification();

  const examId = searchParams.get('examId') || '';

  const { data: allClasses = [] } = useClasses(selectedYear?.id);
  const classData = allClasses.find((c) => String(c.id) === classId);

  const { data: examData } = useQuery({
    queryKey: ['exam', examId],
    queryFn: () => examService.getById(parseInt(examId)),
    enabled: !!examId,
  });

  const [searchTerm, setSearchTerm] = useState('');

  const { data: subjects = [], isLoading, error } = useQuery({
    queryKey: ['class-subjects', classId, selectedYear?.id],
    queryFn: () => examResultService.getClassSubjects(
      parseInt(classId!),
      parseInt(selectedYear?.id!),
    ),
    enabled: !!classId && !!selectedYear?.id,
  });

  const filteredSubjects = useMemo(() => {
    if (!searchTerm) return subjects;
    const term = searchTerm.toLowerCase();
    return subjects.filter(s =>
      s.subjectName.toLowerCase().includes(term) ||
      s.subjectCode.toLowerCase().includes(term)
    );
  }, [subjects, searchTerm]);

  const basePath = layout === 'admin' ? '/admin' : '/accountant';

  if (!examId) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Select an Exam"
          subtitle={`View results for ${classData?.name || 'Class'}`}
          breadcrumb={{
            links: [
              { label: 'Exams', href: `${basePath}/exams` },
              { label: classData?.name || '', active: true },
            ],
          }}
        />
        <EmptyState
          icon={GraduationCap}
          title="No exam selected"
          description="Please select an exam from the Examinations page to view results."
          action={{
            label: 'Go to Examinations',
            onClick: () => navigate(`${basePath}/exams`)
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading exam results..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Error Loading Results"
          subtitle={`${classData?.name || ''}`}
          breadcrumb={{
            links: [
              { label: 'Exams', href: `${basePath}/exams` },
              { label: 'Results', active: true },
            ],
          }}
        />
        <EmptyState
          icon={AlertCircle}
          title="Failed to load results"
          description="There was an error loading exam results. Please try again."
          action={{ label: 'Go Back', onClick: () => navigate(`${basePath}/exams`) }}
        />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Class Not Found"
          breadcrumb={{
            links: [
              { label: 'Exams', href: `${basePath}/exams` },
              { label: 'Error', active: true },
            ],
          }}
        />
        <EmptyState
          icon={Search}
          title="Class not found"
          description="The class you are looking for does not exist."
          action={{ label: 'Go Back', onClick: () => navigate(`${basePath}/exams`) }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={examData?.name || 'Exam Results'}
        subtitle={
          classData.section
            ? `${classData.name} - Section ${classData.section} • ${examData?.examType || ''}`
            : `${classData.name} • ${examData?.examType || ''}`
        }
        breadcrumb={{
          links: [
            { label: 'Exams', href: `${basePath}/exams` },
            { label: examData?.name || 'Results', active: true },
          ],
        }}
        actions={[
          {
            label: 'Back to Exams',
            icon: ChevronRight,
            onClick: () => navigate(`${basePath}/exams`),
            variant: 'outline',
          },
          {
            label: 'Export',
            icon: Download,
            onClick: () => showNotification('Export feature coming soon', 'info'),
            variant: 'outline',
          },
        ]}
      />

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onReset={() => {
          setSearchTerm('');
        }}
        searchPlaceholder="Search subjects..."
      />

      {filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((subject) => {
            const { icon: subjectIconName, bg: iconBg, text: iconText } = subjectIcon(subject.subjectName);
            const appeared = subject.evaluatedCount + subject.failedCount;
            const passRate = appeared > 0
              ? ((subject.passedCount / appeared) * 100).toFixed(0)
              : '0';

            return (
              <button
                key={subject.subjectId}
                onClick={() => {
                  navigate(`${basePath}/exam-results/class/${classId}/subject/${subject.subjectId}/exam/${examId}`);
                }}
                className="bg-white rounded-xl border border-slate-200 p-5 text-left hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${iconBg}`}>
                      <span className={`material-symbols-outlined text-lg ${iconText}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {subjectIconName}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{subject.subjectName}</h3>
                      <p className="text-xs text-slate-500">{subject.subjectCode} • {subject.totalStudents} students</p>
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Average Marks</span>
                    <span className="font-semibold text-slate-900">{subject.avgMarks.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Pass Rate</span>
                    <span className="font-semibold text-slate-900">{passRate}%</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                      <CheckCircle className="size-3" />
                      {subject.passedCount}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      <XCircle className="size-3" />
                      {subject.failedCount}
                    </span>
                    {subject.absentCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                        Absent {subject.absentCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="No results found"
          description="No exam results recorded for this class"
        />
      )}
    </div>
  );
};

export default ExamResultsPage;
