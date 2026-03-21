import { apiRequest } from './api';

export interface AttendanceReport {
  className: string;
  classSection: string | null;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendancePercentage: number;
}

export interface FeesReport {
  className: string;
  classSection: string | null;
  totalStudents: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paidCount: number;
  partialCount: number;
  pendingCount: number;
  collectionPercentage: number;
}

export interface ResultsReport {
  className: string;
  classSection: string | null;
  subjectName: string;
  examName: string;
  studentsAppeared: number;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  distinctionCount: number;
  firstClassCount: number;
  passCount: number;
  failCount: number;
}

export interface SummaryReport {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
}

export const reportService = {
  getAttendanceReport: async (filters?: {
    academicYearId?: number;
    classId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<AttendanceReport[]> => {
    const params = new URLSearchParams({ type: 'attendance' });
    if (filters?.academicYearId) params.append('academicYearId', String(filters.academicYearId));
    if (filters?.classId) params.append('classId', String(filters.classId));
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await apiRequest<any[]>(`/reports?${params.toString()}`);
    return response.map(r => ({
      className: r.class_name,
      classSection: r.class_section,
      totalStudents: parseInt(r.total_students) || 0,
      presentCount: parseInt(r.present_count) || 0,
      absentCount: parseInt(r.absent_count) || 0,
      lateCount: parseInt(r.late_count) || 0,
      attendancePercentage: parseFloat(r.attendance_percentage) || 0,
    }));
  },

  getFeesReport: async (filters?: {
    academicYearId?: number;
    classId?: number;
  }): Promise<FeesReport[]> => {
    const params = new URLSearchParams({ type: 'fees' });
    if (filters?.academicYearId) params.append('academicYearId', String(filters.academicYearId));
    if (filters?.classId) params.append('classId', String(filters.classId));
    
    const response = await apiRequest<any[]>(`/reports?${params.toString()}`);
    return response.map(r => ({
      className: r.class_name,
      classSection: r.class_section,
      totalStudents: parseInt(r.total_students) || 0,
      totalAmount: parseFloat(r.total_amount) || 0,
      paidAmount: parseFloat(r.paid_amount) || 0,
      pendingAmount: parseFloat(r.pending_amount) || 0,
      paidCount: parseInt(r.paid_count) || 0,
      partialCount: parseInt(r.partial_count) || 0,
      pendingCount: parseInt(r.pending_count) || 0,
      collectionPercentage: parseFloat(r.collection_percentage) || 0,
    }));
  },

  getResultsReport: async (filters?: {
    academicYearId?: number;
    classId?: number;
  }): Promise<ResultsReport[]> => {
    const params = new URLSearchParams({ type: 'results' });
    if (filters?.academicYearId) params.append('academicYearId', String(filters.academicYearId));
    if (filters?.classId) params.append('classId', String(filters.classId));
    
    const response = await apiRequest<any[]>(`/reports?${params.toString()}`);
    return response.map(r => ({
      className: r.class_name,
      classSection: r.class_section,
      subjectName: r.subject_name,
      examName: r.exam_name,
      studentsAppeared: parseInt(r.students_appeared) || 0,
      averageMarks: parseFloat(r.average_marks) || 0,
      highestMarks: parseFloat(r.highest_marks) || 0,
      lowestMarks: parseFloat(r.lowest_marks) || 0,
      distinctionCount: parseInt(r.distinction_count) || 0,
      firstClassCount: parseInt(r.first_class_count) || 0,
      passCount: parseInt(r.pass_count) || 0,
      failCount: parseInt(r.fail_count) || 0,
    }));
  },

  getSummaryReport: async (filters?: {
    academicYearId?: number;
  }): Promise<SummaryReport> => {
    const params = new URLSearchParams({ type: 'summary' });
    if (filters?.academicYearId) params.append('academicYearId', String(filters.academicYearId));
    
    const response = await apiRequest<any>(`/reports?${params.toString()}`);
    return {
      totalStudents: response.totalStudents || 0,
      totalTeachers: response.totalTeachers || 0,
      totalClasses: response.totalClasses || 0,
    };
  },
};

export default reportService;
