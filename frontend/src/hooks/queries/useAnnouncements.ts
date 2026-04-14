import { useQuery } from '@tanstack/react-query';
import { announcementService, type Announcement } from '../../services/announcementService';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

export interface AnnouncementFilters {
  targetRole?: string;
  limit?: number;
}

export const useAnnouncements = (filters?: AnnouncementFilters) => {
  const { user } = useAuth();

  return useQuery<Announcement[]>({
    queryKey: queryKeys.announcements.byFilters(user?.schoolId ?? null, filters || {}),
    queryFn: () => announcementService.getAnnouncements(filters),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
  });
};

export const useAnnouncementById = (id: number) => {
  const { user } = useAuth();

  return useQuery<Announcement>({
    queryKey: [...queryKeys.announcements.all(user?.schoolId ?? null), id] as const,
    queryFn: () => announcementService.getAnnouncementById(id),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: !!id,
  });
};
