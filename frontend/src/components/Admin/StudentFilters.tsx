import React, { useState, useEffect } from 'react';
import { classService } from '../../services/classService';
import type { Class } from '../../types/class';

interface StudentFiltersProps {
  onFilterChange: (filterName: string, value: string) => void;
  currentFilters?: {
    classId?: string;
    section?: string;
    academicYear?: string;
    status?: string;
  };
}

const StudentFilters: React.FC<StudentFiltersProps> = ({ onFilterChange, currentFilters }) => {
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    classService.getClasses().then(setClasses);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <select 
        className="bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all cursor-pointer min-w-[140px]"
        onChange={(e) => onFilterChange('classId', e.target.value)}
        value={currentFilters?.classId || ''}
      >
        <option value="">All Classes</option>
        {classes.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <select 
        className="bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all cursor-pointer min-w-[120px]"
        onChange={(e) => onFilterChange('section', e.target.value)}
        value={currentFilters?.section || ''}
      >
        <option value="">Section</option>
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="C">C</option>
      </select>

      <select 
        className="bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all cursor-pointer min-w-[140px]"
        onChange={(e) => onFilterChange('status', e.target.value)}
        value={currentFilters?.status || ''}
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
};

export default StudentFilters;
