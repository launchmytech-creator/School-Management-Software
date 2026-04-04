// Query hooks — use these in page components instead of manual useState + useEffect + useCallback
export { useClasses, useClassById } from './useClasses';
export { useStudents, useAllStudents, useStudentById } from './useStudents';
export { useTeachers, useTeacherById, useTeacherAllocations, useAllAllocations } from './useTeachers';
export { useSubjects, useSubjectsByClass } from './useSubjects';
export { useFeeTransactions, useStudentFees, useFeeDefaulters } from './useFeeTransactions';
export { useFeeStructuresGrouped, useFeeStructures } from './useFeeStructures';
export { useAttendance, useClassAttendance } from './useAttendance';
export { useAdminDashboard, useAccountantDashboard, useTeacherDashboard, useParentDashboard } from './useDashboard';
export { useParentChildren } from './useParentChildren';
