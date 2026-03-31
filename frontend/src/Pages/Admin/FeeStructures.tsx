import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { 
  feeStructureService, 
  type FeeStructureGroup,
  type CreateFeeStructureDto 
} from '../../services/feeStructureService';
import { feeService } from '../../services/feeService';
import { classService } from '../../services/classService';
import { academicYearService } from '../../services/academicYearService';
import type { Class } from '../../types/class';
import type { AcademicYear } from '../../types/academicYear';
import { Receipt, Plus, Trash2, DollarSign, PlayCircle, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { BaseModal } from '../../components/common/BaseModal';
import { Button } from '../../components/ui/button';
import InputField from '../../components/ui/InputField';
import { SkeletonTable } from '../../components/common/Skeleton';

const FeeStructures: React.FC = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [groupedStructures, setGroupedStructures] = useState<FeeStructureGroup[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState<{ group: FeeStructureGroup; componentId: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateData, setGenerateData] = useState({
    classId: 0,
    academicYearId: 0,
  });
  const [generating, setGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<{
    feeTerms: number;
    totalAnnualFee: number;
    perTermAmount: number;
    termBreakdown: Record<string, number>;
    generated: number;
    skippedStudents: number;
  } | null>(null);
  const [formData, setFormData] = useState<CreateFeeStructureDto>({
    classId: 0,
    academicYearId: 0,
    feeType: '',
    amount: 0,
    feeTerms: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchClasses = useCallback(async () => {
    try {
      const data = await classService.getClasses();
      setClasses(data);
    } catch {
      showNotification('Failed to fetch classes', 'error');
    }
  }, [showNotification]);

  const fetchAcademicYears = useCallback(async () => {
    try {
      const data = await academicYearService.getAllYears();
      setAcademicYears(data);
    } catch {
      showNotification('Failed to fetch academic years', 'error');
    }
  }, [showNotification]);

  const getFeeTermsLabel = (feeTerms: number): string => {
    switch (feeTerms) {
      case 1: return 'Yearly';
      case 2: return 'Half-yearly';
      case 4: return 'Quarterly';
      case 12: return 'Monthly';
      default: return `${feeTerms} terms`;
    }
  };

  const fetchFeeStructuresGrouped = useCallback(async () => {
    try {
      setLoading(true);
      const filters: {
        classId?: number;
        academicYearId?: number;
      } = {};
      
      if (selectedClass) filters.classId = parseInt(selectedClass);
      if (selectedYear) filters.academicYearId = parseInt(selectedYear);
      
      const data = await feeStructureService.getFeeStructuresGrouped(filters);
      setGroupedStructures(data);
      setExpandedGroups(new Set(data.map(g => `${g.classId}-${g.academicYearId}`)));
    } catch {
      showNotification('Failed to fetch fee structures', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedYear, showNotification]);

  useEffect(() => {
    fetchClasses();
    fetchAcademicYears();
  }, [fetchClasses, fetchAcademicYears]);

  useEffect(() => {
    fetchFeeStructuresGrouped();
  }, [fetchFeeStructuresGrouped]);

  const filteredGroups = groupedStructures.filter(g =>
    g.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.academicYearName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAnnualRevenue = groupedStructures.reduce((sum, g) => sum + g.totalAnnualFee, 0);
  const totalClasses = groupedStructures.length;

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleOpenCreate = () => {
    setEditingStructure(null);
    setErrors({});
    const defaultClassId = selectedClass ? parseInt(selectedClass) : (classes[0]?.id ?? 0);
    const defaultYearId = selectedYear ? parseInt(selectedYear) : (academicYears[0]?.id ?? 0);
    const existingGroup = groupedStructures.find(
      g => g.classId === defaultClassId && g.academicYearId === defaultYearId
    );
    setFormData({
      classId: Number(defaultClassId),
      academicYearId: Number(defaultYearId),
      feeType: '',
      amount: 0,
      feeTerms: existingGroup?.feeTerms || 1,
    });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (group: FeeStructureGroup, componentId: number) => {
    const component = group.components.find(c => c.id === componentId);
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
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.classId) newErrors.classId = 'Class is required';
    if (!formData.academicYearId) newErrors.academicYearId = 'Academic year is required';
    if (!formData.feeType.trim()) newErrors.feeType = 'Fee type is required';
    if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (!formData.feeTerms) newErrors.feeTerms = 'Fee terms is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSaving(true);
      if (editingStructure) {
        await feeStructureService.updateFeeStructure(editingStructure.componentId, {
          feeType: formData.feeType,
          amount: formData.amount,
        });
        showNotification('Fee component updated successfully', 'success');
      } else {
        const response = await feeStructureService.createFeeStructure(formData);
        showNotification(
          `Added ${formData.feeType}. Total annual: ${formatCurrency(response.group.totalAnnualFee)} (${formatCurrency(response.group.perTermAmount)}/term)`,
          'success'
        );
      }
      setShowCreateModal(false);
      fetchFeeStructuresGrouped();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('same feeTerms') || errorMessage.includes('feeTerms')) {
        showNotification('Fee terms must match existing fee structure for this class and academic year', 'error');
      } else if (errorMessage.includes('already exists')) {
        showNotification('This fee type already exists for this class and academic year', 'error');
      } else {
        showNotification('Failed to save fee structure', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComponent = async (componentId: number) => {
    if (!confirm('Are you sure you want to delete this fee component?')) return;
    
    try {
      await feeStructureService.deleteFeeStructure(componentId);
      showNotification('Fee component deleted successfully', 'success');
      fetchFeeStructuresGrouped();
    } catch {
      showNotification('Failed to delete fee component', 'error');
    }
  };

  const handleDeleteGroup = async (group: FeeStructureGroup) => {
    if (!confirm(`Are you sure you want to delete ALL fee components for ${group.className} - ${group.academicYearName}? This will remove all ${group.components.length} components.`)) return;
    
    try {
      await feeStructureService.deleteFeeStructureGroup(group.classId, group.academicYearId);
      showNotification('All fee components deleted successfully', 'success');
      fetchFeeStructuresGrouped();
    } catch {
      showNotification('Failed to delete fee structures', 'error');
    }
  };

  const handleGenerateTransactions = async () => {
    if (!generateData.classId || !generateData.academicYearId) {
      showNotification('Please select a class and academic year', 'error');
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
          `Generated ${result.generated} transactions. ${result.skippedStudents > 0 ? `(${result.skippedStudents} students skipped - already have transactions)` : ''}`,
          'success'
        );
      } else if (result.skippedStudents > 0) {
        showNotification('All students already have transactions for this year.', 'info');
      } else {
        showNotification('No transactions were generated.', 'info');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate fee transactions';
      showNotification(message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const openGenerateModal = () => {
    setGenerateData({
      classId: selectedClass ? parseInt(selectedClass) : 0,
      academicYearId: selectedYear ? parseInt(selectedYear) : 0,
    });
    setGenerationResult(null);
    setShowGenerateModal(true);
  };

  const getGroupKey = (group: FeeStructureGroup) => `${group.classId}-${group.academicYearId}`;

  return (
    <AdminLayout title="Fee Structures">
      <div className="space-y-6 pb-12">
        <PageHeader 
          title="Fee Structures"
          subtitle="Manage fee structures for different classes"
          breadcrumb={{
            links: [
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Fee Structures", active: true }
            ]
          }}
          actions={[
            {
              label: "Add Component",
              icon: Plus,
              onClick: handleOpenCreate
            },
            {
              label: "Generate Transactions",
              icon: PlayCircle,
              onClick: openGenerateModal,
              variant: 'success'
            }
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalClasses}</p>
                <p className="text-sm text-slate-500">Classes with Fees</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Receipt className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalAnnualRevenue)}</p>
                <p className="text-sm text-emerald-600">Total Annual Fee</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-700">
                  {formatCurrency(totalAnnualRevenue / (totalClasses || 1))}
                </p>
                <p className="text-sm text-purple-600">Avg Per Class</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <FilterBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onReset={() => { setSearchTerm(''); setSelectedClass(''); setSelectedYear(''); }}
          searchPlaceholder="Search by class or academic year..."
        >
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 min-w-40"
          >
            <option value="">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name} {cls.section ? `- ${cls.section}` : ''}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 min-w-40"
          >
            <option value="">All Years</option>
            {academicYears.map(year => (
              <option key={year.id} value={year.id}>{year.name}</option>
            ))}
          </select>
        </FilterBar>

        {loading ? (
          <SkeletonTable columns={4} rows={5} />
        ) : filteredGroups.length > 0 ? (
          <div className="space-y-4">
            {filteredGroups.map((group) => {
              const groupKey = getGroupKey(group);
              const isExpanded = expandedGroups.has(groupKey);
              
              return (
                <div key={groupKey} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div 
                    className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleGroup(groupKey)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          {group.className} {group.classSection ? `- Section ${group.classSection}` : ''}
                        </h3>
                        <p className="text-sm text-slate-500">{group.academicYearName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-600">{getFeeTermsLabel(group.feeTerms)}</p>
                        <p className="text-xs text-slate-500">{group.components.length} components</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600">{formatCurrency(group.perTermAmount)}</p>
                        <p className="text-xs text-slate-500">per term</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-purple-600">{formatCurrency(group.totalAnnualFee)}</p>
                        <p className="text-xs text-slate-500">annual</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group);
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete all components"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="border-t border-slate-200">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fee Type</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Annual Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Per Term</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {group.components.map((component) => (
                            <tr key={component.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <span className="text-sm font-medium text-slate-900">{component.feeType}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-semibold text-slate-700">{formatCurrency(component.annualAmount)}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-slate-600">
                                  {formatCurrency(component.annualAmount / group.feeTerms)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleOpenEdit(group, component.id)}
                                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4 text-blue-500" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComponent(component.id)}
                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Receipt}
            title="No fee structures found"
            description={searchTerm || selectedClass || selectedYear ? "Try adjusting your filters" : "Add fee structures to get started"}
            action={{
              label: "Add Fee Component",
              icon: Plus,
              onClick: handleOpenCreate
            }}
          />
        )}

        <BaseModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title={editingStructure ? 'Edit Fee Component' : 'Add Fee Component'}
          size="md"
        >
          <div className="p-6 space-y-4">
            {!editingStructure && (
              <>
                <div>
                  <div className="flex justify-between items-center px-1 mb-1">
                    <label className={`block text-xs font-semibold ${errors.classId ? 'text-red-500' : 'text-slate-700'}`}>Class</label>
                    {errors.classId && <span className="text-[10px] font-bold text-red-500">{errors.classId}</span>}
                  </div>
                  <select
                    value={formData.classId || ''}
                    onChange={(e) => {
                      const newClassId = parseInt(e.target.value);
                      const existingGroup = groupedStructures.find(
                        g => g.classId === newClassId && g.academicYearId === formData.academicYearId
                      );
                      setFormData({ 
                        ...formData, 
                        classId: newClassId,
                        feeTerms: existingGroup?.feeTerms || formData.feeTerms,
                      });
                      if (errors.classId) setErrors(prev => { const next = { ...prev }; delete next.classId; return next; });
                    }}
                    className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 ${errors.classId ? 'border-red-500 bg-red-50/30 focus:ring-red-500/10' : 'border-slate-200 focus:ring-blue-500'} text-slate-700`}
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name} {cls.section ? `- ${cls.section}` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-center px-1 mb-1">
                    <label className={`block text-xs font-semibold ${errors.academicYearId ? 'text-red-500' : 'text-slate-700'}`}>Academic Year</label>
                    {errors.academicYearId && <span className="text-[10px] font-bold text-red-500">{errors.academicYearId}</span>}
                  </div>
                  <select
                    value={formData.academicYearId || ''}
                    onChange={(e) => {
                      const newYearId = parseInt(e.target.value);
                      const existingGroup = groupedStructures.find(
                        g => g.classId === formData.classId && g.academicYearId === newYearId
                      );
                      setFormData({ 
                        ...formData, 
                        academicYearId: newYearId,
                        feeTerms: existingGroup?.feeTerms || formData.feeTerms,
                      });
                      if (errors.academicYearId) setErrors(prev => { const next = { ...prev }; delete next.academicYearId; return next; });
                    }}
                    className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 ${errors.academicYearId ? 'border-red-500 bg-red-50/30 focus:ring-red-500/10' : 'border-slate-200 focus:ring-blue-500'} text-slate-700`}
                  >
                    <option value="">Select Year</option>
                    {academicYears.map(year => (
                      <option key={year.id} value={year.id}>{year.name}</option>
                    ))}
                  </select>
                </div>
                {formData.classId && formData.academicYearId && (
                  (() => {
                    const existingGroup = groupedStructures.find(
                      g => g.classId === formData.classId && g.academicYearId === formData.academicYearId
                    );
                    if (existingGroup) {
                      return (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-700">
                            <strong>Note:</strong> This class+year already has fee components. 
                            Fee terms is locked to <strong>{getFeeTermsLabel(existingGroup.feeTerms)}</strong>.
                            Total annual: {formatCurrency(existingGroup.totalAnnualFee)}.
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()
                )}
              </>
            )}
            <InputField
              label="Fee Type"
              placeholder="e.g., Tuition Fee, Lab Fee, Library Fee"
              value={formData.feeType}
              onChange={(e) => {
                setFormData({ ...formData, feeType: e.target.value });
                if (errors.feeType) setErrors(prev => { const next = { ...prev }; delete next.feeType; return next; });
              }}
              error={errors.feeType}
            />
            <InputField
              label="Annual Amount"
              type="number"
              placeholder="Enter annual amount"
              value={formData.amount || ''}
              onChange={(e) => {
                setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 });
                if (errors.amount) setErrors(prev => { const next = { ...prev }; delete next.amount; return next; });
              }}
              error={errors.amount}
            />
            {formData.amount > 0 && formData.feeTerms > 0 && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm text-slate-600">
                  <strong>Per term amount:</strong> {formatCurrency(formData.amount / formData.feeTerms)}
                  <span className="text-slate-400 ml-2">({formData.amount} / {formData.feeTerms})</span>
                </p>
              </div>
            )}
            {!editingStructure && (
              <div>
                <div className="flex justify-between items-center px-1 mb-1">
                  <label className={`block text-xs font-semibold ${errors.feeTerms ? 'text-red-500' : 'text-slate-700'}`}>Fee Terms</label>
                  {errors.feeTerms && <span className="text-[10px] font-bold text-red-500">{errors.feeTerms}</span>}
                </div>
                <select
                  value={formData.feeTerms || ''}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      feeTerms: parseInt(e.target.value) || 0
                    });
                    if (errors.feeTerms) setErrors(prev => { const next = { ...prev }; delete next.feeTerms; return next; });
                  }}
                  disabled={groupedStructures.some(
                    g => g.classId === formData.classId && g.academicYearId === formData.academicYearId
                  )}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 ${errors.feeTerms ? 'border-red-500 bg-red-50/30 focus:ring-red-500/10' : 'border-slate-200 focus:ring-blue-500'} text-slate-700 disabled:bg-slate-100 disabled:cursor-not-allowed`}
                >
                  <option value="">Select Fee Terms</option>
                  <option value="1">Yearly (1 installment)</option>
                  <option value="2">Half-yearly (2 installments)</option>
                  <option value="4">Quarterly (4 installments)</option>
                  <option value="12">Monthly (12 installments)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {groupedStructures.some(
                    g => g.classId === formData.classId && g.academicYearId === formData.academicYearId
                  ) ? 'Fee terms is locked because this class+year already has components.' : 'All components in the same class+year must have the same fee terms.'}
                </p>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving} className="flex-1">
                {editingStructure ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </BaseModal>

        <BaseModal
          isOpen={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
          title="Generate Fee Transactions"
          size="lg"
        >
          <div className="p-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-amber-700 font-medium">
                    This will create fee transactions for ALL active students in the selected class.
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Students who already have transactions for this year will be skipped.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Class</label>
                <select
                  value={generateData.classId || ''}
                  onChange={(e) => {
                    const classId = parseInt(e.target.value);
                    setGenerateData(prev => ({ ...prev, classId }));
                    const group = groupedStructures.find(g => g.classId === classId);
                    if (group) {
                      setGenerateData(prev => ({ ...prev, academicYearId: group.academicYearId }));
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name} {cls.section ? `- ${cls.section}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Academic Year</label>
                <select
                  value={generateData.academicYearId || ''}
                  onChange={(e) => setGenerateData(prev => ({ ...prev, academicYearId: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Year</option>
                  {academicYears.map(year => (
                    <option key={year.id} value={year.id}>{year.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {generateData.classId > 0 && generateData.academicYearId > 0 && (() => {
              const selectedGroup = groupedStructures.find(
                g => g.classId === generateData.classId && g.academicYearId === generateData.academicYearId
              );
              if (!selectedGroup) {
                return (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">
                      No fee structure exists for this class and academic year. Please create fee components first.
                    </p>
                  </div>
                );
              }
              return (
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700">Fee Structure Preview</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{formatCurrency(selectedGroup.totalAnnualFee)}</p>
                      <p className="text-xs text-slate-500">Annual Total</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">{formatCurrency(selectedGroup.perTermAmount)}</p>
                      <p className="text-xs text-slate-500">Per Term ({getFeeTermsLabel(selectedGroup.feeTerms)})</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{selectedGroup.components.length}</p>
                      <p className="text-xs text-slate-500">Components</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-200 pt-3">
                    <p className="text-xs text-slate-500 mb-2">Per-term breakdown:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedGroup.components.map(c => (
                        <span key={c.id} className="px-2 py-1 bg-white rounded text-xs">
                          {c.feeType}: {formatCurrency(c.annualAmount / selectedGroup.feeTerms)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {generationResult && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-emerald-700 mb-3">Generation Complete</h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{generationResult.generated}</p>
                    <p className="text-xs text-emerald-600">Transactions Generated</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-600">{generationResult.skippedStudents}</p>
                    <p className="text-xs text-slate-500">Students Skipped</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-emerald-200">
                  <p className="text-xs text-emerald-600">
                    <strong>Per term:</strong> {formatCurrency(generationResult.perTermAmount)} | 
                    <strong> Annual:</strong> {formatCurrency(generationResult.totalAnnualFee)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowGenerateModal(false)} className="flex-1">
                {generationResult ? 'Close' : 'Cancel'}
              </Button>
              {!generationResult && (
                <Button 
                  onClick={handleGenerateTransactions} 
                  loading={generating} 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={!generateData.classId || !generateData.academicYearId}
                >
                  Generate Transactions
                </Button>
              )}
            </div>
          </div>
        </BaseModal>
      </div>
    </AdminLayout>
  );
};

export default FeeStructures;
