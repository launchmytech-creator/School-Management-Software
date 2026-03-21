import { apiRequest } from './api';
import type { Class, CreateClassDto, UpdateClassDto } from '../types/class';

interface BackendClass {
  id: string | number;
  school_id: string | number;
  name: string;
  section: string | null;
  academic_year_id: string | number;
  year_name: string;
  start_date: string;
  end_date: string;
  default_fee_amount: string | number | null;
  student_count: string | number;
}

const mapFromBackend = (data: BackendClass): Class => ({
  id: String(data.id),
  name: data.name,
  section: data.section,
  academicYearId: String(data.academic_year_id),
  yearName: data.year_name,
  defaultFeeAmount: data.default_fee_amount ? Number(data.default_fee_amount) : null,
  studentCount: Number(data.student_count || 0),
});

export const classService = {
  getClasses: async (academicYearId?: string | number): Promise<Class[]> => {
    const url = academicYearId ? `/classes?academicYearId=${academicYearId}` : '/classes';
    const data = await apiRequest<BackendClass[]>(url);
    return data.map(mapFromBackend);
  },

  getClassById: async (id: string | number): Promise<Class> => {
    const data = await apiRequest<BackendClass>(`/classes/${id}`);
    return mapFromBackend(data);
  },

  createClass: async (data: CreateClassDto): Promise<Class> => {
    const response = await apiRequest<BackendClass>('/classes', {
      method: 'POST',
      data: {
        name: data.name,
        section: data.section,
        academicYearId: data.academicYearId,
        defaultFeeAmount: data.defaultFeeAmount,
      },
    });
    return mapFromBackend(response);
  },

  updateClass: async (id: string | number, data: UpdateClassDto): Promise<Class> => {
    const response = await apiRequest<BackendClass>(`/classes/${id}`, {
      method: 'PATCH',
      data,
    });
    return mapFromBackend(response);
  },

  deleteClass: async (id: string | number): Promise<void> => {
    return apiRequest<void>(`/classes/${id}`, {
      method: 'DELETE',
    });
  },
};
