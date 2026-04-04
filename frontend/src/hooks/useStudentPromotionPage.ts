import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useAcademicYear } from '../context/AcademicYearContext';
import {
  promotionService,
  type Promotion,
  type PromotionGroup,
} from '../services/promotionService';
import { classService } from '../services/classService';
import { studentService } from '../services/studentService';
import type { Student } from '../types/student';
import type { Class } from '../types/class';

interface UseStudentPromotionPageReturn {
  // Data
  classes: Class[];
  nextYearClasses: Class[];
  classStudents: Student[];
  promotions: Promotion[];
  groupedPromotions: PromotionGroup[];
  
  // Loading states
  loadingClasses: boolean;
  loadingNextYearClasses: boolean;
  loadingPromotions: boolean;
  loadingStudents: boolean;
  promoting: boolean;
  
  // Promotion form state
  fromClass: string;
  setFromClass: (value: string) => void;
  toClass: string;
  setToClass: (value: string) => void;
  toAcademicYear: string;
  setToAcademicYear: (value: string) => void;
  selectedStudents: number[];
  
  // Filters
  filterAcademicYear: string;
  setFilterAcademicYear: (value: string) => void;
  filterFromClass: string;
  setFilterFromClass: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  
  // Modals
  showModal: boolean;
  setShowModal: (value: boolean) => void;
  
  // Expansion state
  expandedGroups: Set<string>;
  showAllStudents: Record<string, boolean>;
  
  // Computed
  filteredStudents: Student[];
  nextYearOptions: { id: string; name: string }[];
  availableClassesForTo: Class[];
  filteredToClasses: Class[];
  
  // Handlers
  toggleGroup: (key: string) => void;
  toggleAllGroups: (expand: boolean) => void;
  toggleShowAllStudents: (key: string) => void;
  toggleStudent: (studentId: number) => void;
  toggleAll: () => void;
  handlePromote: () => Promise<void>;
  handlePromoteAll: () => void;
  resetFilters: () => void;
}

const getGradeLevel = (className: string): number => {
  const match = className.match(/Class\s*(\d+)/i);
  return match ? parseInt(match[1]) : 0;
};

