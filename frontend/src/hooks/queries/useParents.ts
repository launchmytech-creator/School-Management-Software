import { useQuery } from '@tanstack/react-query';
import { parentService } from '../../services/parentService';
import type { Parent, LinkedStudent } from '../../types/parent';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

export const useParents = (enabled = true) => {
  const { user } = useAuth();

  return useQuery<Parent[]>({
    queryKey: queryKeys.parents.all(user?.schoolId ?? null),
    queryFn: () => parentService.getParents(),
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled,
  });
};

export const useParentById = (id: number) => {
  const { user } = useAuth();

  return useQuery<Parent>({
    queryKey: queryKeys.parents.byId(user?.schoolId ?? null, id),
    queryFn: () => parentService.getParentById(id),
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!id,
  });
};

export const useParentChildren = (parentId: number) => {
  return useQuery<LinkedStudent[]>({
    queryKey: ['parents', parentId, 'children'] as const,
    queryFn: () => parentService.getParentChildren(parentId),
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!parentId,
  });
};
