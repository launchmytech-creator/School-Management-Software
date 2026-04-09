import { useQuery } from '@tanstack/react-query';
import { feeStructureService } from '../../services/feeStructureService';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

interface FeeStructureFilters {
  classId?: number;
  academicYearId?: number;
}

export const useFeeStructuresGrouped = (params: FeeStructureFilters = {}) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.feeStructures.grouped(user?.schoolId ?? null, params),
    queryFn: () => feeStructureService.getFeeStructuresGrouped(params),
    staleTime: QUERY_STALE_TIME.LISTS,
  });
};

export const useFeeStructures = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.feeStructures.all(user?.schoolId ?? null),
    queryFn: () => feeStructureService.getFeeStructures(),
    staleTime: QUERY_STALE_TIME.LISTS,
  });
};
