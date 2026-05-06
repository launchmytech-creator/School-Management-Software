export type StudentStatus = 'active' | 'inactive' | 'suspended' | 'graduated';
export type FeeStatus = 'Paid' | 'Pending' | 'Partial';

export interface Student {
  id: number;
  schoolId: number;
  admissionNumber: string;
  fullName: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  phone?: string | null;
  admissionDate: string;
  currentClassId?: number | null;
  parentId?: number | null;
  rollNumber?: string | null;
  status: StudentStatus;
  
  // Joined fields
  className?: string;
  classSection?: string;
  parentName?: string;
  parentPhone?: string;
  
  // UI Specific
  feeStatus?: FeeStatus; // This might come from another service or be derived
}

export interface StudentFilters {
  classId?: string;
  section?: string;
  academicYear?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// [NEW] Student History Types
export interface EnrollmentRecord {
  academic_year_id: number;
  academic_year_name: string;
  class_id: number;
  class_name: string;
  class_section: string;
  is_current: boolean;
}

export interface MonthlyAttendance {
  month: string;
  year: number;
  present: number;
  total: number;
  percentage: number;
}

export interface AttendanceYearData {
  academic_year_id: number;
  academic_year_name: string;
  total_days: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
  monthly_breakdown: MonthlyAttendance[];
}

export interface ResultsYearData {
  academic_year_id: number;
  academic_year_name: string;
  exams_taken: number;
  average_marks: number;
  highest_marks: number;
  lowest_marks: number;
  status: 'passed' | 'failed' | 'partial';
}

export interface FeeYearData {
  academic_year_id: number;
  academic_year_name: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  status: 'paid' | 'partial' | 'pending';
}

export interface StudentHistory {
  student: {
    id: number;
    admission_number: string;
    full_name: string;
    date_of_birth?: string | null;
    gender?: string | null;
    phone?: string | null;
    status: StudentStatus;
    class_name?: string;
    class_section?: string;
    parent_name?: string;
    parent_email?: string;
    parent_phone?: string;
  };
  enrollments: EnrollmentRecord[];
  attendance: AttendanceYearData[];
  results: ResultsYearData[];
  fees: FeeYearData[];
}
