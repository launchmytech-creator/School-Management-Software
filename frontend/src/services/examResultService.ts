import { apiRequest } from './api';
import type { PaginatedResponse } from '../types/common';

export interface ExamResult {
  id: number;
  examId: number;
  studentId: number;
  studentName: string;
  admissionNumber: string;
  rollNumber: number | null;
  subjectId?: number;
  maxMarks: number;
  examDate: string;
  subjectName: string;
  subjectCode: string;
  examName: string;
  examType: string;
  className: string;
  classSection: string | null;
  marksObtained: number;
  grade: string;
  isAbsent: boolean;
  enteredByName: string;
  academicYearName?: string;
}

export interface ExamSubjectResult {
  id: number;
  studentId: number;
  studentName: string;
  admissionNumber: string;
  rollNumber: number | null;
  maxMarks: number;
  marksObtained: number;
  grade: string;
  isAbsent: boolean;
}

export interface ClassPerformance {
  subjectName: string;
  subjectCode: string;
  maxMarks: number;
  totalStudents: number;
  studentsAppeared: number;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
}

export interface StudentResult {
  id: number;
  maxMarks: number;
  examDate: string;
  subjectName: string;
  subjectCode: string;
  examName: string;
  examType: string;
  startDate: string;
  academicYearName: string;
  marksObtained: number;
  grade: string;
  isAbsent: boolean;
}

export interface EnterMarksDto {
  examSubjectId: number;
  results: Array<{
    studentId: number;
    marksObtained?: number;
    grade?: string;
    isAbsent?: boolean;
  }>;
}

export interface ClassComparisonSummary {
  classId: number;
  className: string;
  totalStudents: number;
  averageMarks: number;
  passRate: number;
}

export interface ClassSubjectComparisonClass {
  classId: number;
  className: string;
  averageMarks: number;
  passRate: number;
  totalStudents: number;
  passedStudents: number;
}

export interface ClassSubjectComparisonSubject {
  subjectId: number;
  subjectName: string;
  classes: ClassSubjectComparisonClass[];
}

export interface ClassSubjectComparisonData {
  subjects: ClassSubjectComparisonSubject[];
}

export interface ExamComparisonResult {
  classId: number;
  className: string;
  averageMarks: number;
  totalStudents: number;
  passed: number;
}

export interface ExamComparison {
  examId: number;
  examName: string;
  examDate: string;
  examType: string;
  results: ExamComparisonResult[];
}

export interface SubjectComparison {
  subjectId: number;
  subjectName: string;
  results: {
    classId: number;
    className: string;
    averageMarks: number;
    totalStudents: number;
  }[];
}

export interface ClassComparisonData {
  summary: ClassComparisonSummary[];
  exams: ExamComparison[];
  subjects: SubjectComparison[];
  trend: Array<{
    examId: number;
    examName: string;
    examDate: string;
    examType: string;
    [key: string]: number | string;
  }>;
}

interface BackendExamResult {
  id: number;
  exam_id: number;
  student_id: number;
  student_name: string;
  admission_number: string;
  roll_number: number | null;
  subject_id?: number;
  max_marks: number;
  exam_date: string;
  subject_name: string;
  subject_code: string;
  exam_name: string;
  exam_type: string;
  class_name: string;
  class_section: string | null;
  marks_obtained: number;
  grade: string;
  is_absent: boolean;
  entered_by_name: string;
  academic_year_name?: string;
}

interface BackendExamSubjectResult {
  id: number;
  student_id: number;
  student_name: string;
  admission_number: string;
  roll_number: number | null;
  max_marks: number;
  marks_obtained: number;
  grade: string;
  is_absent: boolean;
}

interface BackendClassPerformance {
  subject_name: string;
  subject_code: string;
  max_marks: number;
  total_students: number;
  students_appeared: number;
  average_marks: number;
  highest_marks: number;
  lowest_marks: number;
}

interface BackendStudentResult {
  id: number;
  max_marks: number;
  exam_date: string;
  subject_name: string;
  subject_code: string;
  exam_name: string;
  exam_type: string;
  start_date: string;
  academic_year_name: string;
  marks_obtained: number;
  grade: string;
  is_absent: boolean;
}

const mapExamResult = (data: BackendExamResult): ExamResult => ({
  id: data.id,
  examId: data.exam_id,
  studentId: data.student_id,
  studentName: data.student_name,
  admissionNumber: data.admission_number,
  rollNumber: data.roll_number,
  subjectId: data.subject_id,
  maxMarks: data.max_marks,
  examDate: data.exam_date,
  subjectName: data.subject_name,
  subjectCode: data.subject_code,
  examName: data.exam_name,
  examType: data.exam_type,
  className: data.class_name,
  classSection: data.class_section,
  marksObtained: data.marks_obtained,
  grade: data.grade,
  isAbsent: data.is_absent,
  enteredByName: data.entered_by_name,
  academicYearName: data.academic_year_name,
});

const mapExamSubjectResult = (data: BackendExamSubjectResult): ExamSubjectResult => ({
  id: data.id,
  studentId: data.student_id,
  studentName: data.student_name,
  admissionNumber: data.admission_number,
  rollNumber: data.roll_number,
  maxMarks: data.max_marks,
  marksObtained: data.marks_obtained,
  grade: data.grade,
  isAbsent: data.is_absent,
});

