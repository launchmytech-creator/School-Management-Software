import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import {
  feeStructureService,
  type FeeStructureGroup,
  type CreateFeeStructureDto,
} from '../services/feeStructureService';
import { feeService } from '../services/feeService';
import { useClasses, useFeeStructuresGrouped } from './queries';
import { useAcademicYear } from '../context/AcademicYearContext';
import type { Class } from '../types/class';
import type { AcademicYear } from '../types/academicYear';

interface GenerationResult {
  feeTerms: number;
  totalAnnualFee: number;
  perTermAmount: number;
  termBreakdown: Record<string, number>;
  generated: number;
  skippedStudents: number;
}

interface DeleteDialogState {
  isOpen: boolean;
  componentId: number | null;
  loading: boolean;
}

interface DeleteGroupDialogState {
  isOpen: boolean;
  group: FeeStructureGroup | null;
  loading: boolean;
}

export const getFeeTermsLabel = (feeTerms: number): string => {
  switch (feeTerms) {
    case 1:
      return "Yearly";
    case 2:
      return "Half-yearly";
    case 4:
      return "Quarterly";
    case 12:
      return "Monthly";
    default:
      return `${feeTerms} terms`;
  }
};

export interface UseFeeStructuresPageReturn {
  // Data
  groupedStructures: FeeStructureGroup[];
  filteredGroups: FeeStructureGroup[];
  classes: Class[];
  academicYears: AcademicYear[];
  loading: boolean;
  
  // Stats
  stats: {
    totalClasses: number;
    totalAnnualRevenue: number;
    avgPerClass: number;
  };
  
