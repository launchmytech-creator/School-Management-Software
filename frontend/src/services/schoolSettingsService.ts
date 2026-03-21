import { apiRequest } from './api';

export interface SchoolSettings {
  id: number;
  schoolId: number;
  schoolName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  logoUrl: string | null;
  gradingSystem: {
    A?: number;
    B?: number;
    C?: number;
    D?: number;
    F?: number;
  };
  attendancePolicy: {
    allowedLeaves?: number;
    requireMedicalCertificate?: boolean;
  };
  termStructure: {
    terms?: number;
    durationMonths?: number;
  };
  workingDays: {
    days?: number[];
  };
  examPolicy: {
    passingMarks?: number;
    internalWeightage?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsDto {
  schoolName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  logoUrl?: string;
  gradingSystem?: SchoolSettings['gradingSystem'];
  attendancePolicy?: SchoolSettings['attendancePolicy'];
  termStructure?: SchoolSettings['termStructure'];
  workingDays?: SchoolSettings['workingDays'];
  examPolicy?: SchoolSettings['examPolicy'];
}

interface BackendSettings {
  id: number;
  school_id: number;
  school_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  logo_url: string | null;
  grading_system: SchoolSettings['gradingSystem'];
  attendance_policy: SchoolSettings['attendancePolicy'];
  term_structure: SchoolSettings['termStructure'];
  working_days: SchoolSettings['workingDays'];
  exam_policy: SchoolSettings['examPolicy'];
  created_at: string;
  updated_at: string;
}

const mapSettings = (data: BackendSettings): SchoolSettings => ({
  id: data.id,
  schoolId: data.school_id,
  schoolName: data.school_name,
  contactEmail: data.contact_email,
  contactPhone: data.contact_phone,
  address: data.address,
  logoUrl: data.logo_url,
  gradingSystem: data.grading_system || {},
  attendancePolicy: data.attendance_policy || {},
  termStructure: data.term_structure || {},
  workingDays: data.working_days || {},
  examPolicy: data.exam_policy || {},
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

export const schoolSettingsService = {
  getSettings: async (): Promise<SchoolSettings> => {
    const response = await apiRequest<BackendSettings>('/school-settings');
    return mapSettings(response);
  },

  updateSettings: async (data: UpdateSettingsDto): Promise<SchoolSettings> => {
    const response = await apiRequest<BackendSettings>('/school-settings', {
      method: 'PATCH',
      data,
    });
    return mapSettings(response);
  },
};

export default schoolSettingsService;
