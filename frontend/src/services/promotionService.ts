import { apiRequest } from './api';

interface BackendPromotion {
  id: number;
  student_id?: number;
  from_class_id: number;
  to_class_id: number;
  from_academic_year_id: number;
  to_academic_year_id: number;
  promotion_date: string;
  promoted_by: number;
  student_name: string;
  admission_number: string;
  roll_number?: string;
  from_class_name: string;
  from_class_section?: string;
  to_class_name: string;
  to_class_section?: string;
  from_academic_year: string;
  to_academic_year: string;
  promoted_by_name: string;
}

export interface Promotion {
  id: number;
  studentId: number;
  studentName: string;
  admissionNumber: string;
  rollNumber?: string;
  fromClassId: number;
  fromClassName: string;
  fromClassSection?: string;
  toClassId: number;
  toClassName: string;
  toClassSection?: string;
  fromAcademicYearId: number;
  fromAcademicYearName: string;
  toAcademicYearId: number;
  toAcademicYearName: string;
  promotedAt: string;
  promotedBy: number;
  promotedByName: string;
}

const mapFromBackend = (data: BackendPromotion): Promotion => ({
  id: data.id,
  studentId: data.student_id || 0,
  studentName: data.student_name || '',
  admissionNumber: data.admission_number || '',
  rollNumber: data.roll_number,
  fromClassId: data.from_class_id,
  fromClassName: data.from_class_name || '',
  fromClassSection: data.from_class_section,
  toClassId: data.to_class_id,
  toClassName: data.to_class_name || '',
  toClassSection: data.to_class_section,
  fromAcademicYearId: data.from_academic_year_id,
  fromAcademicYearName: data.from_academic_year || '',
  toAcademicYearId: data.to_academic_year_id,
  toAcademicYearName: data.to_academic_year || '',
  promotedAt: data.promotion_date || '',
  promotedBy: data.promoted_by || 0,
  promotedByName: data.promoted_by_name || '',
});

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
  toClassId: number | string;
  toAcademicYearId: number | string;
  toSection?: string;
}

export interface PromotionGroup {
  key: string;
  fromClassName: string;
  fromClassSection?: string;
  toClassName: string;
  toClassSection?: string;
  fromAcademicYear: string;
  toAcademicYear: string;
  promotionDate: string;
  promotedByName: string;
  students: Promotion[];
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
    fromClassId?: number;
    toClassId?: number;
    academicYearId?: number;
  } = {}): Promise<Promotion[]> => {
    const queryParams = new URLSearchParams();
    if (params.fromClassId) queryParams.append('fromClassId', String(params.fromClassId));
    if (params.toClassId) queryParams.append('toClassId', String(params.toClassId));
    if (params.academicYearId) queryParams.append('academicYearId', String(params.academicYearId));
    
    const queryString = queryParams.toString();
    const response = await apiRequest<BackendPromotion[]>(`/student-promotions${queryString ? `?${queryString}` : ''}`);
    return response.map(mapFromBackend);
  },

  getStudentPromotionHistory: async (studentId: number): Promise<Promotion[]> => {
    const response = await apiRequest<BackendPromotion[]>(`/student-promotions/student/${studentId}/history`);
    return response.map(mapFromBackend);
  },

  getEligibleStudents: async (classId: string | number, toClassId: string | number): Promise<EligibleStudent[]> => {
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
