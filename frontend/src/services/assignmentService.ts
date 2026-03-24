import { apiRequest } from './api';

export interface Assignment {
  id: number;
  schoolId: number;
  classId: number;
  className: string;
  classSection: string | null;
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  academicYearId: number;
  academicYearName: string;
  teacherId: number;
  teacherName: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  maxMarks: number | null;
  assignmentType: 'homework' | 'classwork' | 'project' | 'quiz' | 'test';
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentSubmission {
  id: number;
  assignmentId: number;
  studentId: number;
  studentName: string;
  admissionNumber: string;
  submissionDate: string;
  submissionText: string | null;
  fileUrl: string | null;
  marksObtained: number | null;
  feedback: string | null;
  gradedBy: number | null;
  gradedByName: string | null;
  gradedAt: string | null;
}

export interface CreateAssignmentDto {
  classId: number;
  subjectId: number;
  academicYearId: number;
  title: string;
  description?: string;
  dueDate?: string;
  maxMarks?: number;
  assignmentType?: 'homework' | 'classwork' | 'project' | 'quiz' | 'test';
}

export interface GradeSubmissionDto {
  marksObtained: number;
  feedback?: string;
}

interface BackendAssignment {
  id: number;
  school_id: number;
  class_id: number;
  class_name: string;
  class_section: string | null;
  subject_id: number;
  subject_name: string;
  subject_code: string;
  academic_year_id: number;
  academic_year_name: string;
  teacher_id: number;
  teacher_name: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_marks: number | null;
  assignment_type: string;
  submission_count: number;
  created_at: string;
  updated_at: string;
}

interface BackendSubmission {
  id: number;
  assignment_id: number;
  student_id: number;
  student_name: string;
  admission_number: string;
  submission_date: string;
  submission_text: string | null;
  file_url: string | null;
  marks_obtained: number | null;
  feedback: string | null;
  graded_by: number | null;
  graded_by_name: string | null;
  graded_at: string | null;
}

const mapAssignment = (data: BackendAssignment): Assignment => ({
  id: data.id,
  schoolId: data.school_id,
  classId: data.class_id,
  className: data.class_name,
  classSection: data.class_section,
  subjectId: data.subject_id,
  subjectName: data.subject_name,
  subjectCode: data.subject_code,
  academicYearId: data.academic_year_id,
  academicYearName: data.academic_year_name,
  teacherId: data.teacher_id,
  teacherName: data.teacher_name,
  title: data.title,
  description: data.description,
  dueDate: data.due_date,
  maxMarks: data.max_marks,
  assignmentType: data.assignment_type as Assignment['assignmentType'],
  submissionCount: data.submission_count || 0,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const mapSubmission = (data: BackendSubmission): AssignmentSubmission => ({
  id: data.id,
  assignmentId: data.assignment_id,
  studentId: data.student_id,
  studentName: data.student_name,
  admissionNumber: data.admission_number,
  submissionDate: data.submission_date,
  submissionText: data.submission_text,
  fileUrl: data.file_url,
  marksObtained: data.marks_obtained,
  feedback: data.feedback,
  gradedBy: data.graded_by,
  gradedByName: data.graded_by_name,
  gradedAt: data.graded_at,
});

export const assignmentService = {
  getAssignments: async (filters?: {
    classId?: number;
    subjectId?: number;
    academicYearId?: number;
    teacherId?: number;
    assignmentType?: string;
    limit?: number;
  }): Promise<Assignment[]> => {
    const params = new URLSearchParams();
    if (filters?.classId) params.append('classId', String(filters.classId));
    if (filters?.subjectId) params.append('subjectId', String(filters.subjectId));
    if (filters?.academicYearId) params.append('academicYearId', String(filters.academicYearId));
    if (filters?.teacherId) params.append('teacherId', String(filters.teacherId));
    if (filters?.assignmentType) params.append('assignmentType', filters.assignmentType);
    if (filters?.limit) params.append('limit', String(filters.limit));
    
    const queryString = params.toString();
    const response = await apiRequest<BackendAssignment[]>(
      `/assignments${queryString ? `?${queryString}` : ''}`
    );
    return response.map(mapAssignment);
  },

  getAssignmentById: async (id: number): Promise<Assignment> => {
    const response = await apiRequest<BackendAssignment>(`/assignments/${id}`);
    return mapAssignment(response);
  },

  createAssignment: async (data: CreateAssignmentDto): Promise<Assignment> => {
    const response = await apiRequest<BackendAssignment>('/assignments', {
      method: 'POST',
      data,
    });
    return mapAssignment(response);
  },

  updateAssignment: async (id: number, data: Partial<CreateAssignmentDto>): Promise<Assignment> => {
    const response = await apiRequest<BackendAssignment>(`/assignments/${id}`, {
      method: 'PATCH',
      data,
    });
    return mapAssignment(response);
  },

  deleteAssignment: async (id: number): Promise<void> => {
    await apiRequest<void>(`/assignments/${id}`, {
      method: 'DELETE',
    });
  },

  getSubmissions: async (assignmentId: number): Promise<AssignmentSubmission[]> => {
    const response = await apiRequest<BackendSubmission[]>(`/assignments/${assignmentId}/submissions`);
    return response.map(mapSubmission);
  },

  gradeSubmission: async (submissionId: number, data: GradeSubmissionDto): Promise<AssignmentSubmission> => {
    const response = await apiRequest<BackendSubmission>(`/assignments/submissions/${submissionId}/grade`, {
      method: 'POST',
      data,
    });
    return mapSubmission(response);
  },
};

export default assignmentService;
