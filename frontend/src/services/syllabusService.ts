import { apiRequest } from './api';
import { subjectService } from './subjectService';
import { classService } from './classService';
import { studentService } from './studentService';
import { logger } from '../lib/logger';

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
  status: 'completed' | 'pending' | 'in-progress' | null | undefined;
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

export interface ClassSubjectInfo {
  id: number;
  classId: number;
  subjectId: number;
  academicYearId: number;
  className: string;
  subjectName: string;
}

interface BackendClassSubject {
  id: number;
  class_id: number;
  subject_id: number;
  academic_year_id: number;
  class_name: string;
  subject_name: string;
}

const mapChapterFromBackend = (c: any): ChapterWithStatus => ({
  id: c.id,
  chapterId: c.id,
  chapterName: c.name,
  name: c.name,
  sequenceNumber: c.sequence_number,
  status: c.status === 'in_progress' ? 'in-progress' : (c.status || 'pending'),
  completedDate: c.completed_date,
  completed_by: c.completed_by,
});

const mapCompletionFromBackend = (c: any): SyllabusCompletion => ({
  id: c.id,
  classSubjectId: c.class_subject_id,
  classId: c.class_id,
  className: c.class_name,
  subjectId: c.subject_id,
  subjectName: c.subject_name,
  chapterId: c.chapter_id,
  chapterName: c.chapter_name,
  status: c.status === 'in_progress' ? 'in-progress' : (c.status || 'pending'),
  completedDate: c.completed_date,
  completedBy: c.completed_by,
});

const normalizeStatus = (status: string): string => {
  if (status === 'in-progress') return 'in_progress';
  return status;
};

