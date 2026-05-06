import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen } from 'lucide-react';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useClasses } from '../../hooks/queries/useClasses';
import { useAllStudents } from '../../hooks/queries/useStudents';
import PageHeader from '../common/PageHeader';
import { LoadingSpinner } from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import FilterBar from '../common/FilterBar';

interface StudentClassSelectorProps {
  layout: 'admin' | 'accountant' | 'teacher';
  teacherClassIds?: Set<string>;
}

const StudentClassSelector: React.FC<StudentClassSelectorProps> = ({ layout, teacherClassIds }) => {
  const navigate = useNavigate();
  const { selectedYear } = useAcademicYear();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: allClasses = [], isLoading: loadingClasses } = useClasses(selectedYear?.id);
  const { data: allStudents = [], isLoading: loadingStudents } = useAllStudents();

  const classes = React.useMemo(() => {
    if (layout === 'teacher' && teacherClassIds) {
      return allClasses.filter((c) => teacherClassIds.has(String(c.id)));
    }
    return allClasses;
  }, [allClasses, layout, teacherClassIds]);

  const filteredClasses = React.useMemo(() => {
    if (!searchTerm.trim()) return classes;
    const search = searchTerm.toLowerCase();
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        (c.section && c.section.toLowerCase().includes(search))
    );
  }, [classes, searchTerm]);

  const studentCountByClass = React.useMemo(() => {
    const counts: Record<string, number> = {};
    allStudents.forEach((s) => {
      const classId = String(s.currentClassId ?? '');
      if (classId) {
        counts[classId] = (counts[classId] || 0) + 1;
      }
    });
    return counts;
  }, [allStudents]);

  const basePath =
    layout === 'admin' ? '/admin' : layout === 'accountant' ? '/accountant' : '/teacher';

  if (loadingClasses || loadingStudents) {
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
        title="Students"
        subtitle="Select a class to view students"
        breadcrumb={{
          links: [
            { label: 'Dashboard', href: `${basePath}/dashboard` },
            { label: 'Students', active: true },
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
          const count = studentCountByClass[String(cls.id)] || 0;
          return (
            <button
              key={cls.id}
              onClick={() => navigate(`${basePath}/students/class/${cls.id}`)}
              className="bg-white rounded-xl border border-slate-200 p-6 text-left hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                    <BookOpen className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{cls.name}</h3>
                    <p className="text-sm text-slate-500">Section {cls.section || 'A'}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                <Users className="size-4 text-slate-400" />
                <span className="font-semibold">{count} students</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StudentClassSelector;
