// Query hooks — use these in page components instead of manual useState + useEffect + useCallback
export { useAcademicYears, useCurrentAcademicYear, useAcademicYearById, useRefreshAcademicYears } from './useAcademicYears';
export { useClasses, useClassById, useClassesByIncharge } from './useClasses';
export { useStudents, useAllStudents, useStudentById } from './useStudents';
export { useTeachers, useTeacherById, useTeacherAllocations, useAllAllocations } from './useTeachers';
export { useSubjects, useSubjectsByClass, useAllClassSubjects, useChapters, useCheckExistingAssignments } from './useSubjects';
export { useFeeTransactions, useStudentFees, useFeeDefaulters } from './useFeeTransactions';
export { useFeeStructuresGrouped, useFeeStructures } from './useFeeStructures';
export { useAttendance, useClassAttendance, useMarkAttendance } from './useAttendance';
export { useAdminDashboard, useAccountantDashboard, useTeacherDashboard, useParentDashboard } from './useDashboard';
export { useParentChildren } from './useParentChildren';
export { useAssignments, useAssignmentById, useCreateAssignment, useUpdateAssignment, useDeleteAssignment, useAssignmentSubmissions, useGradeSubmission } from './useAssignments';
export { useSchools, useSchoolById, useSchoolStats, useRecentSchools, useCreateSchool, useUpdateSchool, useToggleSchoolStatus } from './useSchools';
export { useClassProgress, useSubjectChapters, useAllClassesProgress } from './useSyllabus';

// New hooks for migration
export { useAccountants, useAccountantById } from './useAccountants';
export { useAnnouncements, useAnnouncementById } from './useAnnouncements';
export { useHolidays, useHolidayById, useAcademicCalendar, useWorkingDays } from './useHolidays';
export { useParents, useParentById } from './useParents';
export { useTimetables, useTimetableById } from './useTimetables';
export { useTeacherAttendance, useTeacherAttendanceByDate, useTeacherAttendanceSummary } from './useTeacherAttendance';
export { useStudentResults, useClassComparison, useClassSubjectComparison, useClassesForComparison, useExamResults, useExamResultsPerformance, useExamSubjectResults, useEnterMarks } from './useExamResults';
export { useAvailablePlans } from './useSubscriptionPlans';
export { useStudentHistory } from './useStudentHistory';

// Additional migration hooks
export { useExams, useExamById, useCreateExam, useUpdateExam, useDeleteExam, useAddExamSubject } from './useExams';
export { useTeacherAllocationsForSyllabus, useTeacherSubjectProgress, useSubjectChaptersDirect } from './useTeacherSyllabus';
export { useStudentClass, useParentSubjects, useParentSubjectProgress } from './useParentSyllabus';
export { useParentAttendance, useParentHolidays, useSchoolOpenDays } from './useParentAttendance';