  // Filters
  selectedClass: string;
  setSelectedClass: (value: string) => void;
  selectedYear: string;
  setSelectedYear: (value: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  
  // Group expansion
  expandedGroups: Set<string>;
  toggleGroup: (key: string) => void;
  
  // Form modal
  showCreateModal: boolean;
  setShowCreateModal: (value: boolean) => void;
  editingStructure: { group: FeeStructureGroup; componentId: number } | null;
  formData: CreateFeeStructureDto;
  setFormData: (data: CreateFeeStructureDto) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  saving: boolean;
  handleOpenCreate: () => void;
  handleOpenEdit: (group: FeeStructureGroup, componentId: number) => void;
  handleSave: () => Promise<void>;
  
  // Delete dialogs
  deleteComponentDialog: DeleteDialogState;
  setDeleteComponentDialog: (state: DeleteDialogState) => void;
  handleDeleteComponent: (componentId: number) => void;
  confirmDeleteComponent: () => Promise<void>;
  deleteGroupDialog: DeleteGroupDialogState;
  setDeleteGroupDialog: (state: DeleteGroupDialogState) => void;
  handleDeleteGroup: (group: FeeStructureGroup) => void;
  confirmDeleteGroup: () => Promise<void>;
  
  // Generate modal
  showGenerateModal: boolean;
  setShowGenerateModal: (value: boolean) => void;
  generateData: { classId: number; academicYearId: number };
  setGenerateData: (data: { classId: number; academicYearId: number }) => void;
  generating: boolean;
  generationResult: GenerationResult | null;
  openGenerateModal: () => void;
  handleGenerateTransactions: () => Promise<void>;
}

export const useFeeStructuresPage = (): UseFeeStructuresPageReturn => {
  const { showNotification } = useNotification();

  // Data state
  const { data: classesData, isLoading: classesLoading } = useClasses();
  const classes = classesData || [];
  const { allYears: academicYears } = useAcademicYear();

  // Filter state
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Fetch fee structures using react-query
  const { data: groupedStructuresData, isLoading: structuresLoading, refetch: fetchFeeStructuresGrouped } = useFeeStructuresGrouped({
    classId: selectedClass ? parseInt(selectedClass) : undefined,
    academicYearId: selectedYear ? parseInt(selectedYear) : undefined,
  });
  const groupedStructures = groupedStructuresData || [];
  const loading = classesLoading || structuresLoading;

  useEffect(() => {
    if (groupedStructuresData) {
      setExpandedGroups(new Set(groupedStructuresData.map((g) => `${g.classId}-${g.academicYearId}`)));
    }
  }, [groupedStructuresData]);

  // Form modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState<{
    group: FeeStructureGroup;
    componentId: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CreateFeeStructureDto>({
    classId: 0,
    academicYearId: 0,
    feeType: "",
    amount: 0,
    feeTerms: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Delete dialogs state
  const [deleteComponentDialog, setDeleteComponentDialog] = useState<DeleteDialogState>({
    isOpen: false,
    componentId: null,
    loading: false,
  });
  const [deleteGroupDialog, setDeleteGroupDialog] = useState<DeleteGroupDialogState>({
    isOpen: false,
    group: null,
    loading: false,
  });

  // Generate modal state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateData, setGenerateData] = useState({
    classId: 0,
    academicYearId: 0,
  });
  const [generating, setGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);



  // Computed values
  const filteredGroups = useMemo(() =>
    groupedStructures.filter(
      (g) =>
        g.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.academicYearName.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
    [groupedStructures, searchTerm],
  );

  const stats = useMemo(() => {
    const totalAnnualRevenue = groupedStructures.reduce(
      (sum, g) => sum + g.totalAnnualFee,
      0,
    );
    return {
      totalClasses: groupedStructures.length,
      totalAnnualRevenue,
      avgPerClass: totalAnnualRevenue / (groupedStructures.length || 1),
    };
  }, [groupedStructures]);

  // Group toggle
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

  // Form handlers
  const handleOpenCreate = useCallback(() => {
    setEditingStructure(null);
    setErrors({});
    const defaultYearId = selectedYear
      ? parseInt(selectedYear)
      : (academicYears[0]?.id ?? 0);
    setFormData({
      classId: 0,
      academicYearId: Number(defaultYearId),
      feeType: "",
      amount: 0,
      feeTerms: 1,
    });
    setShowCreateModal(true);
  }, [selectedYear, academicYears]);

  const handleOpenEdit = useCallback((group: FeeStructureGroup, componentId: number) => {
    const component = group.components.find((c) => c.id === componentId);
    if (!component) return;

    setEditingStructure({ group, componentId });
    setErrors({});
    setFormData({
      classId: group.classId,
      academicYearId: group.academicYearId,
      feeType: component.feeType,
      amount: component.annualAmount,
      feeTerms: group.feeTerms,
    });
    setShowCreateModal(true);
  }, []);

  const handleSave = useCallback(async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.classId) newErrors.classId = "Class is required";
    if (!formData.academicYearId)
      newErrors.academicYearId = "Academic year is required";
    if (!formData.feeType.trim()) newErrors.feeType = "Fee type is required";
    if (!formData.amount || formData.amount <= 0)
      newErrors.amount = "Amount must be greater than 0";
    if (!formData.feeTerms) newErrors.feeTerms = "Fee terms is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSaving(true);
      if (editingStructure) {
        await feeStructureService.updateFeeStructure(
          editingStructure.componentId,
          {
            feeType: formData.feeType,
            amount: formData.amount,
          },
        );
        showNotification("Fee component updated successfully", "success");
      } else {
        await feeStructureService.createFeeStructure(formData);
        showNotification(`${formData.feeType} fee added successfully`, "success");
      }
      setShowCreateModal(false);
      fetchFeeStructuresGrouped();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("same feeTerms") ||
        errorMessage.includes("feeTerms")
      ) {
        showNotification(
          "Fee terms must match existing fee structure for this class and academic year",
          "error",
        );
      } else if (errorMessage.includes("already exists")) {
        showNotification(
          "This fee type already exists for this class and academic year",
          "error",
        );
      } else {
        showNotification("Failed to save fee structure", "error");
      }
    } finally {
      setSaving(false);
    }
  }, [formData, editingStructure, showNotification, fetchFeeStructuresGrouped]);

  // Delete handlers
  const handleDeleteComponent = useCallback((componentId: number) => {
    setDeleteComponentDialog({ isOpen: true, componentId, loading: false });
  }, []);

  const confirmDeleteComponent = useCallback(async () => {
    if (!deleteComponentDialog.componentId) return;
    try {
      setDeleteComponentDialog((prev) => ({ ...prev, loading: true }));
      await feeStructureService.deleteFeeStructure(deleteComponentDialog.componentId);
      showNotification("Fee component deleted successfully", "success");
      setDeleteComponentDialog({ isOpen: false, componentId: null, loading: false });
      fetchFeeStructuresGrouped();
    } catch {
      showNotification("Failed to delete fee component", "error");
      setDeleteComponentDialog((prev) => ({ ...prev, loading: false }));
    }
  }, [deleteComponentDialog.componentId, showNotification, fetchFeeStructuresGrouped]);

  const handleDeleteGroup = useCallback((group: FeeStructureGroup) => {
    setDeleteGroupDialog({ isOpen: true, group, loading: false });
  }, []);

  const confirmDeleteGroup = useCallback(async () => {
    if (!deleteGroupDialog.group) return;
    try {
      setDeleteGroupDialog((prev) => ({ ...prev, loading: true }));
      await feeStructureService.deleteFeeStructureGroup(
        deleteGroupDialog.group.classId,
        deleteGroupDialog.group.academicYearId,
      );
      showNotification("All fee components deleted successfully", "success");
      setDeleteGroupDialog({ isOpen: false, group: null, loading: false });
      fetchFeeStructuresGrouped();
    } catch {
      showNotification("Failed to delete fee structures", "error");
      setDeleteGroupDialog((prev) => ({ ...prev, loading: false }));
    }
  }, [deleteGroupDialog.group, showNotification, fetchFeeStructuresGrouped]);

  // Delete dialog setters for ConfirmDialog component
  const setDeleteComponentDialogState = useCallback((state: DeleteDialogState) => {
    setDeleteComponentDialog(state);
  }, []);

  const setDeleteGroupDialogState = useCallback((state: DeleteGroupDialogState) => {
    setDeleteGroupDialog(state);
  }, []);

  // Generate handlers
  const openGenerateModal = useCallback(() => {
    setGenerateData({
      classId: selectedClass ? parseInt(selectedClass) : 0,
      academicYearId: selectedYear ? parseInt(selectedYear) : 0,
    });
    setGenerationResult(null);
    setShowGenerateModal(true);
  }, [selectedClass, selectedYear]);

  const handleGenerateTransactions = useCallback(async () => {
    if (!generateData.classId || !generateData.academicYearId) {
      showNotification("Please select a class and academic year", "error");
      return;
    }

    try {
      setGenerating(true);
      setGenerationResult(null);
      const result = await feeService.generateFeeTransactions({
        classId: generateData.classId,
        academicYearId: generateData.academicYearId,
      });
      setGenerationResult(result);

      if (result.generated > 0) {
        showNotification(
          `Generated ${result.generated} transactions. ${result.skippedStudents > 0 ? `(${result.skippedStudents} students skipped - already have transactions)` : ""}`,
          "success",
        );
      } else if (result.skippedStudents > 0) {
        showNotification(
          "All students already have transactions for this year.",
          "info",
        );
      } else {
        showNotification("No transactions were generated.", "info");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate fee transactions";
      showNotification(message, "error");
    } finally {
      setGenerating(false);
    }
  }, [generateData, showNotification]);

  return {
    // Data
    groupedStructures,
    filteredGroups,
    classes,
    academicYears,
    loading,
    
    // Stats
    stats,
    
    // Filters
    selectedClass,
    setSelectedClass,
    selectedYear,
    setSelectedYear,
    searchTerm,
    setSearchTerm,
    
    // Group expansion
    expandedGroups,
    toggleGroup,
    
    // Form modal
    showCreateModal,
    setShowCreateModal,
    editingStructure,
    formData,
    setFormData,
    errors,
    setErrors,
    saving,
    handleOpenCreate,
    handleOpenEdit,
    handleSave,
    
    // Delete dialogs
    deleteComponentDialog,
    setDeleteComponentDialog: setDeleteComponentDialogState,
    handleDeleteComponent,
    confirmDeleteComponent,
    deleteGroupDialog,
    setDeleteGroupDialog: setDeleteGroupDialogState,
    handleDeleteGroup,
    confirmDeleteGroup,
    
    // Generate modal
    showGenerateModal,
    setShowGenerateModal,
    generateData,
    setGenerateData,
    generating,
    generationResult,
    openGenerateModal,
    handleGenerateTransactions,
  };
};
