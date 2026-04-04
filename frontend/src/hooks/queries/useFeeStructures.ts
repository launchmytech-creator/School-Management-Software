import { useQuery } from '@tanstack/react-query';
import { feeStructureService } from '../../services/feeStructureService';
import { queryKeys } from '../../lib/queryKeys';

interface FeeStructureFilters {
  classId?: number;
  academicYearId?: number;
}

export const useFeeStructuresGrouped = (params: FeeStructureFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.feeStructures.grouped(params),
    queryFn: () => feeStructureService.getFeeStructuresGrouped(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useFeeStructures = () => {
  return useQuery({
    queryKey: queryKeys.feeStructures.all,
    queryFn: () => feeStructureService.getFeeStructures(),
    staleTime: 5 * 60 * 1000,
  });
};
