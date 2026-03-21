import { apiRequest } from './api';
import { subjectService } from './subjectService';
import { classService } from './classService';

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
  id?: number;
  chapterId: number;
  chapterName: string;
  name?: string;
  sequenceNumber: number;
  status: 'completed' | 'pending' | 'in-progress' | null;
  completedDate?: string;
  completed_by?: number;
}

export interface SubjectProgress {
  classSubjectId: number;
  subjectId: number;
  subjectName: string;
  totalChapters: number;
  completedChapters: number;
  inProgressChapters: number;
  pendingChapters: number;
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

export interface ClassProgress {
  classId: number;
  className: string;
  classSection?: string;
  totalSubjects: number;
  totalChapters: number;
  completedChapters: number;
  overallPercentage: number;
  subjects: SubjectProgress[];
}

export interface AllClassesProgress {
  classes: ClassProgress[];
  schoolOverallPercentage: number;
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

  getAllClassesProgress: async (classIds?: number[]): Promise<AllClassesProgress> => {
    const classesData = await classService.getClasses();
    const classesToProcess = classIds 
      ? classesData.filter(c => classIds.includes(Number(c.id)))
      : classesData;

    const classProgressPromises = classesToProcess.map(async (cls) => {
      try {
        return await getClassProgressByIdInternal(Number(cls.id), cls.name, cls.section || undefined);
      } catch {
        return null;
      }
    });

    const classProgressResults = await Promise.all(classProgressPromises);
    const validClassProgress = classProgressResults.filter((p): p is ClassProgress => p !== null);

    const totalChapters = validClassProgress.reduce((sum, c) => sum + c.totalChapters, 0);
    const totalCompleted = validClassProgress.reduce((sum, c) => sum + c.completedChapters, 0);
    const schoolOverallPercentage = totalChapters > 0 
      ? Math.round((totalCompleted / totalChapters) * 100)
      : 0;

    return {
      classes: validClassProgress,
      schoolOverallPercentage,
    };
  },

  deleteCompletion: async (id: number): Promise<void> => {
    await apiRequest<void>(`/syllabus-completion/${id}`, {
      method: 'DELETE',
    });
  },
};

export default syllabusService;

async function getClassProgressByIdInternal(
  classId: number, 
  className: string, 
  classSection?: string
): Promise<ClassProgress> {
  const classSubjects = await subjectService.getSubjectsByClass(classId);
  
  if (classSubjects.length === 0) {
    return {
      classId,
      className,
      classSection,
      totalSubjects: 0,
      totalChapters: 0,
      completedChapters: 0,
      overallPercentage: 0,
      subjects: [],
    };
  }

  const subjectProgressPromises = classSubjects.map(async (cs) => {
    try {
      const progress = await getClassSubjectProgressInternal(cs.id, cs.subjectId, cs.subjectName);
      return progress;
    } catch {
      return null;
    }
  });

  const subjectProgressResults = await Promise.all(subjectProgressPromises);
  const validSubjectProgress = subjectProgressResults.filter((p): p is SubjectProgress => p !== null);

  const totalChapters = validSubjectProgress.reduce((sum, s) => sum + s.totalChapters, 0);
  const completedChapters = validSubjectProgress.reduce((sum, s) => sum + s.completedChapters, 0);
  const overallPercentage = totalChapters > 0 
    ? Math.round((completedChapters / totalChapters) * 100)
    : 0;

  return {
    classId,
    className,
    classSection,
    totalSubjects: validSubjectProgress.length,
    totalChapters,
    completedChapters,
    overallPercentage,
    subjects: validSubjectProgress,
  };
}

async function getClassSubjectProgressInternal(
  classSubjectId: number,
  subjectId: number,
  subjectName: string
): Promise<SubjectProgress> {
  const chapters = await apiRequest<{
    total_chapters: string;
    completed_chapters: string;
    in_progress_chapters: string;
    pending_chapters: string;
    completion_percentage: string;
  }>(`/syllabus-completion/class-subject/${classSubjectId}/progress`);

  const totalChapters = parseInt(chapters.total_chapters, 10) || 0;
  const completedChapters = parseInt(chapters.completed_chapters, 10) || 0;
  const inProgressChapters = parseInt(chapters.in_progress_chapters, 10) || 0;
  const pendingChapters = parseInt(chapters.pending_chapters, 10) || 0;
  const progressPercentage = parseFloat(chapters.completion_percentage) || 0;

  return {
    classSubjectId,
    subjectId,
    subjectName,
    totalChapters,
    completedChapters,
    inProgressChapters,
    pendingChapters,
    progressPercentage,
  };
}
