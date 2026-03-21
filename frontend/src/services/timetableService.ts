import { apiRequest } from './api';

export interface TimetableEntry {
  id: number;
  schoolId: number;
  classId: number;
  className: string;
  classSection: string | null;
  academicYearId: number;
  academicYearName: string;
  dayOfWeek: number;
  periodNumber: number;
  subjectId: number | null;
  subjectName: string | null;
  subjectCode: string | null;
  teacherId: number | null;
  teacherName: string | null;
  startTime: string;
  endTime: string;
  room: string | null;
  isActive: boolean;
}

export interface CreateTimetableDto {
  classId: number;
  academicYearId: number;
  dayOfWeek: number;
  periodNumber: number;
  subjectId?: number;
  teacherId?: number;
  startTime: string;
  endTime: string;
  room?: string;
}

interface BackendTimetable {
  id: number;
  school_id: number;
  class_id: number;
  class_name: string;
  class_section: string | null;
  academic_year_id: number;
  academic_year_name: string;
  day_of_week: number;
  period_number: number;
  subject_id: number | null;
  subject_name: string | null;
  subject_code: string | null;
  teacher_id: number | null;
  teacher_name: string | null;
  start_time: string;
  end_time: string;
  room: string | null;
  is_active: boolean;
}

const mapTimetable = (data: BackendTimetable): TimetableEntry => ({
  id: data.id,
  schoolId: data.school_id,
  classId: data.class_id,
  className: data.class_name,
  classSection: data.class_section,
  academicYearId: data.academic_year_id,
  academicYearName: data.academic_year_name,
  dayOfWeek: data.day_of_week,
  periodNumber: data.period_number,
  subjectId: data.subject_id,
  subjectName: data.subject_name,
  subjectCode: data.subject_code,
  teacherId: data.teacher_id,
  teacherName: data.teacher_name,
  startTime: data.start_time,
  endTime: data.end_time,
  room: data.room,
  isActive: data.is_active,
});

export const timetableService = {
  getTimetables: async (filters?: {
    classId?: number;
    academicYearId?: number;
    dayOfWeek?: number;
    teacherId?: number;
  }): Promise<TimetableEntry[]> => {
    const params = new URLSearchParams();
    if (filters?.classId) params.append('classId', String(filters.classId));
    if (filters?.academicYearId) params.append('academicYearId', String(filters.academicYearId));
    if (filters?.dayOfWeek !== undefined) params.append('dayOfWeek', String(filters.dayOfWeek));
    if (filters?.teacherId) params.append('teacherId', String(filters.teacherId));
    
    const queryString = params.toString();
    const response = await apiRequest<BackendTimetable[]>(
      `/timetables${queryString ? `?${queryString}` : ''}`
    );
    return response.map(mapTimetable);
  },

  getTimetableById: async (id: number): Promise<TimetableEntry> => {
    const response = await apiRequest<BackendTimetable>(`/timetables/${id}`);
    return mapTimetable(response);
  },

  createTimetable: async (data: CreateTimetableDto): Promise<TimetableEntry> => {
    const response = await apiRequest<BackendTimetable>('/timetables', {
      method: 'POST',
      data,
    });
    return mapTimetable(response);
  },

  updateTimetable: async (id: number, data: Partial<CreateTimetableDto>): Promise<TimetableEntry> => {
    const response = await apiRequest<BackendTimetable>(`/timetables/${id}`, {
      method: 'PATCH',
      data,
    });
    return mapTimetable(response);
  },

  deleteTimetable: async (id: number): Promise<void> => {
    await apiRequest<void>(`/timetables/${id}`, {
      method: 'DELETE',
    });
  },

  bulkCreateTimetable: async (entries: CreateTimetableDto[]): Promise<TimetableEntry[]> => {
    const response = await apiRequest<BackendTimetable[]>('/timetables/bulk', {
      method: 'POST',
      data: { entries },
    });
    return response.map(mapTimetable);
  },
};

export default timetableService;
