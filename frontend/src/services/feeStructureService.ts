import { apiRequest } from './api';

export interface FeeStructure {
  id: number;
  classId: number;
  className: string;
  classSection: string | null;
  academicYearId: number;
  academicYearName: string;
  feeType: string;
  amount: number;
  termNumber: number | null;
}

export interface CreateFeeStructureDto {
  classId: number;
  academicYearId: number;
  feeType: string;
  amount: number;
  termNumber?: number;
}

export interface UpdateFeeStructureDto {
  feeType?: string;
  amount?: number;
}

interface BackendFeeStructure {
  id: number;
  school_id: number;
  class_id: number;
  class_name: string;
  class_section: string | null;
  academic_year_id: number;
  academic_year_name: string;
  fee_type: string;
  amount: number;
  term_number: number | null;
}

const mapFromBackend = (data: BackendFeeStructure): FeeStructure => ({
  id: data.id,
  classId: data.class_id,
  className: data.class_name,
  classSection: data.class_section,
  academicYearId: data.academic_year_id,
  academicYearName: data.academic_year_name,
  feeType: data.fee_type,
  amount: data.amount,
  termNumber: data.term_number,
});

export const feeStructureService = {
  createFeeStructure: async (data: CreateFeeStructureDto): Promise<FeeStructure> => {
    const response = await apiRequest<BackendFeeStructure>('/fee-structures', {
      method: 'POST',
      data: {
        classId: data.classId,
        academicYearId: data.academicYearId,
        feeType: data.feeType,
        amount: data.amount,
        termNumber: data.termNumber,
      },
    });
    return mapFromBackend(response);
  },

  getFeeStructures: async (filters?: {
    classId?: number;
    academicYearId?: number;
    feeType?: string;
  }): Promise<FeeStructure[]> => {
    const params = new URLSearchParams();
    if (filters?.classId) params.append('classId', String(filters.classId));
    if (filters?.academicYearId) params.append('academicYearId', String(filters.academicYearId));
    if (filters?.feeType) params.append('feeType', filters.feeType);
    
    const queryString = params.toString();
    const response = await apiRequest<BackendFeeStructure[]>(`/fee-structures${queryString ? `?${queryString}` : ''}`);
    return response.map(mapFromBackend);
  },

  getFeeStructureById: async (id: number): Promise<FeeStructure> => {
    const response = await apiRequest<BackendFeeStructure>(`/fee-structures/${id}`);
    return mapFromBackend(response);
  },

  updateFeeStructure: async (id: number, data: UpdateFeeStructureDto): Promise<FeeStructure> => {
    const response = await apiRequest<BackendFeeStructure>(`/fee-structures/${id}`, {
      method: 'PATCH',
      data,
    });
    return mapFromBackend(response);
  },

  deleteFeeStructure: async (id: number): Promise<void> => {
    await apiRequest<void>(`/fee-structures/${id}`, {
      method: 'DELETE',
    });
  },
};

export default feeStructureService;
