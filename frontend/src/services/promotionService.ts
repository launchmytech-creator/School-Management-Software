import { apiRequest } from './api';

export interface Promotion {
  id: number;
  studentId: number;
  studentName: string;
  admissionNumber: string;
  fromClassId: number;
  fromClassName: string;
  toClassId: number;
  toClassName: string;
  fromAcademicYearId: number;
  fromAcademicYearName: string;
  toAcademicYearId: number;
  toAcademicYearName: string;
  promotedAt: string;
  promotedBy: number;
}

export interface EligibleStudent {
  studentId: number;
  studentName: string;
  admissionNumber: string;
  currentClassId: number;
  currentClassName: string;
  currentSection: string;
}

export interface PromoteStudentsDto {
  studentIds: number[];
  toClassId: number;
  toAcademicYearId: number;
  toSection?: string;
}

export const promotionService = {
  promoteStudents: async (data: PromoteStudentsDto): Promise<Promotion[]> => {
    const response = await apiRequest<Promotion[]>('/student-promotions', {
      method: 'POST',
      data,
    });
    return response;
  },

  getPromotions: async (params: {
    classId?: number;
    academicYearId?: number;
  } = {}): Promise<Promotion[]> => {
    const queryParams = new URLSearchParams();
    if (params.classId) queryParams.append('classId', String(params.classId));
    if (params.academicYearId) queryParams.append('academicYearId', String(params.academicYearId));
    
    const queryString = queryParams.toString();
    return apiRequest<Promotion[]>(`/student-promotions${queryString ? `?${queryString}` : ''}`);
  },

  getStudentPromotionHistory: async (studentId: number): Promise<Promotion[]> => {
    return apiRequest<Promotion[]>(`/student-promotions/student/${studentId}/history`);
  },

  getEligibleStudents: async (classId: number, toClassId: number): Promise<EligibleStudent[]> => {
    return apiRequest<EligibleStudent[]>(`/student-promotions/class/${classId}/eligible-students?toClassId=${toClassId}`);
  },

  getPromotionById: async (id: number): Promise<Promotion> => {
    return apiRequest<Promotion>(`/student-promotions/${id}`);
  },

  deletePromotion: async (id: number): Promise<void> => {
    await apiRequest<void>(`/student-promotions/${id}`, {
      method: 'DELETE',
    });
  },
};

export default promotionService;
