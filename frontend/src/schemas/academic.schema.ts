import { z } from 'zod';

export const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  targetRole: z.enum(['all', 'teacher', 'accountant', 'parent', 'student']).optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
});

export const holidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required'),
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['public', 'school', 'exam']),
  description: z.string().optional(),
});

export const academicYearSchema = z.object({
  name: z.string().min(1, 'Year name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

export const assignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  classId: z.number().min(1, 'Class is required'),
  subjectId: z.number().min(1, 'Subject is required'),
  dueDate: z.string().min(1, 'Due date is required'),
});

export const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  classId: z.number().min(1, 'Class is required'),
  subjectId: z.number().min(1, 'Subject is required'),
  academicYearId: z.number().min(1, 'Academic year is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  maxMarks: z.number().min(1, 'Max marks is required'),
  assignmentType: z.enum(['homework', 'classwork', 'project', 'quiz', 'test']),
});

export const timetableSchema = z.object({
  classId: z.number().min(1, 'Class is required'),
  subjectId: z.number().min(1, 'Subject is required'),
  dayOfWeek: z.number().min(0).max(6, 'Invalid day'),
  periodNumber: z.number().min(1, 'Period is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  academicYearId: z.number().min(1, 'Academic year is required'),
  room: z.string().optional(),
});

export const createExamSchema = z.object({
  name: z.string().min(1, 'Exam name is required'),
  classId: z.number().min(1, 'Class is required'),
  academicYearId: z.number().min(1, 'Academic year is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  totalMarks: z.number().min(1, 'Total marks is required'),
});

export const editExamSchema = z.object({
  name: z.string().min(1, 'Exam name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  totalMarks: z.number().min(1, 'Total marks is required'),
});

export const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  section: z.string().optional(),
  inchargeId: z.number().optional(),
  defaultFeeAmount: z.number().optional(),
});

export const allocateTeacherSchema = z.object({
  classId: z.number().min(1, 'Class is required'),
  subjectId: z.number().min(1, 'Subject is required'),
  teacherId: z.number().min(1, 'Teacher is required'),
  academicYearId: z.number().min(1, 'Academic year is required'),
});

export type AnnouncementFormData = z.infer<typeof announcementSchema>;
export type HolidayFormData = z.infer<typeof holidaySchema>;
export type AcademicYearFormData = z.infer<typeof academicYearSchema>;
export type AssignmentFormData = z.infer<typeof assignmentSchema>;
export type CreateAssignmentFormData = z.infer<typeof createAssignmentSchema>;
export type TimetableFormData = z.infer<typeof timetableSchema>;
export type CreateExamFormData = z.infer<typeof createExamSchema>;
export type EditExamFormData = z.infer<typeof editExamSchema>;
export type CreateClassFormData = z.infer<typeof createClassSchema>;
export type AllocateTeacherFormData = z.infer<typeof allocateTeacherSchema>;
