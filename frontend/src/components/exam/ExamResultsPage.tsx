import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, GraduationCap, Download, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useClasses } from '../../hooks/queries/useClasses';
import { useSubjectsByClass } from '../../hooks/queries/useSubjects';
import { useExamResults } from '../../hooks/queries/useExamResults';
import { useNotification } from '../../context/NotificationContext';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { EXAM_TYPES, subjectIcon } from '../../lib/subject-utils';
import type { ExamResult } from '../../services/examResultService';

interface ExamResultsPageProps {
  layout: 'admin' | 'accountant';
}

const ExamResultsPage: React.FC<ExamResultsPageProps> = ({ layout }) => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { selectedYear } = useAcademicYear();
  const { showNotification } = useNotification();

  const { data: allClasses = [] } = useClasses(selectedYear?.id);
  const classData = allClasses.find((c) => String(c.id) === classId);

  const { data: classSubjects = [] } = useSubjectsByClass(classId ? parseInt(classId) : 0);

  const academicYearId = selectedYear?.id ? parseInt(selectedYear.id) : undefined;

  const [selectedExamType, setSelectedExamType] = useState<string>('');

  const {
    data: results,
    isLoading,
  } = useExamResults({
    classId: classId ? parseInt(classId) : undefined,
    academicYearId,
  });

  const subjectSummaries = useMemo(() => {
    const filtered = selectedExamType && selectedExamType !== 'All'
      ? results.filter((r) => r.examType === selectedExamType)
      : results;

    const grouped: Record<string, ExamResult[]> = {};
    filtered.forEach((result) => {
      const key = `${result.subjectName}|${result.subjectId ?? 0}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(result);
    });

    return Object.entries(grouped).map(([key, subjectResults]) => {
      const [subjectName, subjectIdStr] = key.split('|');
      const subjectId = parseInt(subjectIdStr) || 0;
      const firstResult = subjectResults[0];
      const evaluated = subjectResults.filter((r) => !r.isAbsent && r.marksObtained > 0).length;
      const absent = subjectResults.filter((r) => r.isAbsent).length;
      const passed = subjectResults.filter((r) => !r.isAbsent && r.marksObtained >= r.maxMarks * 0.4).length;
      const failed = subjectResults.filter((r) => !r.isAbsent && r.marksObtained < r.maxMarks * 0.4).length;
      const avgMarks = evaluated > 0
        ? subjectResults.filter((r) => !r.isAbsent).reduce((sum, r) => sum + r.marksObtained, 0) / evaluated
        : 0;

      return {
        subjectId,
        subjectName,
        className: firstResult?.className || '',
        classSection: firstResult?.classSection || null,
        totalRecords: subjectResults.length,
        evaluated,
        absent,
        passed,
        failed,
        avgMarks,
      };
    });
  }, [results, selectedExamType]);

  const basePath = layout === 'admin' ? '/admin' : '/accountant';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading exam results..." />
      </div>
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

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`Exam Results - ${classData.name}`}
        subtitle={
          classData.section
            ? `Section ${classData.section} • ${selectedYear?.name || ''}`
            : selectedYear?.name || ''
        }
        breadcrumb={{
          links: [
            { label: 'Exams', href: `${basePath}/exam-results` },
            { label: 'Exam Results', active: true },
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

      <FilterBar
        searchTerm=""
        onSearchChange={() => {}}
        onReset={() => setSelectedExamType('')}
        searchPlaceholder="Search subjects..."
      >
        <select
          value={selectedExamType}
          onChange={(e) => setSelectedExamType(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 min-w-48"
        >
          {EXAM_TYPES.map((type) => (
            <option key={type} value={type === 'All' ? '' : type}>
              {type}
            </option>
          ))}
        </select>
      </FilterBar>

      {subjectSummaries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjectSummaries.map((summary) => {
            const { icon: subjectIconName, bg: iconBg, text: iconText } = subjectIcon(summary.subjectName);
            const passRate = summary.totalRecords > 0
              ? ((summary.passed / summary.totalRecords) * 100).toFixed(0)
              : '0';

            const subjectFromList = classSubjects.find(
              (cs) => cs.subjectName.toLowerCase() === summary.subjectName.toLowerCase(),
            );
            const resolvedSubjectId = summary.subjectId > 0 ? summary.subjectId : (subjectFromList?.subjectId ?? 0);

            return (
              <button
                key={summary.subjectName}
                onClick={() => navigate(`${basePath}/exam-results/class/${classId}/subject/${resolvedSubjectId}`)}
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
                      <h3 className="font-bold text-slate-900">{summary.subjectName}</h3>
                      <p className="text-xs text-slate-500">{summary.totalRecords} records</p>
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Average Marks</span>
                    <span className="font-semibold text-slate-900">{summary.avgMarks.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Pass Rate</span>
                    <span className="font-semibold text-slate-900">{passRate}%</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                      <CheckCircle className="size-3" />
                      {summary.passed}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      <XCircle className="size-3" />
                      {summary.failed}
                    </span>
                    {summary.absent > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                        Absent {summary.absent}
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
          description={
            selectedExamType
              ? 'Try adjusting your filter'
              : 'No exam results recorded for this class'
          }
        />
      )}
    </div>
  );
};

export default ExamResultsPage;
