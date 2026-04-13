import { apiRequest } from "./api";

export interface Subject {
  id: number;
  name: string;
  code: string;
}

export interface Chapter {
  id: number;
  subjectId: number;
  subjectName: string;
  name: string;
  sequenceNumber: number;
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

export interface CreateSubjectDto {
  name: string;
  code: string;
}

export interface CreateChapterDto {
  subjectId: number;
  name: string;
  sequenceNumber?: number;
}

export interface AssignSubjectToClassDto {
  classId: number;
  subjectId: number;
  academicYearId: number;
}

export const subjectService = {
  // Subjects
  createSubject: async (data: CreateSubjectDto): Promise<Subject> => {
    return apiRequest<Subject>("/subjects", {
      method: "POST",
      data,
    });
  },

  getSubjects: async (): Promise<Subject[]> => {
    return apiRequest<Subject[]>("/subjects");
  },

  getSubjectById: async (id: number): Promise<Subject> => {
    return apiRequest<Subject>(`/subjects/${id}`);
  },

  updateSubject: async (
    id: number,
    data: Partial<CreateSubjectDto>,
  ): Promise<Subject> => {
    return apiRequest<Subject>(`/subjects/${id}`, {
      method: "PATCH",
      data,
    });
  },

  deleteSubject: async (id: number): Promise<void> => {
    await apiRequest<void>(`/subjects/${id}`, {
      method: "DELETE",
    });
  },

  // Chapters
  createChapter: async (data: CreateChapterDto): Promise<Chapter> => {
    return apiRequest<Chapter>("/chapters", {
      method: "POST",
      data,
    });
  },

  getChaptersBySubject: async (subjectId: number): Promise<Chapter[]> => {
    return apiRequest<Chapter[]>(`/chapters/subject/${subjectId}`);
  },

  getChapterById: async (id: number): Promise<Chapter> => {
    return apiRequest<Chapter>(`/chapters/${id}`);
  },

  updateChapter: async (
    id: number,
    data: Partial<CreateChapterDto>,
  ): Promise<Chapter> => {
    return apiRequest<Chapter>(`/chapters/${id}`, {
      method: "PATCH",
      data,
    });
  },

  deleteChapter: async (id: number): Promise<void> => {
    await apiRequest<void>(`/chapters/${id}`, {
      method: "DELETE",
    });
  },

  assignSubjectToClass: async (
    data: AssignSubjectToClassDto,
  ): Promise<ClassSubject> => {
    const raw = await apiRequest<any>("/class-subjects", {
      method: "POST",
      data,
    });
    return {
      id: raw.id,
      classId: raw.class_id,
      className: raw.class_name ?? raw.className ?? "",
      subjectId: raw.subject_id,
      subjectName: raw.subject_name ?? raw.subjectName ?? "",
      academicYearId: raw.academic_year_id,
      academicYearName: raw.year_name ?? raw.academicYearName ?? "",
    };
  },

  getSubjectsByClass: async (classId: number): Promise<ClassSubject[]> => {
    const raw = await apiRequest<any[]>(`/class-subjects/class/${classId}`);
    // console.log('API Response for getSubjectsByClass:', raw);
    return raw.map((r) => ({
      id: r.id,
      classId: r.class_id,
      className: r.class_name ?? r.className ?? "",
      subjectId: r.subject_id,
      subjectName: r.subject_name ?? r.subjectName ?? "",
      academicYearId: r.academic_year_id,
      academicYearName: r.year_name ?? r.academicYearName ?? "",
    }));
  },

  getAllClassSubjects: async (academicYearId: number): Promise<ClassSubject[]> => {
    const raw = await apiRequest<any[]>(`/class-subjects?academicYearId=${academicYearId}`);
    // console.log('API Response for getAllClassSubjects:', raw);
    return raw.map((r) => ({
      id: r.id,
      classId: r.class_id,
      className: r.class?.name ?? r.class_name ?? r.className ?? "",
      subjectId: r.subject_id,
      subjectName: r.subject?.name ?? r.subject_name ?? r.subjectName ?? "",
      academicYearId: r.academic_year_id,
      academicYearName: r.academic_year?.year_name ?? r.year_name ?? r.yearName ?? "",
    }));
  },

  getClassesBySubject: async (subjectId: number): Promise<ClassSubject[]> => {
    const raw = await apiRequest<any[]>(`/class-subjects/subject/${subjectId}`);
    return raw.map((r) => ({
      id: r.id,
      classId: r.class_id,
      className: r.class_name ?? r.className ?? "",
      subjectId: r.subject_id,
      subjectName: r.subject_name ?? r.subjectName ?? "",
      academicYearId: r.academic_year_id,
      academicYearName: r.year_name ?? r.academicYearName ?? "",
    }));
  },

  removeSubjectFromClass: async (id: number): Promise<void> => {
    await apiRequest<void>(`/class-subjects/${id}`, {
      method: "DELETE",
    });
  },

  getSubjectCode: async (subjectId: number): Promise<string> => {
    try {
      const subject = await apiRequest<Subject>(`/subjects/${subjectId}`);
      return subject.code;
    } catch {
      return '';
    }
  },

  assignSubjectToMultipleClasses: async (
    classIds: number[],
    subjectId: number,
    academicYearId: number
  ): Promise<ClassSubject[]> => {
    const raw = await apiRequest<any[]>("/class-subjects/assign-multiple", {
      method: "POST",
      data: { classIds, subjectId, academicYearId },
    });
    return raw.map((r) => ({
      id: r.id,
      classId: r.class_id,
      className: r.class_name ?? "",
      subjectId: r.subject_id,
      subjectName: r.subject_name ?? "",
      academicYearId: r.academic_year_id,
      academicYearName: r.year_name ?? "",
    }));
  },

  checkExistingAssignments: async (
    classIds: number[],
    academicYearId: number
  ): Promise<ClassSubject[]> => {
    const raw = await apiRequest<any[]>(
      `/class-subjects/check-existing?classIds=${classIds.join(",")}&academicYearId=${academicYearId}`
    );
    return raw.map((r) => ({
      id: r.id,
      classId: r.class_id,
      className: r.class_name ?? r.class?.name ?? "",
      subjectId: r.subject_id,
      subjectName: r.subject_name ?? r.subject?.name ?? "",
      academicYearId: r.academic_year_id,
      academicYearName: r.year_name ?? "",
    }));
  },
};

export default subjectService;
