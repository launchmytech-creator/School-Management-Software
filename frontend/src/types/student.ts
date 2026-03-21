export type StudentStatus = 'active' | 'inactive' | 'suspended' | 'graduated';
export type FeeStatus = 'Paid' | 'Pending' | 'Partial';

export interface Student {
  id: number;
  schoolId: number;
  admissionNumber: string;
  fullName: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  phone?: string | null;
  admissionDate: string;
  currentClassId?: number | null;
  parentId?: number | null;
  rollNumber?: string | null;
  status: StudentStatus;
  
  // Joined fields
  className?: string;
  classSection?: string;
  parentName?: string;
  parentPhone?: string;
  
  // UI Specific
  feeStatus?: FeeStatus; // This might come from another service or be derived
}

export interface StudentFilters {
  classId?: string;
  section?: string;
  academicYear?: string;
  search?: string;
  status?: string;
}
