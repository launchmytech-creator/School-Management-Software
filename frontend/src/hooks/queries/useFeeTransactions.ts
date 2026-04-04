import { useQuery } from '@tanstack/react-query';
import {
  feeService,
  type FeeTransaction,
  type FeeDefaulter,
} from '../../services/feeService';
import { queryKeys } from '../../lib/queryKeys';

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
    staleTime: 1 * 60 * 1000,
  });
};

export const useStudentFees = (studentId: number) => {
  return useQuery<FeeTransaction[]>({
    queryKey: queryKeys.feeTransactions.byStudent(studentId),
    queryFn: () => feeService.getStudentFeeTransactions(studentId),
    staleTime: 1 * 60 * 1000,
    enabled: !!studentId,
  });
};

export const useFeeDefaulters = (params: { classId?: number; academicYearId?: number } = {}) => {
  return useQuery<FeeDefaulter[]>({
    queryKey: queryKeys.feeDefaulters.byFilters(params),
    queryFn: () => feeService.getFeeDefaulters(params),
    staleTime: 1 * 60 * 1000,
  });
};