const mapClassPerformance = (data: BackendClassPerformance): ClassPerformance => ({
  subjectName: data.subject_name,
  subjectCode: data.subject_code,
  maxMarks: data.max_marks,
  totalStudents: Number(data.total_students) || 0,
  studentsAppeared: Number(data.students_appeared) || 0,
  averageMarks: Number(data.average_marks) || 0,
  highestMarks: Number(data.highest_marks) || 0,
  lowestMarks: Number(data.lowest_marks) || 0,
});

const mapStudentResult = (data: BackendStudentResult): StudentResult => ({
  id: data.id,
  maxMarks: data.max_marks,
  examDate: data.exam_date,
  subjectName: data.subject_name,
  subjectCode: data.subject_code,
  examName: data.exam_name,
  examType: data.exam_type,
  startDate: data.start_date,
  academicYearName: data.academic_year_name,
  marksObtained: data.marks_obtained,
  grade: data.grade,
  isAbsent: data.is_absent,
});

export const examResultService = {
  getResults: async (filters?: {
    studentId?: number;
    examId?: number;
    classId?: number;
    subjectId?: number;
    academicYearId?: number;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ExamResult>> => {
    const params = new URLSearchParams();
    if (filters?.studentId) params.append('studentId', String(filters.studentId));
    if (filters?.examId) params.append('examId', String(filters.examId));
    if (filters?.classId) params.append('classId', String(filters.classId));
    if (filters?.subjectId) params.append('subjectId', String(filters.subjectId));
    if (filters?.academicYearId) params.append('academicYearId', String(filters.academicYearId));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    
    const queryString = params.toString();
    const response = await apiRequest<{ data: BackendExamResult[]; pagination: { page: number; limit: number; total: number; totalPages: number } | null }>(`/exam-results${queryString ? `?${queryString}` : ''}`);
    return {
      data: response.data.map(mapExamResult),
      pagination: response.pagination,
    };
  },

  getStudentResults: async (
    studentId: number,
    filters?: {
      academicYearId?: number;
      examType?: string;
    }
  ): Promise<StudentResult[]> => {
    const params = new URLSearchParams();
    if (filters?.academicYearId) params.append('academicYearId', String(filters.academicYearId));
    if (filters?.examType) params.append('examType', filters.examType);
    
    const queryString = params.toString();
    const response = await apiRequest<BackendStudentResult[]>(
      `/exam-results/student/${studentId}${queryString ? `?${queryString}` : ''}`
    );
    return response.map(mapStudentResult);
  },

  getExamSubjectResults: async (examSubjectId: number): Promise<ExamSubjectResult[]> => {
    const response = await apiRequest<BackendExamSubjectResult[]>(
      `/exam-results/exam-subject/${examSubjectId}`
    );
    return response.map(mapExamSubjectResult);
  },

  getClassPerformance: async (examId: number, academicYearId?: number): Promise<ClassPerformance[]> => {
    const params = new URLSearchParams();
    if (academicYearId) params.append('academicYearId', String(academicYearId));
    const queryString = params.toString();
    const response = await apiRequest<BackendClassPerformance[]>(
      `/exam-results/exam/${examId}/performance${queryString ? `?${queryString}` : ''}`
    );
    return response.map(mapClassPerformance);
  },

  enterMarks: async (data: EnterMarksDto): Promise<ExamSubjectResult[]> => {
    const backendData = {
      examSubjectId: data.examSubjectId,
      results: data.results.map(r => ({
        studentId: r.studentId,
        marksObtained: r.marksObtained,
        grade: r.grade,
        isAbsent: r.isAbsent,
      })),
    };
    const response = await apiRequest<BackendExamSubjectResult[]>('/exam-results', {
      method: 'POST',
      data: backendData,
    });
    return response.map(mapExamSubjectResult);
  },

  deleteResult: async (id: number): Promise<void> => {
    await apiRequest<void>(`/exam-results/${id}`, {
      method: 'DELETE',
    });
  },

  getClassComparison: async (
    classIds: number[],
    academicYearId?: number,
    examType?: string
  ): Promise<ClassComparisonData> => {
    const params = new URLSearchParams();
    params.append('classIds', classIds.join(','));
    if (academicYearId) params.append('academicYearId', String(academicYearId));
    if (examType) params.append('examType', examType);
    
    const response = await apiRequest<ClassComparisonData>(
      `/exam-results/comparison?${params.toString()}`
    );
    return response;
  },

  getClassesForComparison: async (
    className: string,
    academicYearId?: number
  ): Promise<{ id: number; name: string; section: string | null }[]> => {
    const params = new URLSearchParams();
    params.append('className', className);
    if (academicYearId) params.append('academicYearId', String(academicYearId));
    
    const response = await apiRequest<{ id: number; name: string; section: string | null }[]>(
      `/exam-results/comparison/classes?${params.toString()}`
    );
    return response;
  },

  getClassSubjectComparison: async (
    classIds: number[],
    academicYearId?: number
  ): Promise<ClassSubjectComparisonData> => {
    const params = new URLSearchParams();
    params.append('classIds', classIds.join(','));
    if (academicYearId) params.append('academicYearId', String(academicYearId));
    
    const response = await apiRequest<ClassSubjectComparisonData>(
      `/exam-results/comparison/subjects?${params.toString()}`
    );
    return response;
  },
};

export default examResultService;
