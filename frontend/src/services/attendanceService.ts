import { apiRequest } from './api';

export interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  classId: number;
  className: string;
  attendanceDate: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

export interface StudentAttendanceSummary {
  studentId: number;
  studentName: string;
  classId: number;
  className: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendancePercentage: number;
}

export interface MarkAttendanceDto {
  classId: number;
  attendanceDate: string;
  records: {
    studentId: number;
    status: 'present' | 'absent' | 'late' | 'excused';
  }[];
}

export const attendanceService = {
  markAttendance: async (data: MarkAttendanceDto): Promise<void> => {
    await apiRequest<void>('/student-attendance', {
      method: 'POST',
      data,
    });
  },

  getAttendance: async (params: { 
    classId?: number; 
    studentId?: number; 
    date?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<AttendanceRecord[]> => {
    const queryParams = new URLSearchParams();
    if (params.classId) queryParams.append('classId', String(params.classId));
    if (params.studentId) queryParams.append('studentId', String(params.studentId));
    if (params.date) queryParams.append('date', params.date);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    const url = `/student-attendance${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest<any[]>(url);
    return response.map((r) => ({
      id: r.id,
      studentId: r.student_id,
      studentName: r.student_name,
      classId: r.class_id,
      className: r.class_name,
      attendanceDate: r.attendance_date,
      status: r.status,
    }));
  },

  getStudentAttendanceSummary: async (studentId: number): Promise<StudentAttendanceSummary> => {
    const response = await apiRequest<any>(`/student-attendance/student/${studentId}/summary`);
    return {
      studentId,
      studentName: '',
      classId: 0,
      className: '',
      totalDays: parseInt(response.total_marked_days) || 0,
      presentDays: parseInt(response.present_days) || 0,
      absentDays: parseInt(response.absent_days) || 0,
      lateDays: parseInt(response.late_days) || 0,
      attendancePercentage: 0,
    };
  },

  getClassAttendanceByDate: async (classId: number, date: string): Promise<AttendanceRecord[]> => {
    const response = await apiRequest<any[]>(`/student-attendance/class/${classId}?date=${date}`);
    return response.map((r) => ({
      id: r.id,
      studentId: r.student_id,
      studentName: r.student_name,
      classId: r.class_id,
      className: '',
      attendanceDate: r.attendance_date,
      status: r.status,
    }));
  },

  getSchoolOpenDays: async (year: number, month: number): Promise<number> => {
    const response = await apiRequest<{ school_open_days: number }>(
      `/student-attendance/school-open-days?year=${year}&month=${month}`
    );
    return response.school_open_days;
  },

  deleteAttendance: async (id: number): Promise<void> => {
    await apiRequest<void>(`/student-attendance/${id}`, {
      method: 'DELETE',
    });
  },

  getAttendanceReport: async (classId?: number, startDate?: string, endDate?: string) => {
    const queryParams = new URLSearchParams();
    if (classId) queryParams.append('classId', String(classId));
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    const queryString = queryParams.toString();
    const url = `/student-attendance/report${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<{
      totalStudents: number;
      averageAttendance: number;
      dailyAttendance: { date: string; present: number; absent: number; total: number }[];
    }>(url);
  },
};

export default attendanceService;
