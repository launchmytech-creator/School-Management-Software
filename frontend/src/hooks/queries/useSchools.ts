import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolService } from '../../services/schoolService';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import type { School, CreateSchoolRequest, SchoolUpdateData } from '../../types/school';

export interface SchoolFilters {
  page?: number;
  limit?: number;
  search?: string;
  plan?: string;
  status?: string;
}

export interface SchoolStats {
  total: number;
  active: number;
  inactive: number;
  basicPlans: number;
  premiumPlans: number;
  businessPlans: number;
}

export const useSchools = (filters: SchoolFilters = {}, enabled = true) => {
  return useQuery<School[]>({
    queryKey: queryKeys.schools.filtered(filters),
    queryFn: () => schoolService.getSchools(filters),
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled,
  });
};

export const useSchoolById = (id: string) => {
  return useQuery<School>({
    queryKey: ['schools', id],
    queryFn: () => schoolService.getSchools({}).then(schools => schools.find(s => s.id === id) as School),
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!id,
  });
};

export const useSchoolStats = () => {
  const { data: schools, ...rest } = useSchools();

  const stats: SchoolStats = {
    total: 0,
    active: 0,
    inactive: 0,
    basicPlans: 0,
    premiumPlans: 0,
    businessPlans: 0,
  };

  if (schools) {
    stats.total = schools.length;
    schools.forEach(s => {
      if (s.status) stats.active++;
      else stats.inactive++;
      if (s.plan === 'BASIC') stats.basicPlans++;
      if (s.plan === 'PREMIUM') stats.premiumPlans++;
      if (s.plan === 'BUSINESS') stats.businessPlans++;
    });
  }

  return {
    data: schools,
    stats,
    ...rest,
  };
};

export const useRecentSchools = (limit = 5) => {
  const { data: schools, ...rest } = useSchools({ limit: 100 });

  const recentSchools = schools?.slice(0, limit) || [];

  return {
    data: recentSchools,
    ...rest,
  };
};

export const useCreateSchool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSchoolRequest) => schoolService.createSchool(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
    },
  });
};

export const useUpdateSchool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SchoolUpdateData }) =>
      schoolService.updateSchool(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
    },
  });
};

export const useToggleSchoolStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: boolean }) =>
      schoolService.toggleSchoolStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
    },
  });
};
