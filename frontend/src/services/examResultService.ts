import { apiRequest } from './api';

export interface ExamResult {
  id: number;
  studentId: number;
  studentName: string;
  admissionNumber: string;
  rollNumber: number | null;
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

interface BackendExamResult {
  id: number;
  student_id: number;
  student_name: string;
  admission_number: string;
  roll_number: number | null;
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
  studentId: data.student_id,
  studentName: data.student_name,
  admissionNumber: data.admission_number,
  rollNumber: data.roll_number,
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
  totalStudents: data.total_students,
  studentsAppeared: data.students_appeared,
  averageMarks: data.average_marks,
  highestMarks: data.highest_marks,
  lowestMarks: data.lowest_marks,
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
  }): Promise<ExamResult[]> => {
    const params = new URLSearchParams();
    if (filters?.studentId) params.append('studentId', String(filters.studentId));
    if (filters?.examId) params.append('examId', String(filters.examId));
    if (filters?.classId) params.append('classId', String(filters.classId));
    if (filters?.subjectId) params.append('subjectId', String(filters.subjectId));
    
    const queryString = params.toString();
    const response = await apiRequest<BackendExamResult[]>(`/exam-results${queryString ? `?${queryString}` : ''}`);
    return response.map(mapExamResult);
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

  getClassPerformance: async (examId: number): Promise<ClassPerformance[]> => {
    const response = await apiRequest<BackendClassPerformance[]>(
      `/exam-results/exam/${examId}/performance`
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
};

export default examResultService;
