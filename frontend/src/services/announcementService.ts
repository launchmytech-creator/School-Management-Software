import { apiRequest } from './api';

export interface Announcement {
  id: number;
  schoolId: number;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  targetRoles: string[] | null;
  academicYearId: number | null;
  academicYearName: string | null;
  isActive: boolean;
  createdBy: number;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  priority?: 'low' | 'medium' | 'high';
  targetRoles?: string[];
  academicYearId?: number;
  isActive?: boolean;
}

export interface UpdateAnnouncementDto {
  title?: string;
  content?: string;
  priority?: 'low' | 'medium' | 'high';
  targetRoles?: string[];
  isActive?: boolean;
}

interface BackendAnnouncement {
  id: number;
  school_id: number;
  title: string;
  content: string;
  priority: string;
  target_roles: string[] | null;
  academic_year_id: number | null;
  academic_year_name: string | null;
  is_active: boolean;
  created_by: number;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

const mapAnnouncement = (data: BackendAnnouncement): Announcement => ({
  id: data.id,
  schoolId: data.school_id,
  title: data.title,
  content: data.content,
  priority: data.priority as 'low' | 'medium' | 'high',
  targetRoles: data.target_roles,
  academicYearId: data.academic_year_id,
  academicYearName: data.academic_year_name,
  isActive: data.is_active,
  createdBy: data.created_by,
  createdByName: data.created_by_name,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

export const announcementService = {
  getAnnouncements: async (filters?: {
    academicYearId?: number;
    priority?: string;
    isActive?: boolean;
    limit?: number;
  }): Promise<Announcement[]> => {
    const params = new URLSearchParams();
    if (filters?.academicYearId) params.append('academicYearId', String(filters.academicYearId));
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
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
