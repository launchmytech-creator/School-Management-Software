// Mutation hooks — use these for create/update/delete operations
// Each hook handles cache invalidation automatically
export { useRecordPayment, useApplyWaiver, useGenerateFeeTransactions } from './useFeeMutations';
export { useCreateStudent, useUpdateStudent, useDeleteStudent } from './useStudentMutations';
export { useCreateClass, useUpdateClass, useDeleteClass } from './useClassMutations';
