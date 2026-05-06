import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, GraduationCap, Download } from 'lucide-react';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useClasses } from '../../hooks/queries/useClasses';
import { useSubjectsByClass } from '../../hooks/queries/useSubjects';
import { useExamResults } from '../../hooks/queries/useExamResults';
import { useNotification } from '../../context/NotificationContext';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import Pagination from '../../components/common/Pagination';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { ExamResultsStats } from '../../components/common/ExamResultsStats';
import { SubjectResultCard } from '../../components/common/SubjectResultCard';
import { EXAM_TYPES } from '../../lib/subject-utils';
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

  const {
    data: results,
    isLoading,
    pagination,
    page,
    setPage,
    searchTerm,
    setSearchTerm,
  } = useExamResults({
    classId: classId ? parseInt(classId) : undefined,
    subjectId: subjectId ? parseInt(subjectId) : undefined,
    academicYearId: selectedYear?.id ? parseInt(selectedYear.id) : undefined,
  });

  const filteredResults = useMemo(() => {
    if (!selectedExamType || selectedExamType === 'All') return results;
    return results.filter((r) => r.examType === selectedExamType);
  }, [results, selectedExamType]);

  const resultsBySubject = useMemo(() => {
    const grouped: Record<string, ExamResult[]> = {};
    filteredResults.forEach((result) => {
      const key = `${result.className}${result.classSection ? ` - ${result.classSection}` : ''} - ${result.subjectName}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(result);
    });
    Object.values(grouped).forEach((students) => {
      students.sort((a, b) => (a.rollNumber || 999) - (b.rollNumber || 999));
    });
    return grouped;
  }, [filteredResults]);

  const stats = useMemo(() => {
    const total = filteredResults.length;
    const passed = filteredResults.filter((r) => !r.isAbsent && r.marksObtained >= r.maxMarks * 0.4).length;
    const failed = filteredResults.filter((r) => !r.isAbsent && r.marksObtained < r.maxMarks * 0.4).length;
    const passPercentage = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';
    return { total, passed, failed, passPercentage };
  }, [filteredResults]);

  const getSubjectStats = (subjectResults: ExamResult[]) => {
    const evaluated = subjectResults.filter((r) => !r.isAbsent && r.marksObtained > 0).length;
    const absent = subjectResults.filter((r) => r.isAbsent).length;
    const avgMarks =
      evaluated > 0
        ? subjectResults.filter((r) => !r.isAbsent).reduce((sum, r) => sum + r.marksObtained, 0) / evaluated
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

  if (!classData || !subjectData) {
    return (
      <EmptyState
        icon={Search}
        title="Subject not found"
        action={{ label: 'Go Back', onClick: () => navigate(`${basePath}/exam-results/class/${classId}`) }}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`${subjectData.subjectName} - ${classData.name}`}
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
            { label: subjectData.subjectName, active: true },
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
        onSearchChange={setSearchTerm}
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

      {filteredResults.length > 0 ? (
        <>
          <div className="space-y-4">
            {Object.entries(resultsBySubject).map(([groupKey, subjectResults]) => {
              const subjectStats = getSubjectStats(subjectResults);

              return (
                <SubjectResultCard
                  key={groupKey}
                  subjectResults={subjectResults}
                  subjectStats={subjectStats}
                  isExpanded={true}
                  onToggle={() => {}}
                />
              );
            })}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              onPageChange={setPage}
            />
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
