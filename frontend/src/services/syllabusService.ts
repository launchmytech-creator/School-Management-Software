import { apiRequest } from './api';

export interface SyllabusCompletion {
  id: number;
  classSubjectId: number;
  classId: number;
  className: string;
  subjectId: number;
  subjectName: string;
  chapterId: number;
  chapterName: string;
  status: 'completed' | 'pending' | 'in-progress';
  completedDate?: string;
  completedBy?: number;
}

export interface ChapterWithStatus {
  chapterId: number;
  chapterName: string;
  sequenceNumber: number;
  status: 'completed' | 'pending' | 'in-progress';
  completedDate?: string;
}

export interface SubjectProgress {
  subjectId: number;
  subjectName: string;
  totalChapters: number;
  completedChapters: number;
  progressPercentage: number;
}

export interface ClassSubjectProgress {
  classId: number;
  className: string;
  subjectId: number;
  subjectName: string;
  totalChapters: number;
  completedChapters: number;
  progressPercentage: number;
  chapters: ChapterWithStatus[];
}

export interface MarkCompletionDto {
  classSubjectId: number;
  chapterId: number;
  status: 'completed' | 'pending' | 'in-progress';
}

export const syllabusService = {
  markCompletion: async (data: MarkCompletionDto): Promise<SyllabusCompletion> => {
    return apiRequest<SyllabusCompletion>('/syllabus-completion', {
      method: 'POST',
      data,
    });
  },

  markBulkCompletion: async (data: MarkCompletionDto[]): Promise<void> => {
    await apiRequest<void>('/syllabus-completion/bulk', {
      method: 'POST',
      data,
    });
  },

  getCompletion: async (classId?: number, subjectId?: number): Promise<SyllabusCompletion[]> => {
    const queryParams = new URLSearchParams();
    if (classId) queryParams.append('classId', String(classId));
    if (subjectId) queryParams.append('subjectId', String(subjectId));
    
    const queryString = queryParams.toString();
    return apiRequest<SyllabusCompletion[]>(`/syllabus-completion${queryString ? `?${queryString}` : ''}`);
  },

  getClassSubjectProgress: async (classSubjectId: number): Promise<ClassSubjectProgress> => {
    return apiRequest<ClassSubjectProgress>(`/syllabus-completion/class-subject/${classSubjectId}/progress`);
  },

  getClassSubjectChapters: async (classSubjectId: number): Promise<ChapterWithStatus[]> => {
    return apiRequest<ChapterWithStatus[]>(`/syllabus-completion/class-subject/${classSubjectId}/chapters`);
  },

  getClassProgress: async (classId: number): Promise<SubjectProgress[]> => {
    return apiRequest<SubjectProgress[]>(`/syllabus-completion/class/${classId}/progress`);
  },

  deleteCompletion: async (id: number): Promise<void> => {
    await apiRequest<void>(`/syllabus-completion/${id}`, {
      method: 'DELETE',
    });
  },
};

export default syllabusService;
