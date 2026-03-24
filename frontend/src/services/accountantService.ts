import { apiRequest } from './api';

export interface Accountant {
  id: number;
  schoolId: number;
  email: string;
  fullName: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateAccountantDto {
  email: string;
  password?: string;
  fullName: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
}

interface BackendAccountant {
  id: number;
  school_id: number;
  email: string;
  full_name: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

const mapAccountant = (data: BackendAccountant): Accountant => ({
  id: data.id,
  schoolId: data.school_id,
  email: data.email,
  fullName: data.full_name,
  phone: data.phone,
  dateOfBirth: data.date_of_birth,
  gender: data.gender,
  address: data.address,
  isActive: data.is_active,
  createdAt: data.created_at,
});

export const accountantService = {
  getAccountants: async (): Promise<Accountant[]> => {
    const data = await apiRequest<BackendAccountant[]>('/accountants');
    return data.map(mapAccountant);
  },

  getAccountantById: async (id: number): Promise<Accountant> => {
    const data = await apiRequest<BackendAccountant>(`/accountants/${id}`);
    return mapAccountant(data);
  },

  createAccountant: async (data: CreateAccountantDto): Promise<Accountant> => {
    const response = await apiRequest<BackendAccountant>('/accountants', {
      method: 'POST',
      data,
    });
    return mapAccountant(response);
  },

  updateAccountant: async (id: number, data: Partial<CreateAccountantDto> & { isActive?: boolean }): Promise<Accountant> => {
    const response = await apiRequest<BackendAccountant>(`/accountants/${id}`, {
      method: 'PATCH',
      data,
    });
    return mapAccountant(response);
  },

  deleteAccountant: async (id: number): Promise<void> => {
    await apiRequest<void>(`/accountants/${id}`, {
      method: 'DELETE',
    });
  },
};
