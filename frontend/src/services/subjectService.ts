import { apiRequest } from './api';

export interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export interface Chapter {
  id: number;
  subjectId: number;
  subjectName: string;
  name: string;
  sequenceNumber: number;
  description?: string;
}

export interface ClassSubject {
  id: number;
  classId: number;
  className: string;
  subjectId: number;
  subjectName: string;
  academicYearId: number;
  academicYearName: string;
}

interface BackendClassSubject {
  id: number;
  school_id: number;
  class_id: number;
  subject_id: number;
  academic_year_id: number;
  max_marks: number | null;
  subject_name: string;
  subject_code: string;
  class_name: string;
  class_section: string | null;
  year_name: string;
}

const mapClassSubjectFromBackend = (data: BackendClassSubject): ClassSubject => ({
  id: data.id,
  classId: data.class_id,
  className: data.class_name,
  subjectId: data.subject_id,
  subjectName: data.subject_name,
  academicYearId: data.academic_year_id,
  academicYearName: data.year_name,
});

export interface CreateSubjectDto {
  name: string;
  code: string;
  description?: string;
}

export interface CreateChapterDto {
  subjectId: number;
  name: string;
  sequenceNumber?: number;
  description?: string;
}

export interface AssignSubjectToClassDto {
  classId: number;
  subjectId: number;
  academicYearId: number;
}

export const subjectService = {
  // Subjects
  createSubject: async (data: CreateSubjectDto): Promise<Subject> => {
    return apiRequest<Subject>('/subjects', {
      method: 'POST',
      data,
    });
  },

  getSubjects: async (): Promise<Subject[]> => {
    return apiRequest<Subject[]>('/subjects');
  },

  getSubjectById: async (id: number): Promise<Subject> => {
    return apiRequest<Subject>(`/subjects/${id}`);
  },

  updateSubject: async (id: number, data: Partial<CreateSubjectDto>): Promise<Subject> => {
    return apiRequest<Subject>(`/subjects/${id}`, {
      method: 'PATCH',
      data,
    });
  },

  deleteSubject: async (id: number): Promise<void> => {
    await apiRequest<void>(`/subjects/${id}`, {
      method: 'DELETE',
    });
  },

  // Chapters
  createChapter: async (data: CreateChapterDto): Promise<Chapter> => {
    return apiRequest<Chapter>('/chapters', {
      method: 'POST',
      data,
    });
  },

  getChaptersBySubject: async (subjectId: number): Promise<Chapter[]> => {
    return apiRequest<Chapter[]>(`/chapters/subject/${subjectId}`);
  },

  getChapterById: async (id: number): Promise<Chapter> => {
    return apiRequest<Chapter>(`/chapters/${id}`);
  },

  updateChapter: async (id: number, data: Partial<CreateChapterDto>): Promise<Chapter> => {
    return apiRequest<Chapter>(`/chapters/${id}`, {
      method: 'PATCH',
      data,
    });
  },

  deleteChapter: async (id: number): Promise<void> => {
    await apiRequest<void>(`/chapters/${id}`, {
      method: 'DELETE',
    });
  },

  // Class Subjects
  assignSubjectToClass: async (data: AssignSubjectToClassDto): Promise<ClassSubject> => {
    const response = await apiRequest<BackendClassSubject>('/class-subjects', {
      method: 'POST',
      data,
    });
    return mapClassSubjectFromBackend(response);
  },

  getSubjectsByClass: async (classId: number, academicYearId?: number): Promise<ClassSubject[]> => {
    let url = `/class-subjects/class/${classId}`;
    if (academicYearId) {
      url += `?academicYearId=${academicYearId}`;
    }
    const data = await apiRequest<BackendClassSubject[]>(url);
    return data.map(mapClassSubjectFromBackend);
  },

  getClassesBySubject: async (subjectId: number, academicYearId?: number): Promise<ClassSubject[]> => {
    let url = `/class-subjects/subject/${subjectId}`;
    if (academicYearId) {
      url += `?academicYearId=${academicYearId}`;
    }
    const data = await apiRequest<BackendClassSubject[]>(url);
    return data.map(mapClassSubjectFromBackend);
  },

  removeSubjectFromClass: async (id: number): Promise<void> => {
    await apiRequest<void>(`/class-subjects/${id}`, {
      method: 'DELETE',
    });
  },
};

export default subjectService;
