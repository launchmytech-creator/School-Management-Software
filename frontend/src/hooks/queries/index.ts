// Query hooks — use these in page components instead of manual useState + useEffect + useCallback
export { useAcademicYears, useCurrentAcademicYear, useAcademicYearById, useRefreshAcademicYears } from './useAcademicYears';
export { useClasses, useClassById } from './useClasses';
export { useStudents, useAllStudents, useStudentById } from './useStudents';
export { useTeachers, useTeacherById, useTeacherAllocations, useAllAllocations } from './useTeachers';
export { useSubjects, useSubjectsByClass } from './useSubjects';
export { useFeeTransactions, useStudentFees, useFeeDefaulters } from './useFeeTransactions';
export { useFeeStructuresGrouped, useFeeStructures } from './useFeeStructures';
export { useAttendance, useClassAttendance } from './useAttendance';
export { useAdminDashboard, useAccountantDashboard, useTeacherDashboard, useParentDashboard } from './useDashboard';
export { useParentChildren } from './useParentChildren';
export { useAssignments, useAssignmentById, useCreateAssignment, useUpdateAssignment, useDeleteAssignment, useAssignmentSubmissions, useGradeSubmission } from './useAssignments';
export { useSchools, useSchoolById, useSchoolStats, useRecentSchools, useCreateSchool, useUpdateSchool, useToggleSchoolStatus } from './useSchools';
export { useClassProgress, useSubjectChapters } from './useSyllabus';
