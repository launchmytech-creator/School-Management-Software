import { apiRequest } from './api';

export interface FeeStructure {
  id: number;
  classId: number;
  className: string;
  academicYearId: number;
  academicYearName: string;
  feeType: string;
  amount: number;
  isActive: boolean;
}

export interface FeeTransaction {
  id: number;
  studentId: number;
  studentName: string;
  admissionNumber: string;
  classId: number;
  className: string;
  feeStructureId: number;
  feeType: string;
  amountDue: number;
  amountPaid: number;
  amountPending: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'partial' | 'waived';
  paidDate?: string;
  transactionId?: string;
}

export interface FeeDefaulter {
  studentId: number;
  studentName: string;
  admissionNumber: string;
  className: string;
  parentName: string;
  parentPhone: string;
  totalDue: number;
  pendingTerms: string[];
}

export interface CreateFeeStructureDto {
  classId: number;
  academicYearId: number;
  feeType: string;
  amount: number;
}

export interface RecordPaymentDto {
  amount: number;
  paymentDate?: string;
  paymentMethod?: 'cash' | 'card' | 'online' | 'cheque';
  remarks?: string;
}

export interface ApplyWaiverDto {
  waiverAmount: number;
  reason: string;
}

export const feeService = {
  // Fee Structures
  createFeeStructure: async (data: CreateFeeStructureDto): Promise<FeeStructure> => {
    return apiRequest<FeeStructure>('/fee-structures', {
      method: 'POST',
      data,
    });
  },

  getFeeStructures: async (classId?: number): Promise<FeeStructure[]> => {
    const queryString = classId ? `?classId=${classId}` : '';
    return apiRequest<FeeStructure[]>(`/fee-structures${queryString}`);
  },

  getFeeStructureById: async (id: number): Promise<FeeStructure> => {
    return apiRequest<FeeStructure>(`/fee-structures/${id}`);
  },

  updateFeeStructure: async (id: number, data: Partial<CreateFeeStructureDto>): Promise<FeeStructure> => {
    return apiRequest<FeeStructure>(`/fee-structures/${id}`, {
      method: 'PATCH',
      data,
    });
  },

  deleteFeeStructure: async (id: number): Promise<void> => {
    await apiRequest<void>(`/fee-structures/${id}`, {
      method: 'DELETE',
    });
  },

  // Fee Transactions
  generateFeeTransactions: async (classId: number): Promise<void> => {
    await apiRequest<void>(`/fee-transactions/generate?classId=${classId}`, {
      method: 'POST',
    });
  },

  getFeeTransactions: async (params: {
    classId?: number;
    studentId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<FeeTransaction[]> => {
    const queryParams = new URLSearchParams();
    if (params.classId) queryParams.append('classId', String(params.classId));
    if (params.studentId) queryParams.append('studentId', String(params.studentId));
    if (params.status) queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    const url = `/fee-transactions${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<FeeTransaction[]>(url);
  },

  getFeeDefaulters: async (classId?: number): Promise<FeeDefaulter[]> => {
    const queryString = classId ? `?classId=${classId}` : '';
    return apiRequest<FeeDefaulter[]>(`/fee-transactions/defaulters${queryString}`);
  },

  getStudentFeeTransactions: async (studentId: number): Promise<FeeTransaction[]> => {
    return apiRequest<FeeTransaction[]>(`/fee-transactions/student/${studentId}`);
  },

  recordPayment: async (transactionId: number, data: RecordPaymentDto): Promise<FeeTransaction> => {
    return apiRequest<FeeTransaction>(`/fee-transactions/${transactionId}/payment`, {
      method: 'PATCH',
      data,
    });
  },

  applyWaiver: async (transactionId: number, data: ApplyWaiverDto): Promise<FeeTransaction> => {
    return apiRequest<FeeTransaction>(`/fee-transactions/${transactionId}/waiver`, {
      method: 'PATCH',
      data,
    });
  },

  updateTransaction: async (transactionId: number, data: Partial<FeeTransaction>): Promise<FeeTransaction> => {
    return apiRequest<FeeTransaction>(`/fee-transactions/${transactionId}`, {
      method: 'PATCH',
      data,
    });
  },

  // Fee Analytics
  getFeeSummary: async (classId?: number) => {
    const queryString = classId ? `?classId=${classId}` : '';
    return apiRequest<{
      totalStudents: number;
      totalAmount: number;
      collectedAmount: number;
      pendingAmount: number;
      collectionPercentage: number;
      byStatus: { status: string; count: number; amount: number }[];
    }>(`/fee-transactions/summary${queryString}`);
  },
};

export default feeService;
