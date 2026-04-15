import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectService, type CreateSubjectDto, type CreateChapterDto } from '../../services/subjectService';
import { syllabusService } from '../../services/syllabusService';

export const useCreateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubjectDto) => subjectService.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
};

export const useAssignSubjectToClasses = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classIds, subjectId, academicYearId }: {
      classIds: number[];
      subjectId: number;
      academicYearId: number;
    }) => subjectService.assignSubjectToMultipleClasses(classIds, subjectId, academicYearId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-subjects'] });
    },
  });
};

export const useRemoveSubjectFromClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classSubjectId: number) => subjectService.removeSubjectFromClass(classSubjectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-subjects'] });
    },
  });
};

export const useCreateChapter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChapterDto) => subjectService.createChapter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
    },
  });
};

export const useDeleteChapter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chapterId: number) => subjectService.deleteChapter(chapterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
    },
  });
};

export const useBulkUpdateChapterStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classId, subjectId, chapterIds, status, academicYearId }: {
      classId: number;
      subjectId: number;
      chapterIds: number[];
      status: 'pending' | 'in-progress' | 'completed';
      academicYearId: number;
    }) => {
      const promises = chapterIds.map(chapterId =>
        syllabusService.markCompletionDirect(classId, subjectId, chapterId, status, academicYearId)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syllabus'] });
    },
  });
};

export const useUpdateChapterStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classId, subjectId, chapterId, status, academicYearId }: {
      classId: number;
      subjectId: number;
      chapterId: number;
      status: 'pending' | 'in-progress' | 'completed';
      academicYearId: number;
    }) => syllabusService.markCompletionDirect(classId, subjectId, chapterId, status, academicYearId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syllabus'] });
    },
  });
};
