import React from 'react';
import { Button } from '../ui/button';
import type { Class } from '../../types/class';

interface FeeFiltersProps {
  classes: Class[];
  selectedClass: string;
  onClassChange: (id: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  onReset: () => void;
}

export const FeeFilters: React.FC<FeeFiltersProps> = ({
  classes,
  selectedClass,
  onClassChange,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onReset,
}) => {
  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <select
          value={selectedClass}
          onChange={(e) => {
            onClassChange(e.target.value);
          }}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 min-w-48"
        >
          <option value="">Select Class</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>
              {cls.name} {cls.section ? `- Section ${cls.section}` : ''}
            </option>
          ))}
        </select>
        
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search by student name or admission number..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <div className="flex gap-3 items-center">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 min-w-32"
          >
            <option value="">All Status</option>
            <option value="paid">Fully Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">With Pending</option>
          </select>

          {(searchTerm || statusFilter || selectedClass) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default FeeFilters;
