import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { AcademicYear } from '../types/academicYear';
import { useAuth } from './AuthContext';
import { useAcademicYears, useCurrentAcademicYear, useRefreshAcademicYears } from '../hooks/queries/useAcademicYears';

export interface AcademicYearContextType {
  currentYear: AcademicYear | null;
  allYears: AcademicYear[];
  selectedYear: AcademicYear | null;
  setSelectedYear: (year: AcademicYear | null) => void;
  isHistorical: boolean;
  loading: boolean;
  error: string | null;
  refreshYears: () => void;
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
  const { user } = useAuth();
  const [selectedYear, setSelectedYearState] = useState<AcademicYear | null>(null);
  const [userSelectedYear, setUserSelectedYear] = useState<AcademicYear | null>(null);
  
  const { data: allYearsData = [], isLoading: allYearsLoading, error: allYearsError, refetch: refetchAll } = useAcademicYears();
  const { data: currentYearData = null, isLoading: currentLoading, error: currentError, refetch: refetchCurrent } = useCurrentAcademicYear();
  const refreshAcademicYears = useRefreshAcademicYears();

  const allYears = allYearsData || [];
  const currentYear = currentYearData;
  const loading = allYearsLoading || currentLoading;
  
  const error = allYearsError?.message || currentError?.message || null;

  useEffect(() => {
    setSelectedYearState(null);
    setUserSelectedYear(null);
  }, [user?.schoolId]);

  useEffect(() => {
    if (currentYear && !userSelectedYear) {
      setSelectedYearState(currentYear);
    } else if (!userSelectedYear && allYears.length > 0 && !loading) {
      const foundYear = allYears.find(y => y.id === selectedYear?.id);
      if (foundYear) {
        setSelectedYearState(foundYear);
      }
    }
  }, [currentYear, allYears, userSelectedYear, loading]);

  const setSelectedYear = useCallback((year: AcademicYear | null) => {
    setSelectedYearState(year);
    setUserSelectedYear(year);
  }, []);

  const refreshYears = useCallback(() => {
    refreshAcademicYears();
  }, [refreshAcademicYears]);

  const isHistorical = useMemo(() => {
    return !!(selectedYear && currentYear && selectedYear.id !== currentYear.id);
  }, [selectedYear, currentYear]);

  const value = useMemo<AcademicYearContextType>(() => ({
    currentYear,
    allYears,
    selectedYear: selectedYear || currentYear,
    setSelectedYear,
    isHistorical,
    loading,
    error,
    refreshYears,
  }), [currentYear, allYears, selectedYear, setSelectedYear, isHistorical, loading, error, refreshYears]);

  return (
    <AcademicYearContext.Provider value={value}>
      {children}
    </AcademicYearContext.Provider>
  );
};
