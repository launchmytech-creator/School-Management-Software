import { apiRequest } from './api';

export interface SchoolSettings {
  id: number;
  schoolId: number;
  schoolName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsDto {
  schoolName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  logoUrl?: string;
}

interface BackendSettings {
  id: number;
  school_id: number;
  school_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

const mapSettings = (data: BackendSettings): SchoolSettings => ({
  id: data.id,
  schoolId: data.school_id,
  schoolName: data.school_name,
  contactEmail: data.contact_email,
  contactPhone: data.contact_phone,
  address: data.address,
  logoUrl: data.logo_url,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

export const schoolSettingsService = {
  getSettings: async (): Promise<SchoolSettings> => {
    const response = await apiRequest<BackendSettings>('/school-settings');
    return mapSettings(response);
  },

  updateSettings: async (data: UpdateSettingsDto): Promise<SchoolSettings> => {
    const response = await apiRequest<BackendSettings>('/school-settings', {
      method: 'PATCH',
      data,
    });
    return mapSettings(response);
  },
};

export default schoolSettingsService;
