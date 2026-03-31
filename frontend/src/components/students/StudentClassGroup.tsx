import React from 'react';
import { ChevronDown, ChevronRight, Users, Loader2, AlertCircle } from 'lucide-react';

interface StudentClassGroupProps {
  className: string;
  classSection: string | null;
  students: { id: string | number }[];
  isExpanded: boolean;
  isLoading?: boolean;
  hasError?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const StudentClassGroup: React.FC<StudentClassGroupProps> = ({
  className,
  classSection,
  students,
  isExpanded,
  isLoading = false,
  hasError = false,
  onToggle,
  children,
}) => {
  const studentCount = students.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div 
        className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-colors ${
          hasError ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'
        }`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          )}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {className}
              {classSection && <span className="text-slate-500 ml-1">- Section {classSection}</span>}
            </h3>
            {hasError ? (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Failed to load. Click to retry.
              </p>
            ) : isLoading ? (
              <p className="text-sm text-slate-400 flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading students...
              </p>
            ) : isExpanded && (
              <p className="text-sm text-slate-500">
                {studentCount} {studentCount === 1 ? 'student' : 'students'}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          ) : hasError ? (
            <AlertCircle className="w-5 h-5 text-red-500" />
          ) : isExpanded && (
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
              Expanded
            </span>
          )}
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isExpanded && !isLoading && !hasError && (
        <div className="border-t border-slate-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default StudentClassGroup;
