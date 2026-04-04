import { useQuery } from '@tanstack/react-query';
import { parentService } from '../../services/parentService';

export const useParentChildren = (parentId: number) => {
  return useQuery({
    queryKey: ['parent', parentId, 'children'] as const,
    queryFn: () => parentService.getParentChildren(parentId),
    staleTime: 5 * 60 * 1000,
    enabled: !!parentId,
  });
};
