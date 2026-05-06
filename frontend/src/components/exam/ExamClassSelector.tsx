import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap } from 'lucide-react';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useClasses } from '../../hooks/queries/useClasses';
import { useExamResults } from '../../hooks/queries/useExamResults';
import PageHeader from '../common/PageHeader';
import { LoadingSpinner } from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import FilterBar from '../common/FilterBar';

interface ExamClassSelectorProps {
  layout: 'admin' | 'accountant';
}

const ExamClassSelector: React.FC<ExamClassSelectorProps> = ({ layout }) => {
  const navigate = useNavigate();
  const { selectedYear } = useAcademicYear();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: allClasses = [], isLoading: loadingClasses } = useClasses(selectedYear?.id);

  const academicYearId = selectedYear?.id ? parseInt(selectedYear.id) : undefined;

  const { data: results = [], isLoading: loadingResults } = useExamResults({
    academicYearId,
  });

  const resultsByClass = useMemo(() => {
    const counts: Record<string, number> = {};
    results.forEach((r) => {
      const classKey = allClasses.find(
        (c) => c.name === r.className && c.section === r.classSection
      )?.id;
      if (classKey) {
        const k = String(classKey);
        counts[k] = (counts[k] || 0) + 1;
      }
    });
    return counts;
  }, [results, allClasses]);

  const filteredClasses = useMemo(() => {
    if (!searchTerm.trim()) return allClasses;
    const search = searchTerm.toLowerCase();
    return allClasses.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        (c.section && c.section.toLowerCase().includes(search))
    );
  }, [allClasses, searchTerm]);

  const basePath = layout === 'admin' ? '/admin' : '/accountant';

  if (loadingClasses || loadingResults) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading classes..." />
      </div>
    );
  }

  if (filteredClasses.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No classes found"
        description={searchTerm ? 'Try adjusting your search' : 'No classes available for the selected academic year'}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Exam Results"
        subtitle="Select a class to view examination results"
        breadcrumb={{
          links: [
            { label: 'Exams', href: `${basePath}/exams` },
            { label: 'Exam Results', active: true },
          ],
        }}
      />

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onReset={() => setSearchTerm('')}
        searchPlaceholder="Search class or section..."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredClasses.map((cls) => {
          const resultCount = resultsByClass[String(cls.id)] || 0;
          return (
            <button
              key={cls.id}
              onClick={() => navigate(`${basePath}/exam-results/class/${cls.id}`)}
              className="bg-white rounded-xl border border-slate-200 p-6 text-left hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-violet-50 text-violet-500 rounded-xl flex items-center justify-center group-hover:bg-violet-500 group-hover:text-white transition-all">
                    <GraduationCap className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{cls.name}</h3>
                    <p className="text-sm text-slate-500">Section {cls.section || 'A'}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                <GraduationCap className="size-4 text-slate-400" />
                <span className="font-semibold">{resultCount} results</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ExamClassSelector;
