import React from 'react';
import { type TeacherAllocation } from '../../types/teacher';

interface ClassSelectProps {
  allocations: TeacherAllocation[];
  value: TeacherAllocation | null;
  onChange: (allocation: TeacherAllocation | null) => void;
  placeholder?: string;
  className?: string;
}

const ClassSelect: React.FC<ClassSelectProps> = ({
  allocations,
  value,
  onChange,
  placeholder = 'Select a class',
  className = ''
}) => {
  return (
    <select
      value={value?.id || ''}
      onChange={(e) => {
        const allocation = allocations.find(a => a.id === Number(e.target.value));
        onChange(allocation || null);
      }}
      className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      <option value="">{placeholder}</option>
      {allocations.map((allocation) => (
        <option key={allocation.id} value={allocation.id}>
          {allocation.className} - Section {allocation.classSection || 'A'} ({allocation.subjectName})
        </option>
      ))}
    </select>
  );
};

export default ClassSelect;
