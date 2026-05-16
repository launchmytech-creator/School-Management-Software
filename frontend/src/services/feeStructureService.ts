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
  feeTerms: number | null;
}

export interface FeeStructureComponent {
  id: number;
  feeType: string;
  annualAmount: number;
}

export interface FeeStructureGroup {
  classId: number;
  academicYearId: number;
  className: string;
  classSection: string | null;
  academicYearName: string;
  feeTerms: number;
  totalAnnualFee: number;
  perTermAmount: number;
  components: FeeStructureComponent[];
}

export interface CreateFeeStructureDto {
  classId: number;
  academicYearId: number;
  feeType: string;
  amount: number;
  feeTerms: number;
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
  amount: string | number;
  fee_terms: number | null;
}

interface BackendFeeStructureGroup {
  class_id: number;
  academic_year_id: number;
  class_name: string;
  class_section: string | null;
  academic_year_name: string;
  fee_terms: number;
  total_annual_fee: string | number;
  per_term_amount: string | number;
  components: Array<{
    id: number;
    fee_type: string;
    annual_amount: string | number;
  }>;
}

interface BackendCreateResponse {
  component: BackendFeeStructure;
  group: BackendFeeStructureGroup;
}

const mapFromBackend = (data: BackendFeeStructure): FeeStructure => ({
  id: data.id,
  classId: data.class_id,
  className: data.class_name,
  classSection: data.class_section,
  academicYearId: data.academic_year_id,
  academicYearName: data.academic_year_name,
  feeType: data.fee_type,
  amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount,
  feeTerms: data.fee_terms,
});

const mapGroupFromBackend = (data: BackendFeeStructureGroup): FeeStructureGroup => ({
  classId: data.class_id,
  academicYearId: data.academic_year_id,
  className: data.class_name,
  classSection: data.class_section,
  academicYearName: data.academic_year_name,
  feeTerms: data.fee_terms ?? 1,
  totalAnnualFee: (typeof data.total_annual_fee === 'string' ? parseFloat(data.total_annual_fee) : data.total_annual_fee) || 0,
  perTermAmount: (typeof data.per_term_amount === 'string' ? parseFloat(data.per_term_amount) : data.per_term_amount) || 0,
  components: (data.components || []).map(c => ({
    id: c.id,
    feeType: c.fee_type,
    annualAmount: typeof c.annual_amount === 'string' ? parseFloat(c.annual_amount) : c.annual_amount,
  })),
});

export interface CreateFeeStructureResponse {
  component: FeeStructure;
  group: FeeStructureGroup;
}

export const feeStructureService = {
  createFeeStructure: async (data: CreateFeeStructureDto): Promise<CreateFeeStructureResponse> => {
    const response = await apiRequest<BackendCreateResponse>('/fee-structures', {
      method: 'POST',
      data: {
        classId: data.classId,
        academicYearId: data.academicYearId,
        feeType: data.feeType,
        amount: data.amount,
        feeTerms: data.feeTerms,
      },
    });
    return {
      component: mapFromBackend(response.component),
      group: mapGroupFromBackend(response.group),
    };
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

  getFeeStructuresGrouped: async (filters?: {
    classId?: number;
    academicYearId?: number;
  }): Promise<FeeStructureGroup[]> => {
    const params = new URLSearchParams();
    if (filters?.classId) params.append('classId', String(filters.classId));
    if (filters?.academicYearId) params.append('academicYearId', String(filters.academicYearId));
    const queryString = params.toString();
    const response = await apiRequest<BackendFeeStructureGroup[]>(
      `/fee-structures/grouped${queryString ? `?${queryString}` : ''}`
    );
    return response.map(mapGroupFromBackend);
  },

  deleteFeeStructureGroup: async (classId: number, academicYearId: number, feeTerms?: number): Promise<{ deleted: number }> => {
    const params = new URLSearchParams({ classId: String(classId), academicYearId: String(academicYearId) });
    if (feeTerms !== undefined) params.append('feeTerms', String(feeTerms));
    const response = await apiRequest<{ deleted: number }>(
      `/fee-structures/group?${params.toString()}`,
      { method: 'DELETE' }
    );
    return response;
  },

  getUniqueFeeTypes: async (): Promise<string[]> => {
    const structures = await feeStructureService.getFeeStructures({});
    const types = structures.map(s => s.feeType);
    const uniqueTypes = [...new Set(types)];
    
    if (uniqueTypes.length === 0) {
      return [
        'Tuition Fee',
        'Transport Fee',
        'Exam Fee',
        'Hostel Fee',
        'Library Fee',
        'Registration Fee',
        'Annual Fee',
        'Lab Fee',
      ];
    }
    
    return uniqueTypes.sort();
  },
};

export default feeStructureService;
