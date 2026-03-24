// No imports needed after flat structure change

export type TeacherGender = 'Male' | 'Female' | 'Other';

export interface SimpleSubject {
  id: number;
  name: string;
  code: string;
}

export interface SimpleClass {
  id: number;
  name: string;
  section: string;
}

export interface Teacher {
  id: number;
  fullName: string;
  email: string;
  role: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: TeacherGender;
  isActive: boolean;
  address?: string;
  schoolId?: number;
  createdAt?: string;
}

export interface BackendTeacher {
  id: number;
  full_name: string;
  email: string;
  role?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: TeacherGender;
  is_active: boolean;
  address?: string;
  school_id?: number;
  created_at?: string;
}

export interface TeacherAllocation {
  id: number;
  teacherId: number;
  classId: number;
  subjectId: number;
  academicYearId: number;
  teacherName: string;
  teacherEmail: string;
  className: string;
  classSection: string;
  subjectName: string;
  subjectCode: string;
  yearName: string;
  createdAt?: string;
}

export interface BackendAllocation {
  id: number;
  teacher_id: number;
  class_id: number;
  subject_id: number;
  academic_year_id: number;
  teacher_name: string;
  teacher_email: string;
  class_name: string;
  class_section: string;
  subject_name: string;
  subject_code: string;
  year_name: string;
  created_at?: string;
}

export interface CreateTeacherDto {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: TeacherGender;
  address?: string;
}

export interface CreateAllocationDto {
  teacherId: number;
  classId: number;
  subjectId: number;
  academicYearId: number;
}
