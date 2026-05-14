import { apiRequest } from './api';

export interface Announcement {
  id: number;
  title: string;
  message: string;
  targetRole: string | null;
  createdBy: number;
  createdByName: string | null;
  createdAt: string;
}

export interface CreateAnnouncementDto {
  title: string;
  message: string;
  targetRole?: string;
}

export interface UpdateAnnouncementDto {
  title?: string;
  message?: string;
  targetRole?: string;
}

interface BackendAnnouncement {
  id: number;
  school_id: number;
  title: string;
  message: string;
  target_role: string | null;
  created_by: number;
  created_by_name: string | null;
  created_at: string;
}

const mapAnnouncement = (data: BackendAnnouncement): Announcement => ({
  id: data.id,
  title: data.title,
  message: data.message,
  targetRole: data.target_role,
  createdBy: data.created_by,
  createdByName: data.created_by_name ?? null,
  createdAt: data.created_at,
});

export const announcementService = {
  getAnnouncements: async (filters?: {
    targetRole?: string;
    limit?: number;
  }): Promise<Announcement[]> => {
    const params = new URLSearchParams();
    if (filters?.targetRole) params.append('targetRole', filters.targetRole);
    if (filters?.limit) params.append('limit', String(filters.limit));
    
    const queryString = params.toString();
    const response = await apiRequest<BackendAnnouncement[]>(
      `/announcements${queryString ? `?${queryString}` : ''}`
    );
    return response.map(mapAnnouncement);
  },

  getAnnouncementById: async (id: number): Promise<Announcement> => {
    const response = await apiRequest<BackendAnnouncement>(`/announcements/${id}`);
    return mapAnnouncement(response);
  },

  createAnnouncement: async (data: CreateAnnouncementDto): Promise<Announcement> => {
    const response = await apiRequest<BackendAnnouncement>('/announcements', {
      method: 'POST',
      data,
    });
    return mapAnnouncement(response);
  },

  updateAnnouncement: async (id: number, data: UpdateAnnouncementDto): Promise<Announcement> => {
    const response = await apiRequest<BackendAnnouncement>(`/announcements/${id}`, {
      method: 'PATCH',
      data,
    });
    return mapAnnouncement(response);
  },

  deleteAnnouncement: async (id: number): Promise<void> => {
    await apiRequest<void>(`/announcements/${id}`, {
      method: 'DELETE',
    });
  },
};

export default announcementService;
