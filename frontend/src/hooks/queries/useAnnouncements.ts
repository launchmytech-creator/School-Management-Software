import { useQuery } from '@tanstack/react-query';
import { announcementService, type Announcement } from '../../services/announcementService';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';
import { handleServiceError } from '../../lib/queryErrorHandler';

const retryConfig = {
  retry: (failureCount: number, error: unknown): boolean => {
    if (failureCount >= 3) return false;
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('404')) {
      return false;
    }
    return true;
  },
};

export interface AnnouncementFilters {
  targetRole?: string;
  limit?: number;
}

export const useAnnouncements = (filters?: AnnouncementFilters) => {
  const { user } = useAuth();

  return useQuery<Announcement[]>({
    queryKey: queryKeys.announcements.byFilters(user?.schoolId ?? null, filters || {}),
    queryFn: async () => {
      try {
        return await announcementService.getAnnouncements(filters);
      } catch (error) {
        handleServiceError(error, 'ANNOUNCEMENTS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    ...retryConfig,
  });
};

export const useAnnouncementById = (id: number) => {
  const { user } = useAuth();

  return useQuery<Announcement>({
    queryKey: [...queryKeys.announcements.all(user?.schoolId ?? null), id] as const,
    queryFn: async () => {
      try {
        return await announcementService.getAnnouncementById(id);
      } catch (error) {
        handleServiceError(error, 'ANNOUNCEMENTS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: !!id,
    ...retryConfig,
  });
};
