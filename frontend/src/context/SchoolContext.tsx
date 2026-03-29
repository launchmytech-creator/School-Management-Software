import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { schoolService } from "../services/schoolService";
import type {
  School,
  CreateSchoolRequest,
  SchoolUpdateData,
} from "../types/school";

interface SchoolStats {
  total: number;
  active: number;
  inactive: number;
  basicPlans: number;
  premiumPlans: number;
  businessPlans: number;
}

interface SchoolContextType {
  schools: School[];
  loading: boolean;
  error: string | null;
  stats: SchoolStats;
  recentSchools: School[];
  refresh: () => Promise<void>;
  createSchool: (data: CreateSchoolRequest) => Promise<School>;
  updateSchool: (id: string, data: SchoolUpdateData) => Promise<School>;
  toggleSchoolStatus: (id: string, status: boolean) => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error("useSchool must be used within a SchoolProvider");
  }
  return context;
};

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await schoolService.getSchools();
      console.log(data);
      setSchools(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch schools";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const stats = useMemo((): SchoolStats => {
    const initial = {
      total: 0,
      active: 0,
      inactive: 0,
      basicPlans: 0,
      premiumPlans: 0,
      businessPlans: 0,
    };

    return schools.reduce((acc, s) => {
      acc.total++;
      acc[s.status ? "active" : "inactive"]++;

      if (s.plan === "BASIC") acc.basicPlans++;
      if (s.plan === "PREMIUM") acc.premiumPlans++;
      if (s.plan === "BUSINESS") acc.businessPlans++;

      return acc;
    }, initial);
  }, [schools]);

  const recentSchools = useMemo(() => {
    return [...schools].slice(0, 5);
  }, [schools]);

  const refresh = useCallback(async () => {
    await fetchSchools();
  }, [fetchSchools]);

  const createSchool = useCallback(
    async (data: CreateSchoolRequest): Promise<School> => {
      const newSchool = await schoolService.createSchool(data);
      await fetchSchools();
      return newSchool;
    },
    [fetchSchools],
  );

  const updateSchool = useCallback(
    async (id: string, data: SchoolUpdateData): Promise<School> => {
      const updatedSchool = await schoolService.updateSchool(id, data);
      await fetchSchools();
      return updatedSchool;
    },
    [fetchSchools],
  );

  const toggleSchoolStatus = useCallback(
    async (id: string, status: boolean): Promise<void> => {
      await schoolService.toggleSchoolStatus(id, status);
      await fetchSchools();
    },
    [fetchSchools],
  );

  const value: SchoolContextType = {
    schools,
    loading,
    error,
    stats,
    recentSchools,
    refresh,
    createSchool,
    updateSchool,
    toggleSchoolStatus,
  };

  return (
    <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>
  );
};
