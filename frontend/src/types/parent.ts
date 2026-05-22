export type Gender = 'male' | 'female' | 'other';

export interface Parent {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  childrenCount?: number;
}

export interface CreateParentDto {
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  address?: string;
}

export interface UpdateParentDto {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
}

export interface LinkedStudent {
  id: number;
  admissionNumber: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: string | null;
  rollNumber: string | null;
  status: string;
  classId: number | null;
  className: string | null;
  classSection: string | null;
}
