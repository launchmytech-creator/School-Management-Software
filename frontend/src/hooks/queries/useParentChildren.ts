import { useQuery } from '@tanstack/react-query';
import { parentService } from '../../services/parentService';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

export const useParentChildren = (parentId: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['parent', { schoolId: user?.schoolId ?? null, parentId }, 'children'] as const,
    queryFn: () => parentService.getParentChildren(parentId),
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!parentId,
  });
};
