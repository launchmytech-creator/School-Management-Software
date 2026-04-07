import { useQuery } from '@tanstack/react-query';
import { parentService } from '../../services/parentService';
import { QUERY_STALE_TIME } from '../../lib/constants';

export const useParentChildren = (parentId: number) => {
  return useQuery({
    queryKey: ['parent', parentId, 'children'] as const,
    queryFn: () => parentService.getParentChildren(parentId),
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!parentId,
  });
};
