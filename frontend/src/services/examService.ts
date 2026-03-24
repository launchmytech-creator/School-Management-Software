import { apiRequest } from './api';

export interface Exam {
  id: number;
  classId: number;
  className: string;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  subjects?: ExamSubject[];
}

export interface ExamSubject {
  id: number;
  examId: number;
  subjectId: number;
  subjectName: string;
  maxMarks: number;
}

export interface ExamResult {
  id: number;
  examSubjectId: number;
  studentId: number;
  studentName: string;
  admissionNumber: string;
  marksObtained: number;
  maxMarks: number;
  grade?: string;
  rank?: number;
}

export interface ClassPerformance {
  classId: number;
  className: string;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  totalStudents: number;
  passCount: number;
  failCount: number;
  subjectWiseAvg: { subjectName: string; average: number }[];
}

export interface CreateExamDto {
  classId: number;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface AddExamSubjectDto {
  subjectId: number;
  maxMarks: number;
}

export interface EnterMarksDto {
  examSubjectId: number;
  results: {
    studentId: number;
    marksObtained: number;
  }[];
}

export const examService = {
  // Exams
  createExam: async (data: CreateExamDto): Promise<Exam> => {
    return apiRequest<Exam>('/exams', {
      method: 'POST',
      data,
    });
  },

  getExams: async (classId?: number): Promise<Exam[]> => {
    const queryString = classId ? `?classId=${classId}` : '';
    return apiRequest<Exam[]>(`/exams${queryString}`);
  },

  getExamById: async (id: number): Promise<Exam> => {
    return apiRequest<Exam>(`/exams/${id}`);
  },

  updateExam: async (id: number, data: Partial<CreateExamDto>): Promise<Exam> => {
    return apiRequest<Exam>(`/exams/${id}`, {
      method: 'PATCH',
      data,
    });
  },

  deleteExam: async (id: number): Promise<void> => {
    await apiRequest<void>(`/exams/${id}`, {
      method: 'DELETE',
    });
  },

  addExamSubject: async (examId: number, data: AddExamSubjectDto): Promise<ExamSubject> => {
    return apiRequest<ExamSubject>(`/exams/${examId}/subjects`, {
      method: 'POST',
      data,
    });
  },

  updateExamSubject: async (id: number, data: Partial<AddExamSubjectDto>): Promise<ExamSubject> => {
    return apiRequest<ExamSubject>(`/exams/subjects/${id}`, {
      method: 'PATCH',
      data,
    });
  },

  deleteExamSubject: async (id: number): Promise<void> => {
    await apiRequest<void>(`/exams/subjects/${id}`, {
      method: 'DELETE',
    });
  },

  // Exam Results
  enterMarks: async (data: EnterMarksDto): Promise<void> => {
    await apiRequest<void>('/exam-results', {
      method: 'POST',
      data,
    });
  },

  getResults: async (params: {
    examId?: number;
    classId?: number;
    studentId?: number;
  } = {}): Promise<ExamResult[]> => {
    const queryParams = new URLSearchParams();
    if (params.examId) queryParams.append('examId', String(params.examId));
    if (params.classId) queryParams.append('classId', String(params.classId));
    if (params.studentId) queryParams.append('studentId', String(params.studentId));
    
    const queryString = queryParams.toString();
    return apiRequest<ExamResult[]>(`/exam-results${queryString ? `?${queryString}` : ''}`);
  },

  getStudentResults: async (studentId: number): Promise<ExamResult[]> => {
    return apiRequest<ExamResult[]>(`/exam-results/student/${studentId}`);
  },

  getExamSubjectResults: async (examSubjectId: number): Promise<ExamResult[]> => {
    return apiRequest<ExamResult[]>(`/exam-results/exam-subject/${examSubjectId}`);
  },

  getClassPerformance: async (examId: number): Promise<ClassPerformance> => {
    return apiRequest<ClassPerformance>(`/exam-results/exam/${examId}/performance`);
  },

  deleteResult: async (id: number): Promise<void> => {
    await apiRequest<void>(`/exam-results/${id}`, {
      method: 'DELETE',
    });
  },
};

export default examService;
