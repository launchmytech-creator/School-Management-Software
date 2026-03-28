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
        className="bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer min-w-[140px]"
        onChange={(e) => onFilterChange('classId', e.target.value)}
        value={currentFilters?.classId || ''}
      >
        <option value="">Class</option>
        {classes.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <select 
        className="bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer min-w-[140px]"
        onChange={(e) => onFilterChange('section', e.target.value)}
        value={currentFilters?.section || ''}
      >
        <option value="">Section</option>
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="C">C</option>
      </select>

      <select 
        className="bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer min-w-[180px]"
        onChange={(e) => onFilterChange('academicYear', e.target.value)}
        value={currentFilters?.academicYear || ''}
      >
        <option value="">Academic Year</option>
        <option value="2023-24">2023-24</option>
        <option value="2024-25">2024-25</option>
      </select>

      <select 
        className="bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer min-w-[140px]"
        onChange={(e) => onFilterChange('status', e.target.value)}
        value={currentFilters?.status || ''}
      >
        <option value="">Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <button 
        className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-xl px-4 py-3 font-bold text-[10px] uppercase tracking-widest transition-all"
      >
        More Filters
      </button>
    </div>
  );
};

export default StudentFilters;
