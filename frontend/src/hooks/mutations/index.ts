// Mutation hooks — use these for create/update/delete operations
// Each hook handles cache invalidation automatically
export { useRecordPayment, useApplyWaiver, useGenerateFeeTransactions } from './useFeeMutations';
export { useCreateStudent, useUpdateStudent, useDeleteStudent, useActivateStudent, useDeactivateStudent } from './useStudentMutations';
export { useCreateClass, useUpdateClass, useDeleteClass } from './useClassMutations';
export { useCreateSubject, useAssignSubjectToClasses, useRemoveSubjectFromClass, useCreateChapter, useDeleteChapter, useBulkUpdateChapterStatus, useUpdateChapterStatus } from './useSubjectMutations';
