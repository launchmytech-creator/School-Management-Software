import { useQuery } from '@tanstack/react-query';
import { reportService, type AttendanceReport, type FeesReport, type ResultsReport, type SummaryReport } from '../../services/reportService';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

export interface ReportFilters {
  academicYearId?: number;
  classId?: number;
  startDate?: string;
  endDate?: string;
}

export const useSummaryReport = (filters?: ReportFilters) => {
  const { user } = useAuth();

  return useQuery<SummaryReport>({
    queryKey: queryKeys.reports.summary(user?.schoolId ?? null, filters),
    queryFn: () => reportService.getSummaryReport(filters),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
  });
};

export const useAttendanceReport = (filters?: ReportFilters) => {
  const { user } = useAuth();

  return useQuery<AttendanceReport[]>({
    queryKey: queryKeys.reports.attendance(user?.schoolId ?? null, filters),
    queryFn: () => reportService.getAttendanceReport(filters),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
  });
};

export const useFeesReport = (filters?: ReportFilters) => {
  const { user } = useAuth();

  return useQuery<FeesReport[]>({
    queryKey: queryKeys.reports.fees(user?.schoolId ?? null, filters),
    queryFn: () => reportService.getFeesReport(filters),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
  });
};

export const useResultsReport = (filters?: Omit<ReportFilters, 'startDate' | 'endDate'>) => {
  const { user } = useAuth();

  return useQuery<ResultsReport[]>({
    queryKey: queryKeys.reports.results(user?.schoolId ?? null, filters),
    queryFn: () => reportService.getResultsReport(filters),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
  });
};
