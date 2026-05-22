import { apiRequest } from './api';

export interface Exam {
  id: number;
  classId: number;
  className: string;
  classSection?: string;
  name: string;
  examType?: string;
  startDate: string;
  endDate: string;
  weightage?: number;
  description?: string;
  subjectCount: number;
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
  academicYearId: number;
  name: string;
  examType?: string;
  startDate: string;
  endDate: string;
  weightage?: number;
  description?: string;
  subjects?: ExamSubjectInput[];
}

export interface ExamSubjectInput {
  subjectId: number;
  maxMarks: number;
  examDate?: string;
}

export interface AddExamSubjectDto {
  subjectId: number;
  maxMarks: number;
  examDate?: string;
}

interface BackendExamSubject {
  id: number;
  exam_id: number;
  subject_id: number;
  max_marks: number;
  exam_date: string | null;
  subject_name: string;
  subject_code: string;
}

interface BackendExam {
  id: number;
  school_id: number;
  class_id: number;
  academic_year_id: number;
  name: string;
  exam_type: string | null;
  start_date: string;
  end_date: string;
  weightage: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  class_name: string | null;
  class_section: string | null;
  academic_year_name: string | null;
  subject_count: string | number;
  subjects?: BackendExamSubject[];
}

const mapExamSubjectFromBackend = (data: BackendExamSubject): ExamSubject => ({
  id: data.id,
  examId: data.exam_id,
  subjectId: data.subject_id,
  maxMarks: data.max_marks,
  subjectName: data.subject_name,
});

const mapExamFromBackend = (data: BackendExam): Exam => ({
  id: data.id,
  classId: data.class_id,
  className: data.class_name || '',
  classSection: data.class_section || undefined,
  name: data.name,
  examType: data.exam_type || undefined,
  startDate: data.start_date,
  endDate: data.end_date,
  weightage: data.weightage || undefined,
  description: data.description || undefined,
  subjectCount: Number(data.subject_count) || 0,
  subjects: data.subjects?.map(mapExamSubjectFromBackend) || [],
});

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
    const response = await apiRequest<BackendExam>('/exams', {
      method: 'POST',
      data,
    });
    return mapExamFromBackend(response);
  },

  getExams: async (classId?: number, academicYearId?: number): Promise<Exam[]> => {
    const params = new URLSearchParams();
    if (classId) params.append('classId', String(classId));
    if (academicYearId) params.append('academicYearId', String(academicYearId));
    const queryString = params.toString();
    const data = await apiRequest<BackendExam[]>(`/exams${queryString ? `?${queryString}` : ''}`);
    return data.map(mapExamFromBackend);
  },

  getExamById: async (id: number): Promise<Exam> => {
    const data = await apiRequest<BackendExam>(`/exams/${id}`);
    return mapExamFromBackend(data);
  },

  updateExam: async (id: number, data: Partial<CreateExamDto>): Promise<Exam> => {
    const response = await apiRequest<BackendExam>(`/exams/${id}`, {
      method: 'PATCH',
      data,
    });
    return mapExamFromBackend(response);
  },

  deleteExam: async (id: number): Promise<void> => {
    await apiRequest<void>(`/exams/${id}`, {
      method: 'DELETE',
    });
  },

  addExamSubject: async (examId: number, data: AddExamSubjectDto): Promise<ExamSubject> => {
    const response = await apiRequest<BackendExamSubject>(`/exams/${examId}/subjects`, {
      method: 'POST',
      data,
    });
    return mapExamSubjectFromBackend(response);
  },

  updateExamSubject: async (id: number, data: Partial<AddExamSubjectDto>): Promise<ExamSubject> => {
    const response = await apiRequest<BackendExamSubject>(`/exams/subjects/${id}`, {
      method: 'PATCH',
      data,
    });
    return mapExamSubjectFromBackend(response);
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
    academicYearId?: number;
  } = {}): Promise<ExamResult[]> => {
    const queryParams = new URLSearchParams();
    if (params.examId) queryParams.append('examId', String(params.examId));
    if (params.classId) queryParams.append('classId', String(params.classId));
    if (params.studentId) queryParams.append('studentId', String(params.studentId));
    if (params.academicYearId) queryParams.append('academicYearId', String(params.academicYearId));
    
    const queryString = queryParams.toString();
    return apiRequest<ExamResult[]>(`/exam-results${queryString ? `?${queryString}` : ''}`);
  },

  getStudentResults: async (studentId: number): Promise<ExamResult[]> => {
    return apiRequest<ExamResult[]>(`/exam-results/student/${studentId}`);
  },

  getExamSubjectResults: async (examSubjectId: number): Promise<ExamResult[]> => {
    return apiRequest<ExamResult[]>(`/exam-results/exam-subject/${examSubjectId}`);
  },

  getClassPerformance: async (examId: number, academicYearId?: number): Promise<ClassPerformance> => {
    const params = new URLSearchParams();
    if (academicYearId) params.append('academicYearId', String(academicYearId));
    const queryString = params.toString();
    return apiRequest<ClassPerformance>(`/exam-results/exam/${examId}/performance${queryString ? `?${queryString}` : ''}`);
  },

  deleteResult: async (id: number): Promise<void> => {
    await apiRequest<void>(`/exam-results/${id}`, {
      method: 'DELETE',
    });
  },
};

export default examService;
