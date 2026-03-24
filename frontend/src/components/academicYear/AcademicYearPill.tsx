import React, { useState, useRef, useEffect } from 'react';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { cn } from '../../lib/utils';
import type { AcademicYear } from '../../types/academicYear';

const AcademicYearPill: React.FC = () => {
  const { 
    currentYear, 
    allYears, 
    selectedYear, 
    setSelectedYear, 
    isHistorical, 
    loading, 
    error,
    refreshYears
  } = useAcademicYear();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl animate-pulse">
        <div className="w-4 h-4 rounded-full bg-slate-200"></div>
        <div className="w-20 h-4 bg-slate-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <button 
        onClick={() => refreshYears()}
        className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">sync_problem</span>
        Retry Year Load
      </button>
    );
  }

  if (!currentYear) {
    return (
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 text-amber-700 px-4 py-2 rounded-xl text-xs font-bold">
        <span className="material-symbols-outlined text-lg">warning</span>
        No active year
      </div>
    );
  }

  const handleYearSelect = (year: AcademicYear) => {
    setSelectedYear(year);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border shadow-sm",
          isHistorical 
            ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" 
            : "bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100/50"
        )}
      >
        <div className="flex items-center gap-2">
          <span>{selectedYear?.name || currentYear.name}</span>
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            isHistorical ? "bg-amber-400" : "bg-blue-400"
          )}></span>
          <span className="opacity-70 text-[10px] uppercase tracking-wider">
            {isHistorical ? 'Historical View' : 'Active'}
          </span>
        </div>
        <span className={cn(
          "material-symbols-outlined text-lg transition-transform duration-200",
          isDropdownOpen && "rotate-180"
        )}>
          expand_more
        </span>
      </button>

      {isDropdownOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-2 border-b border-slate-50 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Academic Year</span>
          </div>
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {allYears.map((year) => (
              <button
                key={year.id}
                onClick={() => handleYearSelect(year)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-sm font-medium",
                  selectedYear?.id === year.id ? "text-blue-600 bg-blue-50/30" : "text-slate-600"
                )}
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold">{year.name}</span>
                  {year.isCurrent && (
                    <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-black uppercase mt-1">
                      Currently Active
                    </span>
                  )}
                </div>
                {selectedYear?.id === year.id && (
                  <span className="material-symbols-outlined text-blue-500 font-bold">check</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicYearPill;
