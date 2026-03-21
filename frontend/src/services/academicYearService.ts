import { apiRequest } from './api';
import type { AcademicYear, CreateAcademicYearDto, UpdateAcademicYearDto } from '../types/academicYear';

interface BackendAcademicYear {
  id: string | number;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

const mapFromBackend = (data: BackendAcademicYear): AcademicYear => ({
  id: String(data.id),
  name: data.year_name,
  startDate: data.start_date,
  endDate: data.end_date,
  isCurrent: data.is_current,
  status: data.is_current ? 'active' : 'inactive',
});

const mapToBackend = (data: CreateAcademicYearDto | UpdateAcademicYearDto) => ({
  yearName: data.name,
  startDate: data.startDate,
  endDate: data.endDate,
});

export const academicYearService = {
  getAllYears: async (): Promise<AcademicYear[]> => {
    const data = await apiRequest<BackendAcademicYear[]>('/academic-years');
    return data.map(mapFromBackend);
  },

  getCurrentYear: async (): Promise<AcademicYear | null> => {
    try {
      const data = await apiRequest<BackendAcademicYear>('/academic-years/current');
      return mapFromBackend(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      // Also handle 403 as potential access issue or just not found if no year set
      if (
        message.includes('404') || 
        message.toLowerCase().includes('not found') ||
        message.includes('403')
      ) {
        return null;
      }
      throw error;
    }
  },

  getYearById: async (id: string): Promise<AcademicYear> => {
    const data = await apiRequest<BackendAcademicYear>(`/academic-years/${id}`);
    return mapFromBackend(data);
  },

  createYear: async (data: CreateAcademicYearDto): Promise<AcademicYear> => {
    const response = await apiRequest<BackendAcademicYear>('/academic-years', {
      method: 'POST',
      data: mapToBackend(data),
    });
    return mapFromBackend(response);
  },

  updateYear: async (id: string, data: UpdateAcademicYearDto): Promise<AcademicYear> => {
    const response = await apiRequest<BackendAcademicYear>(`/academic-years/${id}`, {
      method: 'PATCH',
      data: mapToBackend(data),
    });
    return mapFromBackend(response);
  },

  deleteYear: async (id: string): Promise<void> => {
    return apiRequest<void>(`/academic-years/${id}`, {
      method: 'DELETE',
    });
  },

  setCurrentYear: async (id: string): Promise<AcademicYear> => {
    const response = await apiRequest<BackendAcademicYear>(`/academic-years/${id}/set-current`, {
      method: 'PATCH',
    });
    return mapFromBackend(response);
  },
};
