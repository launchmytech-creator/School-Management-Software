import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { academicYearService } from '../services/academicYearService';
import type { AcademicYear } from '../types/academicYear';
import { authService } from '../services/authService';

export interface AcademicYearContextType {
  currentYear: AcademicYear | null;
  allYears: AcademicYear[];
  selectedYear: AcademicYear | null;
  setSelectedYear: (year: AcademicYear | null) => void;
  isHistorical: boolean;
  loading: boolean;
  error: string | null;
  refreshYears: () => Promise<void>;
}

export const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export const useAcademicYear = (): AcademicYearContextType => {
  const context = useContext(AcademicYearContext);
  
  if (context === undefined) {
    if (import.meta.env.DEV) {
      console.warn('useAcademicYear must be used within an AcademicYearProvider');
    }
    throw new Error('useAcademicYear must be used within an AcademicYearProvider');
  }
  
  return context;
};

export const AcademicYearProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const [allYears, setAllYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const refreshYears = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const [current, all] = await Promise.all([
        academicYearService.getCurrentYear().catch(() => null),
        academicYearService.getAllYears()
      ]);

      const finalCurrent = current || all.find(y => y.isCurrent) || null;

      setCurrentYear(finalCurrent);
      setAllYears(all);
      setSelectedYear(finalCurrent);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load academic years';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current && authService.isAuthenticated()) {
      hasFetched.current = true;
      refreshYears();
    }
  }, [refreshYears]);

  useEffect(() => {
    if (currentYear && !selectedYear) {
      setSelectedYear(currentYear);
    }
  }, [currentYear, selectedYear]);

  const isHistorical = !!(selectedYear && currentYear && selectedYear.id !== currentYear.id);

  const value: AcademicYearContextType = {
    currentYear,
    allYears,
    selectedYear,
    setSelectedYear,
    isHistorical,
    loading,
    error,
    refreshYears,
  };

  return (
    <AcademicYearContext.Provider value={value}>
      {children}
    </AcademicYearContext.Provider>
  );
};
