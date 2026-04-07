import { useQuery } from '@tanstack/react-query';
import {
  feeService,
  type FeeTransaction,
  type FeeDefaulter,
} from '../../services/feeService';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';

interface FeeTransactionFilters {
  classId?: number;
  studentId?: number;
  academicYearId?: number;
  status?: string;
}

export const useFeeTransactions = (params: FeeTransactionFilters = {}) => {
  return useQuery<FeeTransaction[]>({
    queryKey: queryKeys.feeTransactions.byFilters(params),
    queryFn: () => feeService.getFeeTransactions(params),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
  });
};

export const useStudentFees = (studentId: number) => {
  return useQuery<FeeTransaction[]>({
    queryKey: queryKeys.feeTransactions.byStudent(studentId),
    queryFn: () => feeService.getStudentFeeTransactions(studentId),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: !!studentId,
  });
};

export const useFeeDefaulters = (params: { classId?: number; academicYearId?: number } = {}) => {
  return useQuery<FeeDefaulter[]>({
    queryKey: queryKeys.feeDefaulters.byFilters(params),
    queryFn: () => feeService.getFeeDefaulters(params),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
  });
};