export const syllabusService = {
  getClassSubjectId: async (classId: number, subjectId: number, academicYearId: number): Promise<number | null> => {
    const response = await apiRequest<BackendClassSubject[]>(`/class-subjects/class/${classId}?academicYearId=${academicYearId}`);
    const classSubject = response.find(cs => cs.subject_id === subjectId);
    return classSubject ? classSubject.id : null;
  },

  getClassSubjectsByClass: async (classId: number, academicYearId: number): Promise<ClassSubjectInfo[]> => {
    const response = await apiRequest<BackendClassSubject[]>(`/class-subjects/class/${classId}?academicYearId=${academicYearId}`);
    return response.map(cs => ({
      id: cs.id,
      classId: cs.class_id,
      subjectId: cs.subject_id,
      academicYearId: cs.academic_year_id,
      className: cs.class_name,
      subjectName: cs.subject_name,
    }));
  },

  getClassSubjectByClassAndSubject: async (classId: number, subjectId: number, academicYearId: number): Promise<ClassSubjectInfo | null> => {
    const response = await apiRequest<BackendClassSubject[]>(`/class-subjects/class/${classId}?academicYearId=${academicYearId}`);
    const found = response.find(cs => cs.subject_id === subjectId);
    if (!found) return null;
    return {
      id: found.id,
      classId: found.class_id,
      subjectId: found.subject_id,
      academicYearId: found.academic_year_id,
      className: found.class_name,
      subjectName: found.subject_name,
    };
  },

  markCompletion: async (data: MarkCompletionDto): Promise<SyllabusCompletion> => {
    return apiRequest<SyllabusCompletion>('/syllabus-completion', {
      method: 'POST',
      data: {
        classSubjectId: data.classSubjectId,
        chapters: [{
          chapterId: data.chapterId,
          status: normalizeStatus(data.status),
        }],
      },
    });
  },

  markBulkCompletion: async (data: MarkCompletionDto[]): Promise<void> => {
    const groupedByClassSubject = data.reduce((acc, item) => {
      const key = item.classSubjectId;
      if (!acc[key]) acc[key] = [];
      acc[key].push({ chapterId: item.chapterId, status: normalizeStatus(item.status) });
      return acc;
    }, {} as Record<number, { chapterId: number; status: string }[]>);

    for (const [classSubjectId, chapters] of Object.entries(groupedByClassSubject)) {
      await apiRequest('/syllabus-completion', {
        method: 'POST',
        data: { classSubjectId: parseInt(classSubjectId), chapters },
      });
    }
  },

  getCompletion: async (classId?: number, subjectId?: number, classSubjectId?: number): Promise<SyllabusCompletion[]> => {
    const queryParams = new URLSearchParams();
    if (classId) queryParams.append('classId', String(classId));
    if (subjectId) queryParams.append('subjectId', String(subjectId));
    if (classSubjectId) queryParams.append('classSubjectId', String(classSubjectId));
    
    const queryString = queryParams.toString();
    // console.log('[API] getCompletion - calling API with params:', queryString);
    const response = await apiRequest<any[]>(`/syllabus-completion${queryString ? `?${queryString}` : ''}`);
    // console.log('[API] getCompletion - response:', response);
    return response.map(mapCompletionFromBackend);
  },

  // NEW: Get chapters with status using classId + subjectId directly (no classSubjectId needed)
  getChaptersWithStatusDirect: async (
    classId: number, 
    subjectId: number, 
    _academicYearId: number
  ): Promise<ChapterWithStatus[]> => {
    // console.log('[API] getChaptersWithStatusDirect called:', { classId, subjectId, academicYearId });
    
    // 1. Get all chapters for this subject
    const chapters = await syllabusService.getChaptersBySubject(subjectId);
    // console.log('[API] getChaptersBySubject returned:', chapters.length, 'chapters');
    
    // 2. Get completions using classId + subjectId filters (no classSubjectId needed!)
    const completions = await syllabusService.getCompletion(classId, subjectId, undefined);
    // console.log('[API] getCompletion returned:', completions.length, 'completions');
    
    // 3. Combine - map completion status to each chapter
    const chaptersWithStatus = chapters.map(chapter => {
      const completion = completions.find(c => c.chapterId === chapter.chapterId);
      const status: 'completed' | 'pending' | 'in-progress' = completion?.status || 'pending';
      return {
        ...chapter,
        status,
        completedDate: completion?.completedDate,
      };
    });
    
    // console.log('[API] getChaptersWithStatusDirect result:', chaptersWithStatus);
    return chaptersWithStatus;
  },

  // NEW: Mark completion by finding classSubjectId automatically
  markCompletionDirect: async (
    classId: number, 
    subjectId: number, 
    chapterId: number, 
    status: 'completed' | 'pending' | 'in-progress',
    academicYearId: number
  ): Promise<void> => {
    // console.log('[API] markCompletionDirect called:', { classId, subjectId, chapterId, status, academicYearId });
    
    // Find classSubjectId from the API
    const classSubjects = await syllabusService.getClassSubjectsByClass(classId, academicYearId);
    // console.log('[API] getClassSubjectsByClass returned:', classSubjects);
    
    const classSubject = classSubjects.find(cs => cs.subjectId === subjectId);
    // console.log('[API] Found classSubject:', classSubject);
    
    if (classSubject) {
      await syllabusService.markCompletion({
        classSubjectId: classSubject.id,
        chapterId,
        status,
      });
      // console.log('[API] markCompletion completed successfully');
    } else {
      console.error('[API] Could not find classSubject for classId:', classId, 'subjectId:', subjectId);
      throw new Error('Could not find class subject mapping');
    }
  },

  getCompletionByClassAndSubject: async (classId: number, subjectId: number, academicYearId: number): Promise<SyllabusCompletion[]> => {
    const queryParams = new URLSearchParams();
    queryParams.append('classId', String(classId));
    queryParams.append('subjectId', String(subjectId));
    queryParams.append('academicYearId', String(academicYearId));
    
    const queryString = queryParams.toString();
    const response = await apiRequest<any[]>(`/syllabus-completion?${queryString}`);
    return response.map(mapCompletionFromBackend);
  },

  getClassSubjectProgress: async (classSubjectId: number): Promise<ClassSubjectProgress> => {
    return apiRequest<ClassSubjectProgress>(`/syllabus-completion/class-subject/${classSubjectId}/progress`);
  },

  getClassSubjectChapters: async (classSubjectId: number): Promise<ChapterWithStatus[]> => {
    const response = await apiRequest<any[]>(`/syllabus-completion/class-subject/${classSubjectId}/chapters`);
    return response.map(mapChapterFromBackend);
  },

  getChaptersBySubject: async (subjectId: number): Promise<ChapterWithStatus[]> => {
    const response = await apiRequest<any[]>(`/chapters/subject/${subjectId}`);
    return response.map((c: any): ChapterWithStatus => ({
      id: c.id,
      chapterId: c.id,
      chapterName: c.name,
      name: c.name,
      sequenceNumber: c.sequence_number,
      status: undefined,
      completedDate: undefined,
    }));
  },

  getChaptersWithStatus: async (classSubjectId: number, subjectId: number): Promise<ChapterWithStatus[]> => {
    // console.log('[getChaptersWithStatus] INPUT:', { classSubjectId, subjectId });
    
    // Get all chapters for this subject
    const chapters = await syllabusService.getChaptersBySubject(subjectId);
    // console.log('[getChaptersWithStatus] chapters from API:', chapters);
    
    // Get completion records using classSubjectId filter
    const completions = await syllabusService.getCompletion(undefined, undefined, classSubjectId);
    // console.log('[getChaptersWithStatus] completions from API:', completions);
    
    // Map completion status to chapters
    const chaptersWithStatus = chapters.map(chapter => {
      const completion = completions.find(c => c.chapterId === chapter.chapterId);
      const status: 'completed' | 'pending' | 'in-progress' = completion?.status === 'in-progress' ? 'in-progress' : (completion?.status || 'pending');
      // console.log('[getChaptersWithStatus] mapping chapter:', chapter.chapterId, 'completion:', completion, 'status:', status);
      return {
        ...chapter,
        status,
        completedDate: completion?.completedDate,
      };
    });
    
    // console.log('[getChaptersWithStatus] FINAL RESULT:', chaptersWithStatus);
    return chaptersWithStatus;
  },

  getClassProgress: async (classId: number): Promise<SubjectProgress[]> => {
    return apiRequest<SubjectProgress[]>(`/syllabus-completion/class/${classId}/progress`);
  },

  getStudentProgress: async (studentId: number, academicYearId: number): Promise<{
    studentId: number;
    totalSubjects: number;
    totalChapters: number;
    completedChapters: number;
    overallPercentage: number;
    subjects: SubjectProgress[];
  }> => {
    const studentData = await studentService.getStudentById(studentId);
    const classId = studentData.currentClassId;
    
    if (!classId) {
      return {
        studentId,
        totalSubjects: 0,
        totalChapters: 0,
        completedChapters: 0,
        overallPercentage: 0,
        subjects: [],
      };
    }

    const subjectsProgress = await syllabusService.getClassProgress(classId);
    
    const totalSubjects = subjectsProgress.length;
    const totalChapters = subjectsProgress.reduce((sum, s) => sum + s.totalChapters, 0);
    const completedChapters = subjectsProgress.reduce((sum, s) => sum + s.completedChapters, 0);
    const overallPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    return {
      studentId,
      totalSubjects,
      totalChapters,
      completedChapters,
      overallPercentage,
      subjects: subjectsProgress,
    };
  },

  getAllClassesProgress: async (classIds?: number[]): Promise<AllClassesProgress> => {
    const classesData = await classService.getClasses();
    const classesToProcess = classIds 
      ? classesData.filter(c => classIds.includes(Number(c.id)))
      : classesData;

    const classProgressPromises = classesToProcess.map(async (cls) => {
      try {
        return await getClassProgressByIdInternal(Number(cls.id), cls.name, cls.section || undefined);
      } catch (error) {
        logger.warn(`Failed to get progress for class ${cls.name}`, { classId: cls.id, error });
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
    } catch (error) {
      logger.warn(`Failed to get progress for subject ${cs.subjectName}`, { classSubjectId: cs.id, error });
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
