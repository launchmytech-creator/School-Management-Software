export interface Class {
  id: string;
  name: string;
  section: string | null;
  academicYearId: string;
  yearName: string;
  inchargeId: number | null;
  inchargeName: string | null;
  defaultFeeAmount: number | null;
  studentCount: number;
}

export interface CreateClassDto {
  name: string;
  section?: string;
  academicYearId: string | number;
  inchargeId?: number;
  defaultFeeAmount?: number;
}

export interface UpdateClassDto {
  name?: string;
  section?: string;
  inchargeId?: number | null;
  defaultFeeAmount?: number;
}
