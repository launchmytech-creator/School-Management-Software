import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { feeStructureService, type FeeStructure, type CreateFeeStructureDto } from '../../services/feeStructureService';
import { classService } from '../../services/classService';
import { academicYearService } from '../../services/academicYearService';
import type { Class } from '../../types/class';
import type { AcademicYear } from '../../types/academicYear';
import { Receipt, Plus, Edit2, Trash2, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { BaseModal } from '../../components/common/BaseModal';
import { Button } from '../../components/ui/button';
import InputField from '../../components/ui/InputField';
import { SkeletonTable } from '../../components/common/Skeleton';

const FeeStructures: React.FC = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CreateFeeStructureDto>({
    classId: 0,
    academicYearId: 0,
    feeType: '',
    amount: 0,
    termNumber: undefined,
  });

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

  const fetchFeeStructures = useCallback(async () => {
    try {
      setLoading(true);
      const filters: {
        classId?: number;
        academicYearId?: number;
      } = {};
      
      if (selectedClass) filters.classId = parseInt(selectedClass);
      if (selectedYear) filters.academicYearId = parseInt(selectedYear);
      
      const data = await feeStructureService.getFeeStructures(filters);
      setFeeStructures(data);
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
    fetchFeeStructures();
  }, [fetchFeeStructures]);

  const filteredStructures = feeStructures.filter(s =>
    s.feeType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedStructures = filteredStructures.reduce((acc, curr) => {
    const key = `${curr.className} - ${curr.academicYearName}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(curr);
    return acc;
  }, {} as Record<string, FeeStructure[]>);

  const totalAmount = feeStructures.reduce((sum, s) => sum + s.amount, 0);

  const handleOpenCreate = () => {
    setEditingStructure(null);
    const defaultClassId = selectedClass ? parseInt(selectedClass) : (classes[0]?.id ?? 0);
    const defaultYearId = selectedYear ? parseInt(selectedYear) : (academicYears[0]?.id ?? 0);
    setFormData({
      classId: Number(defaultClassId),
      academicYearId: Number(defaultYearId),
      feeType: '',
      amount: 0,
      termNumber: undefined,
    });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (structure: FeeStructure) => {
    setEditingStructure(structure);
    setFormData({
      classId: structure.classId,
      academicYearId: structure.academicYearId,
      feeType: structure.feeType,
      amount: structure.amount,
      termNumber: structure.termNumber || undefined,
    });
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!formData.feeType || !formData.amount || !formData.classId || !formData.academicYearId) {
      showNotification('Please fill all required fields', 'error');
      return;
    }

    try {
      setSaving(true);
      if (editingStructure) {
        await feeStructureService.updateFeeStructure(editingStructure.id, {
          feeType: formData.feeType,
          amount: formData.amount,
        });
        showNotification('Fee structure updated successfully', 'success');
      } else {
        await feeStructureService.createFeeStructure(formData);
        showNotification('Fee structure created successfully', 'success');
      }
      setShowCreateModal(false);
      fetchFeeStructures();
    } catch {
      showNotification('Failed to save fee structure', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this fee structure?')) return;
    
    try {
      await feeStructureService.deleteFeeStructure(id);
      showNotification('Fee structure deleted successfully', 'success');
      fetchFeeStructures();
    } catch {
      showNotification('Failed to delete fee structure', 'error');
    }
  };

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
              label: "Add Structure",
              icon: Plus,
              onClick: handleOpenCreate
            }
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">{feeStructures.length}</p>
                <p className="text-sm text-slate-500">Total Structures</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Receipt className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-700">{Object.keys(groupedStructures).length}</p>
                <p className="text-sm text-emerald-600">Classes with Fees</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-700">{formatCurrency(totalAmount)}</p>
                <p className="text-sm text-purple-600">Total Amount</p>
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
          searchPlaceholder="Search by fee type or class..."
        >
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 min-w-40"
          >
            <option value="">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name} - {cls.section || 'A'}</option>
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
          <SkeletonTable columns={5} rows={10} />
        ) : Object.keys(groupedStructures).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedStructures).map(([groupName, structures]) => (
              <div key={groupName}>
                <h3 className="text-lg font-bold text-slate-900 mb-4">{groupName}</h3>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fee Type</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Term</th>
                        <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {structures.map((structure) => (
                        <tr key={structure.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-slate-900">{structure.feeType}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-emerald-600">{formatCurrency(structure.amount)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                              {structure.termNumber ? `Term ${structure.termNumber}` : 'Annual'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEdit(structure)}
                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4 text-blue-500" />
                              </button>
                              <button
                                onClick={() => handleDelete(structure.id)}
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
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Receipt}
            title="No fee structures found"
            description={searchTerm || selectedClass || selectedYear ? "Try adjusting your filters" : "Add fee structures to get started"}
            action={{
              label: "Add Fee Structure",
              icon: Plus,
              onClick: handleOpenCreate
            }}
          />
        )}

        <BaseModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title={editingStructure ? 'Edit Fee Structure' : 'Add Fee Structure'}
          size="md"
        >
          <div className="p-6 space-y-4">
            {!editingStructure && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Class</label>
                  <select
                    value={formData.classId || ''}
                    onChange={(e) => setFormData({ ...formData, classId: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name} - {cls.section || 'A'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Academic Year</label>
                  <select
                    value={formData.academicYearId || ''}
                    onChange={(e) => setFormData({ ...formData, academicYearId: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Year</option>
                    {academicYears.map(year => (
                      <option key={year.id} value={year.id}>{year.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <InputField
              label="Fee Type"
              placeholder="e.g., Tuition Fee, Lab Fee, Library Fee"
              value={formData.feeType}
              onChange={(e) => setFormData({ ...formData, feeType: e.target.value })}
            />
            <InputField
              label="Amount"
              type="number"
              placeholder="Enter amount"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Term (Optional)</label>
              <select
                value={formData.termNumber || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  termNumber: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Annual</option>
                {[1, 2, 3, 4].map(term => (
                  <option key={term} value={term}>Term {term}</option>
                ))}
              </select>
            </div>
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
      </div>
    </AdminLayout>
  );
};

export default FeeStructures;
