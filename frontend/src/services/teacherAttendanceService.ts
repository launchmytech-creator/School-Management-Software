import { apiRequest } from './api';

export interface TeacherAttendance {
  id: number;
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
  teacherPhone?: string;
  attendanceDate: string;
  status: 'present' | 'absent' | 'late';
}

export interface TeacherAttendanceSummary {
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalMarkedDays: number;
}

export interface MarkAttendanceDto {
  attendanceDate: string;
  records: Array<{
    teacherId: number;
    status: 'present' | 'absent' | 'late';
  }>;
}

interface BackendTeacherAttendance {
  id: number;
  school_id: number;
  teacher_id: number;
  attendance_date: string;
  status: 'present' | 'absent' | 'late';
  teacher_name: string;
  teacher_email: string;
  teacher_phone?: string;
}

interface BackendTeacherAttendanceSummary {
  present_days: string;
  absent_days: string;
  late_days: string;
  total_marked_days: string;
}

const mapFromBackend = (data: BackendTeacherAttendance): TeacherAttendance => ({
  id: data.id,
  teacherId: data.teacher_id,
  teacherName: data.teacher_name,
  teacherEmail: data.teacher_email,
  teacherPhone: data.teacher_phone,
  attendanceDate: data.attendance_date,
  status: data.status,
});

const mapSummaryFromBackend = (data: BackendTeacherAttendanceSummary): TeacherAttendanceSummary => ({
  presentDays: parseInt(data.present_days) || 0,
  absentDays: parseInt(data.absent_days) || 0,
  lateDays: parseInt(data.late_days) || 0,
  totalMarkedDays: parseInt(data.total_marked_days) || 0,
});

export const teacherAttendanceService = {
  markAttendance: async (data: MarkAttendanceDto): Promise<TeacherAttendance[]> => {
    const response = await apiRequest<BackendTeacherAttendance[]>('/teacher-attendance', {
      method: 'POST',
      data,
    });
    return response.map(mapFromBackend);
  },

  getAttendance: async (filters?: {
    teacherId?: number;
    attendanceDate?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<TeacherAttendance[]> => {
    const params = new URLSearchParams();
    if (filters?.teacherId) params.append('teacherId', String(filters.teacherId));
    if (filters?.attendanceDate) params.append('attendanceDate', filters.attendanceDate);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.status) params.append('status', filters.status);
    
    const queryString = params.toString();
    const response = await apiRequest<BackendTeacherAttendance[]>(`/teacher-attendance${queryString ? `?${queryString}` : ''}`);
    return response.map(mapFromBackend);
  },

  getAttendanceByDate: async (date: string): Promise<TeacherAttendance[]> => {
    const response = await apiRequest<BackendTeacherAttendance[]>(`/teacher-attendance/date?date=${date}`);
    return response.map(mapFromBackend);
  },

  getTeacherSummary: async (
    teacherId: number,
    filters?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<TeacherAttendanceSummary> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const queryString = params.toString();
    const response = await apiRequest<BackendTeacherAttendanceSummary>(
      `/teacher-attendance/teacher/${teacherId}/summary${queryString ? `?${queryString}` : ''}`
    );
    return mapSummaryFromBackend(response);
  },

  deleteAttendance: async (id: number): Promise<void> => {
    await apiRequest<void>(`/teacher-attendance/${id}`, {
      method: 'DELETE',
    });
  },
};

export default teacherAttendanceService;
