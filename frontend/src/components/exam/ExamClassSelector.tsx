import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, FileText } from 'lucide-react';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useClasses } from '../../hooks/queries/useClasses';
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

  if (loadingClasses) {
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

      <div className="space-y-4">
        {filteredClasses.map((cls) => (
          <div
            key={cls.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`${basePath}/exam-results/class/${cls.id}`)}
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-violet-50 text-violet-600">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {cls.name}
                      {cls.section && ` - Section ${cls.section}`}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Section {cls.section || 'A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">View Results</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamClassSelector;
