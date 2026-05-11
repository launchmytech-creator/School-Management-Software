import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, GraduationCap, Download, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useClasses } from '../../hooks/queries/useClasses';
import { useSubjectsByClass } from '../../hooks/queries/useSubjects';
import { useNotification } from '../../context/NotificationContext';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { ExamResultsStats } from '../../components/common/ExamResultsStats';
import { SubjectResultCard } from '../../components/common/SubjectResultCard';
import { EXAM_TYPES } from '../../lib/subject-utils';
import { examResultService } from '../../services/examResultService';
import type { ExamResult } from '../../services/examResultService';

interface SubjectResultsPageProps {
  layout: 'admin' | 'accountant';
}

const SubjectResultsPage: React.FC<SubjectResultsPageProps> = ({ layout }) => {
  const { classId, subjectId } = useParams<{ classId: string; subjectId: string }>();
  const navigate = useNavigate();
  const { selectedYear } = useAcademicYear();
  const { showNotification } = useNotification();

  const { data: allClasses = [] } = useClasses(selectedYear?.id);
  const classData = allClasses.find((c) => String(c.id) === classId);

  const { data: classSubjects = [] } = useSubjectsByClass(classId ? parseInt(classId) : 0);
  const subjectData = classSubjects.find((s) => String(s.subjectId) === subjectId);

  const [selectedExamType, setSelectedExamType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error: resultsError } = useQuery({
    queryKey: ['class-results', classId, subjectId, selectedYear?.id, selectedExamType, searchTerm, page],
    queryFn: () => examResultService.getClassResults(parseInt(classId!), {
      subjectId: parseInt(subjectId!),
      academicYearId: parseInt(selectedYear?.id!),
      examType: selectedExamType || undefined,
      search: searchTerm || undefined,
      page,
      limit: 20,
    }),
    enabled: !!classId && !!subjectId && !!selectedYear?.id,
  });

  const results = data?.data ?? [];
  const pagination = data?.pagination ?? null;

  const stats = useMemo(() => {
    const total = results.length;
    const appeared = results.filter((r) => !r.isAbsent);
    const passed = appeared.filter((r) => r.maxMarks > 0 && r.marksObtained >= r.maxMarks * 0.4).length;
    const failed = appeared.filter((r) => r.maxMarks > 0 && r.marksObtained < r.maxMarks * 0.4).length;
    const passPercentage = appeared.length > 0 ? ((passed / appeared.length) * 100).toFixed(1) : '0';
    return { total, passed, failed, passPercentage };
  }, [results]);

  const getSubjectStats = (subjectResults: ExamResult[]) => {
    const evaluated = subjectResults.filter((r) => !r.isAbsent && r.marksObtained > 0).length;
    const absent = subjectResults.filter((r) => r.isAbsent).length;
    const appeared = subjectResults.filter((r) => !r.isAbsent && r.marksObtained > 0);
    const avgMarks = evaluated > 0
      ? appeared.reduce((sum, r) => sum + (r.marksObtained || 0), 0) / evaluated
      : 0;
    return { evaluated, absent, total: subjectResults.length, avgMarks };
  };

  const basePath = layout === 'admin' ? '/admin' : '/accountant';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading subject results..." />
      </div>
    );
  }

  if (resultsError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Failed to load results"
        description="There was an error loading subject results. Please try again."
        action={{ label: 'Go Back', onClick: () => navigate(`${basePath}/exam-results/class/${classId}`) }}
      />
    );
  }

  if (!classData) {
    return (
      <EmptyState
        icon={Search}
        title="Class not found"
        action={{ label: 'Go Back', onClick: () => navigate(`${basePath}/exam-results`) }}
      />
    );
  }

  const subjectTitle = subjectData?.subjectName || `Subject #${subjectId}`;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`${subjectTitle} - ${classData.name}`}
        subtitle={
          classData.section
            ? `Section ${classData.section} • ${selectedYear?.name || ''}`
            : selectedYear?.name || ''
        }
        breadcrumb={{
          links: [
            { label: 'Exams', href: `${basePath}/exam-results` },
            {
              label: classData.name,
              href: `${basePath}/exam-results/class/${classId}`,
            },
            { label: subjectTitle, active: true },
          ],
        }}
        actions={[
          {
            label: 'Export',
            icon: Download,
            onClick: () => showNotification('Export feature coming soon', 'info'),
            variant: 'outline',
          },
        ]}
      />

      <ExamResultsStats
        total={stats.total}
        passed={stats.passed}
        failed={stats.failed}
        passPercentage={stats.passPercentage}
      />

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          setPage(1);
        }}
        onReset={() => {
          setSearchTerm('');
          setSelectedExamType('');
          setPage(1);
        }}
        searchPlaceholder="Search by student name or admission number..."
      >
        <select
          value={selectedExamType}
          onChange={(e) => {
            setSelectedExamType(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 min-w-48"
        >
          {EXAM_TYPES.map((type) => (
            <option key={type} value={type === 'All' ? '' : type}>
              {type}
            </option>
          ))}
        </select>
      </FilterBar>

      {results.length > 0 ? (
        <>
          <div className="space-y-4">
            <SubjectResultCard
              subjectResults={results}
              subjectStats={getSubjectStats(results)}
              isExpanded={true}
              onToggle={() => {}}
            />
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium disabled:opacity-50 hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm font-medium">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium disabled:opacity-50 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="No results found"
          description={
            searchTerm || selectedExamType
              ? 'Try adjusting your filters'
              : 'No exam results recorded for this subject'
          }
        />
      )}
    </div>
  );
};

export default SubjectResultsPage;
