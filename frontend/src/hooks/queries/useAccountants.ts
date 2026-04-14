import { useQuery } from '@tanstack/react-query';
import { accountantService, type Accountant } from '../../services/accountantService';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

export const useAccountants = (enabled = true) => {
  const { user } = useAuth();

  return useQuery<Accountant[]>({
    queryKey: queryKeys.accountant.all(user?.schoolId ?? null),
    queryFn: () => accountantService.getAccountants(),
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled,
  });
};

export const useAccountantById = (id: number) => {
  const { user } = useAuth();

  return useQuery<Accountant>({
    queryKey: queryKeys.accountant.byId(user?.schoolId ?? null, id),
    queryFn: () => accountantService.getAccountantById(id),
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!id,
  });
};