export const useStudentPromotionPage = (): UseStudentPromotionPageReturn => {
  const { showNotification } = useNotification();
  const { allYears, selectedYear } = useAcademicYear();

  // Data state
  const [classes, setClasses] = useState<Class[]>([]);
  const [nextYearClasses, setNextYearClasses] = useState<Class[]>([]);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  // Form state
  const [fromClass, setFromClass] = useState<string>("");
  const [toClass, setToClass] = useState<string>("");
  const [toAcademicYear, setToAcademicYear] = useState<string>("");

  // Selection state
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  // Loading states
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingNextYearClasses, setLoadingNextYearClasses] = useState(false);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [promoting, setPromoting] = useState(false);

  // Filter state
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>("");
  const [filterFromClass, setFilterFromClass] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // UI state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showAllStudents, setShowAllStudents] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);

  // Fetch classes
  const fetchClasses = useCallback(async () => {
    try {
      setLoadingClasses(true);
      const data = await classService.getClasses(selectedYear?.id);
      setClasses(data);
    } catch {
      showNotification("Failed to fetch classes", "error");
    } finally {
      setLoadingClasses(false);
    }
  }, [selectedYear, showNotification]);

  // Fetch next year classes
  const fetchNextYearClasses = useCallback(async () => {
    if (!toAcademicYear) {
      setNextYearClasses([]);
      return;
    }
    try {
      setLoadingNextYearClasses(true);
      const data = await classService.getClasses(toAcademicYear);
      setNextYearClasses(data);
    } catch {
      showNotification("Failed to fetch next year classes", "error");
      setNextYearClasses([]);
    } finally {
      setLoadingNextYearClasses(false);
    }
  }, [toAcademicYear, showNotification]);

  // Fetch promotions
  const fetchPromotions = useCallback(async () => {
    try {
      setLoadingPromotions(true);
      const data = await promotionService.getPromotions({
        fromClassId: filterFromClass ? parseInt(filterFromClass) : undefined,
        academicYearId: filterAcademicYear
          ? parseInt(filterAcademicYear)
          : undefined,
      });
      setPromotions(data || []);
    } catch {
      showNotification("Failed to fetch promotions", "error");
    } finally {
      setLoadingPromotions(false);
    }
  }, [filterAcademicYear, filterFromClass, showNotification]);

  // Fetch class students
  const fetchClassStudents = useCallback(async () => {
    if (!fromClass) {
      setClassStudents([]);
      return;
    }

    try {
      setLoadingStudents(true);
      const data = await studentService.getStudents({ classId: fromClass });
      setClassStudents(data);
      setSelectedStudents([]);
    } catch {
      showNotification("Failed to fetch students", "error");
    } finally {
      setLoadingStudents(false);
    }
  }, [fromClass, showNotification]);

  // Initial data fetch
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchNextYearClasses();
  }, [fetchNextYearClasses]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  useEffect(() => {
    if (fromClass) {
      fetchClassStudents();
    }
  }, [fromClass, fetchClassStudents]);

  useEffect(() => {
    if (showModal && fromClass && classStudents.length === 0) {
      fetchClassStudents();
    }
  }, [showModal, fromClass, classStudents.length, fetchClassStudents]);

  // Computed values
  const groupedPromotions = useMemo((): PromotionGroup[] => {
    const groups = new Map<string, PromotionGroup>();

    promotions.forEach((p) => {
      const key = `${p.fromClassId}-${p.toClassId}-${p.fromAcademicYearId}-${p.promotedAt}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          fromClassName: p.fromClassName,
          fromClassSection: p.fromClassSection,
          toClassName: p.toClassName,
          toClassSection: p.toClassSection,
          fromAcademicYear: p.fromAcademicYearName,
          toAcademicYear: p.toAcademicYearName,
          promotionDate: p.promotedAt,
          promotedByName: p.promotedByName,
          students: [],
        });
      }
      groups.get(key)!.students.push(p);
    });

    return Array.from(groups.values()).sort(
      (a, b) =>
        new Date(b.promotionDate).getTime() -
        new Date(a.promotionDate).getTime(),
    );
  }, [promotions]);

  const fromClassData = useMemo(
    () => classes.find((c) => c.id === fromClass),
    [classes, fromClass],
  );

  const availableClassesForTo = useMemo(() => {
    return toAcademicYear ? nextYearClasses : classes;
  }, [toAcademicYear, nextYearClasses, classes]);

  const filteredToClasses = useMemo(() => {
    if (!fromClassData || availableClassesForTo.length === 0) return [];
    const fromGrade = getGradeLevel(fromClassData.name);
    return availableClassesForTo.filter((c) => {
      const toGrade = getGradeLevel(c.name);
      return toGrade > fromGrade && c.id !== fromClass;
    });
  }, [fromClassData, availableClassesForTo, fromClass]);

  const nextYearOptions = useMemo(
    () => allYears.filter((y) => y.id !== selectedYear?.id),
    [allYears, selectedYear],
  );

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return classStudents;
    const query = searchQuery.toLowerCase();
    return classStudents.filter(
      (s) =>
        s.fullName.toLowerCase().includes(query) ||
        s.admissionNumber.toLowerCase().includes(query),
    );
  }, [classStudents, searchQuery]);

  // Handlers
  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleAllGroups = useCallback(
    (expand: boolean) => {
      if (expand) {
        setExpandedGroups(new Set(groupedPromotions.map((g) => g.key)));
      } else {
        setExpandedGroups(new Set());
      }
    },
    [groupedPromotions],
  );

  const toggleShowAllStudents = useCallback((key: string) => {
    setShowAllStudents((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleStudent = useCallback((studentId: number) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((s) => s.id));
    }
  }, [selectedStudents.length, filteredStudents]);

  const handlePromote = useCallback(async () => {
    if (selectedStudents.length === 0) {
      showNotification("Please select at least one student", "error");
      return;
    }

    try {
      setPromoting(true);
      await promotionService.promoteStudents({
        studentIds: selectedStudents,
        toClassId: toClass,
        toAcademicYearId: toAcademicYear || selectedYear?.id || "",
      });
      showNotification(
        `${selectedStudents.length} students promoted successfully`,
        "success",
      );
      setShowModal(false);
      setSelectedStudents([]);
      setSearchQuery("");
      fetchPromotions();
      fetchClassStudents();
    } catch {
      showNotification("Failed to promote students", "error");
    } finally {
      setPromoting(false);
    }
  }, [selectedStudents, toClass, toAcademicYear, selectedYear, showNotification, fetchPromotions, fetchClassStudents]);

  const handlePromoteAll = useCallback(() => {
    setSelectedStudents(classStudents.map((s) => s.id));
    setShowModal(true);
  }, [classStudents]);

  const resetFilters = useCallback(() => {
    setFromClass("");
    setToClass("");
    setToAcademicYear("");
    setFilterAcademicYear("");
    setFilterFromClass("");
    setClassStudents([]);
    setSelectedStudents([]);
    setSearchQuery("");
    setExpandedGroups(new Set());
    setShowAllStudents({});
  }, []);

  return {
    // Data
    classes,
    nextYearClasses,
    classStudents,
    promotions,
    groupedPromotions,
    
    // Loading states
    loadingClasses,
    loadingNextYearClasses,
    loadingPromotions,
    loadingStudents,
    promoting,
    
    // Promotion form state
    fromClass,
    setFromClass,
    toClass,
    setToClass,
    toAcademicYear,
    setToAcademicYear,
    selectedStudents,
    
    // Filters
    filterAcademicYear,
    setFilterAcademicYear,
    filterFromClass,
    setFilterFromClass,
    searchQuery,
    setSearchQuery,
    
    // Modals
    showModal,
    setShowModal,
    
    // Expansion state
    expandedGroups,
    showAllStudents,
    
    // Computed
    filteredStudents,
    nextYearOptions,
    availableClassesForTo,
    filteredToClasses,
    
    // Handlers
    toggleGroup,
    toggleAllGroups,
    toggleShowAllStudents,
    toggleStudent,
    toggleAll,
    handlePromote,
    handlePromoteAll,
    resetFilters,
  };
};
