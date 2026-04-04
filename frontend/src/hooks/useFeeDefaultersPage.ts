import { useState, useMemo } from 'react';
import { useAcademicYear } from '../context/AcademicYearContext';
import { useFeeDefaulters } from './queries';
import { useClasses } from './queries';
import type { FeeDefaulter } from '../services/feeService';

interface UseFeeDefaultersPageReturn {
  classes: { id: string; name: string }[];
  defaulters: FeeDefaulter[];
  filteredDefaulters: FeeDefaulter[];
  isLoading: boolean;
  totalDue: number;
  withContactCount: number;
  selectedClass: string;
  setSelectedClass: (value: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export const useFeeDefaultersPage = (): UseFeeDefaultersPageReturn => {
  const { selectedYear } = useAcademicYear();
  
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: defaulters = [], isLoading } = useFeeDefaulters({
    classId: selectedClass ? parseInt(selectedClass) : undefined,
    academicYearId: selectedYear?.id ? parseInt(selectedYear.id) : undefined,
  });

  const { data: classesData } = useClasses(selectedYear?.id);
  const classes = classesData?.map(c => ({ id: String(c.id), name: c.name })) ?? [];

  const totalDue = useMemo(() => 
    defaulters.reduce((sum, d) => sum + d.totalDue, 0), 
    [defaulters]
  );

  const withContactCount = useMemo(() => 
    defaulters.filter(d => d.parentPhone).length, 
    [defaulters]
  );

  const filteredDefaulters = useMemo(() => 
    defaulters.filter(d =>
      d.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.parentName.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [defaulters, searchTerm]
  );

  return {
    classes,
    defaulters,
    filteredDefaulters,
    isLoading,
    totalDue,
    withContactCount,
    selectedClass,
    setSelectedClass,
    searchTerm,
    setSearchTerm,
  };
};
