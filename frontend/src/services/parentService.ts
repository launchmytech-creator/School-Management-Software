import { apiRequest } from './api';
import type { Parent, CreateParentDto, UpdateParentDto, LinkedStudent } from '../types/parent';

const generateTempPassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

interface BackendParent {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  children_count?: string | number;
}

interface BackendLinkedStudent {
  id: number;
  admission_number: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  roll_number: string | null;
  status: string;
  class_name: string | null;
  class_section: string | null;
}

const mapFromBackend = (data: BackendParent): Parent => ({
  id: data.id,
  email: data.email,
  fullName: data.full_name,
  phone: data.phone,
  dateOfBirth: data.date_of_birth,
  gender: data.gender,
  address: data.address,
  isActive: data.is_active,
  createdAt: data.created_at,
  childrenCount: data.children_count ? Number(data.children_count) : 0,
});

export const parentService = {
  getParents: async (): Promise<Parent[]> => {
    const data = await apiRequest<BackendParent[]>('/parents');
    return data.map(mapFromBackend);
  },

  getParentById: async (id: number): Promise<Parent> => {
    const data = await apiRequest<BackendParent>(`/parents/${id}`);
    return mapFromBackend(data);
  },

  createParent: async (data: CreateParentDto): Promise<Parent> => {
    const response = await apiRequest<BackendParent>('/parents', {
      method: 'POST',
      data: {
        email: data.email,
        password: data.password || generateTempPassword(),
        fullName: data.fullName,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender ? (data.gender.charAt(0).toUpperCase() + data.gender.slice(1)) : undefined,
        address: data.address,
      },
    });
    return mapFromBackend(response);
  },

  updateParent: async (id: number, data: UpdateParentDto): Promise<Parent> => {
    const response = await apiRequest<BackendParent>(`/parents/${id}`, {
      method: 'PATCH',
      data,
    });
    return mapFromBackend(response);
  },

  deleteParent: async (id: number): Promise<void> => {
    return apiRequest<void>(`/parents/${id}`, {
      method: 'DELETE',
    });
  },

  linkStudent: async (parentId: number, studentId: number): Promise<void> => {
    return apiRequest<void>(`/parents/${parentId}/link-student`, {
      method: 'POST',
      data: { studentId },
    });
  },

  unlinkStudent: async (studentId: number): Promise<void> => {
    return apiRequest<void>(`/parents/students/${studentId}/unlink`, {
      method: 'DELETE',
    });
  },

  getParentChildren: async (parentId: number): Promise<LinkedStudent[]> => {
    const data = await apiRequest<BackendLinkedStudent[]>(`/parents/${parentId}/children`);
    return data.map(s => ({
      id: s.id,
      admissionNumber: s.admission_number,
      fullName: s.full_name,
      dateOfBirth: s.date_of_birth,
      gender: s.gender,
      rollNumber: s.roll_number,
      status: s.status,
      className: s.class_name,
      classSection: s.class_section,
    }));
  },
};
