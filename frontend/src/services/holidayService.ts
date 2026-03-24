import { apiRequest } from './api';

interface BackendHoliday {
  id: number;
  holiday_date: string;
  description: string;
  academic_year_id: number;
  academic_year_name?: string;
  school_id: number;
}

export interface Holiday {
  id: number;
  holidayDate: string;
  description: string;
  academicYearId: number;
  academicYearName?: string;
}

const mapFromBackend = (data: BackendHoliday): Holiday => ({
  id: data.id,
  holidayDate: data.holiday_date,
  description: data.description,
  academicYearId: data.academic_year_id,
  academicYearName: data.academic_year_name,
});

export interface WorkingDays {
  totalDays: number;
  workingDays: number;
  holidays: number;
  sundays: number;
}

export interface CreateHolidayDto {
  holidayDate: string;
  description?: string;
  academicYearId: number;
}

export const holidayService = {
  createHoliday: async (data: CreateHolidayDto): Promise<Holiday> => {
    const response = await apiRequest<BackendHoliday>('/holidays', {
      method: 'POST',
      data,
    });
    return mapFromBackend(response);
  },

  getHolidays: async (year?: number): Promise<Holiday[]> => {
    const queryString = year ? `?year=${year}` : '';
    const response = await apiRequest<BackendHoliday[]>(`/holidays${queryString}`);
    return response.map(mapFromBackend);
  },

  getHolidayById: async (id: number): Promise<Holiday> => {
    const response = await apiRequest<BackendHoliday>(`/holidays/${id}`);
    return mapFromBackend(response);
  },

  updateHoliday: async (id: number, data: Partial<CreateHolidayDto>): Promise<Holiday> => {
    const response = await apiRequest<BackendHoliday>(`/holidays/${id}`, {
      method: 'PATCH',
      data,
    });
    return mapFromBackend(response);
  },

  deleteHoliday: async (id: number): Promise<void> => {
    await apiRequest<void>(`/holidays/${id}`, {
      method: 'DELETE',
    });
  },

  getWorkingDays: async (startDate?: string, endDate?: string): Promise<WorkingDays> => {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    const queryString = queryParams.toString();
    return apiRequest<WorkingDays>(`/holidays/working-days${queryString ? `?${queryString}` : ''}`);
  },

  getAcademicCalendar: async (year?: number): Promise<{
    holidays: Holiday[];
    totalDays: number;
    workingDays: number;
    monthlyBreakdown: { month: string; holidays: number; workingDays: number }[];
  }> => {
    const queryString = year ? `?year=${year}` : '';
    const response = await apiRequest<{
      holidays: BackendHoliday[];
      totalDays: number;
      workingDays: number;
      monthlyBreakdown: { month: string; holidays: number; workingDays: number }[];
    }>(`/holidays/calendar${queryString}`);
    return {
      holidays: response.holidays.map(mapFromBackend),
      totalDays: response.totalDays,
      workingDays: response.workingDays,
      monthlyBreakdown: response.monthlyBreakdown,
    };
  },
};

export default holidayService;
