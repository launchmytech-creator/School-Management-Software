import { apiRequest } from './api';
import type { StudentFilters, Student, StudentHistory } from '../types/student';
import type { PaginatedResponse } from '../types/common';

interface BackendStudent {
  id: number;
  school_id: number;
  admission_number: string;
  full_name: string;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
  phone?: string | null;
  admission_date: string;
  current_class_id?: number | null;
  parent_id?: number | null;
  roll_number?: string | null;
  status: string;
  class_name?: string;
  class_section?: string;
  parent_name?: string;
  parent_phone?: string;
}

const mapFromBackend = (data: BackendStudent): Student => ({
  id: data.id,
  schoolId: data.school_id,
  admissionNumber: data.admission_number,
  fullName: data.full_name,
  dateOfBirth: data.date_of_birth,
  gender: data.gender,
  address: data.address,
  phone: data.phone,
  admissionDate: data.admission_date,
  currentClassId: data.current_class_id,
  parentId: data.parent_id,
  rollNumber: data.roll_number,
  status: data.status as Student['status'],
  className: data.class_name,
  classSection: data.class_section,
  parentName: data.parent_name,
  parentPhone: data.parent_phone,
});

export interface CreateStudentDto {
  admissionNumber?: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  phone?: string;
  admissionDate?: string;
  currentClassId?: number;
  parentId?: number;
  rollNumber?: string;
}

export interface UpdateStudentDto {
  fullName?: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  phone?: string | null;
  currentClassId?: number;
  parentId?: number | null;
  rollNumber?: string | null;
  status?: string;
}

export const studentService = {
  getStudents: async (filters: StudentFilters = {}): Promise<PaginatedResponse<Student>> => {
    const queryParams = new URLSearchParams();
    if (filters.classId) queryParams.append('classId', filters.classId);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.academicYear) queryParams.append('academicYear', filters.academicYear);
    if (filters.page) queryParams.append('page', String(filters.page));
    if (filters.limit) queryParams.append('limit', String(filters.limit));
    
    const queryString = queryParams.toString();
    const url = `/students${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest<{ data: BackendStudent[]; pagination: { page: number; limit: number; total: number; totalPages: number } | null } | BackendStudent[]>(url);
    
    if (Array.isArray(response)) {
      return {
        data: response.map(mapFromBackend),
        pagination: null,
      };
    }
    
    return {
      data: (response.data ?? []).map(mapFromBackend),
      pagination: response.pagination,
    };
  },

  getStudentById: async (id: number): Promise<Student> => {
    const data = await apiRequest<BackendStudent>(`/students/${id}`);
    return mapFromBackend(data);
  },

  createStudent: async (data: CreateStudentDto): Promise<Student> => {
    const response = await apiRequest<BackendStudent>('/students', {
      method: 'POST',
      data,
    });
    return mapFromBackend(response);
  },

  updateStudent: async (id: number, data: UpdateStudentDto): Promise<Student> => {
    const response = await apiRequest<BackendStudent>(`/students/${id}`, {
      method: 'PATCH',
      data,
    });
    return mapFromBackend(response);
  },

  deleteStudent: async (id: number): Promise<void> => {
    await apiRequest<void>(`/students/${id}`, {
      method: 'DELETE',
    });
  },

  deactivateStudent: async (id: number): Promise<void> => {
    await apiRequest<void>(`/students/${id}`, {
      method: 'DELETE',
    });
  },

  activateStudent: async (id: number): Promise<void> => {
    await apiRequest<void>(`/students/${id}`, {
      method: 'PATCH',
      data: { status: 'active' },
    });
  },

  // [NEW] Get comprehensive student history
  getStudentHistory: async (id: number): Promise<StudentHistory> => {
    const data = await apiRequest<StudentHistory>(`/students/${id}/history`);
    return data;
  },
};

export default studentService;
