import { apiRequest } from "./api";
import type { 
  Teacher, 
  TeacherAllocation, 
  CreateTeacherDto, 
  CreateAllocationDto,
  BackendTeacher,
  BackendAllocation,
  SimpleSubject,
  SimpleClass
} from "../types/teacher";

const mapTeacherFromBackend = (t: BackendTeacher): Teacher => ({
  id: t.id,
  fullName: t.full_name,
  email: t.email,
  role: t.role || 'Teacher',
  phone: t.phone,
  dateOfBirth: t.date_of_birth,
  gender: t.gender,
  isActive: t.is_active,
  address: t.address,
  schoolId: t.school_id,
  createdAt: t.created_at,
});

const mapAllocationFromBackend = (a: BackendAllocation): TeacherAllocation => ({
  id: a.id,
  teacherId: a.teacher_id,
  classId: a.class_id,
  subjectId: a.subject_id,
  academicYearId: a.academic_year_id,
  teacherName: a.teacher_name,
  teacherEmail: a.teacher_email,
  className: a.class_name,
  classSection: a.class_section,
  subjectName: a.subject_name,
  subjectCode: a.subject_code,
  yearName: a.year_name,
  createdAt: a.created_at,
});

export const teacherService = {
  // Teacher Endpoints
  getTeachers: async (): Promise<Teacher[]> => {
    const data = await apiRequest<BackendTeacher[]>('/teachers');
    return data.map(mapTeacherFromBackend);
  },

  getTeacherById: async (id: number): Promise<Teacher> => {
    const data = await apiRequest<BackendTeacher>(`/teachers/${id}`);
    return mapTeacherFromBackend(data);
  },

  createTeacher: async (data: CreateTeacherDto): Promise<Teacher> => {
    const response = await apiRequest<BackendTeacher>('/teachers', {
      method: 'POST',
      data
    });
    return mapTeacherFromBackend(response);
  },

  // Allocation Endpoints
  getAllocations: async (): Promise<TeacherAllocation[]> => {
    const data = await apiRequest<BackendAllocation[]>('/teacher-allocations');
    return data.map(mapAllocationFromBackend);
  },

  getAllocationsByTeacher: async (teacherId: number): Promise<TeacherAllocation[]> => {
    const data = await apiRequest<BackendAllocation[]>(`/teacher-allocations/teacher/${teacherId}`);
    return data.map(mapAllocationFromBackend);
  },

  createAllocation: async (data: CreateAllocationDto): Promise<TeacherAllocation> => {
    const response = await apiRequest<BackendAllocation>('/teacher-allocations', {
      method: 'POST',
      data
    });
    return mapAllocationFromBackend(response);
  },

  deleteAllocation: async (id: number): Promise<void> => {
    await apiRequest(`/teacher-allocations/${id}`, {
      method: 'DELETE'
    });
  },

  // Helper Endpoints for Dropdowns
  getSubjects: async (): Promise<SimpleSubject[]> => {
    return apiRequest<SimpleSubject[]>('/subjects');
  },

  getClasses: async (): Promise<SimpleClass[]> => {
    return apiRequest<SimpleClass[]>('/classes');
  }
};
