import React from 'react';
import { BaseModal } from '../common/BaseModal';
import type { CreateFeeStructureDto, FeeStructureGroup } from '../../services/feeStructureService';
import type { Class } from '../../types/class';
import type { AcademicYear } from '../../types/academicYear';
import { getFeeTermsLabel } from '../../lib/utils';

interface FeeStructureFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStructure: { group: FeeStructureGroup; componentId: number } | null;
  formData: CreateFeeStructureDto;
  onFormDataChange: (data: CreateFeeStructureDto) => void;
  errors: Record<string, string>;
  onErrorsChange: (errors: Record<string, string>) => void;
  onSave: () => Promise<void>;
  saving: boolean;
  classes: Class[];
  academicYears: AcademicYear[];
  groupedStructures: FeeStructureGroup[];
}

const FeeStructureFormModal: React.FC<FeeStructureFormModalProps> = ({
  isOpen,
  onClose,
  editingStructure,
  formData,
  onFormDataChange,
  errors,
  onErrorsChange,
  onSave,
  saving,
  classes,
  academicYears,
  groupedStructures,
}) => {
  const isEditing = !!editingStructure;

  const handleChange = (field: keyof CreateFeeStructureDto, value: string | number) => {
    onFormDataChange({ ...formData, [field]: value });
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      onErrorsChange(newErrors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave();
  };

  const existingFeeTerms = groupedStructures.find(
    (g) => g.classId === formData.classId && g.academicYearId === formData.academicYearId
  )?.feeTerms;

  const showFeeTermsError = !isEditing && existingFeeTerms && existingFeeTerms !== formData.feeTerms;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Fee Component' : 'Add Fee Component'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {!isEditing && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.classId || ''}
                onChange={(e) => handleChange('classId', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  errors.classId ? 'border-red-500' : 'border-slate-200'
                }`}
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.section && `- ${cls.section}`}
                  </option>
                ))}
              </select>
              {errors.classId && (
                <p className="text-xs text-red-500 mt-1">{errors.classId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.academicYearId || ''}
                onChange={(e) => handleChange('academicYearId', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  errors.academicYearId ? 'border-red-500' : 'border-slate-200'
                }`}
              >
                <option value="">Select Academic Year</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
              </select>
              {errors.academicYearId && (
                <p className="text-xs text-red-500 mt-1">{errors.academicYearId}</p>
              )}
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Fee Type <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.feeType}
            onChange={(e) => handleChange('feeType', e.target.value)}
            placeholder="e.g., Tuition Fee, Transport Fee"
            className={`w-full px-3 py-2 border rounded-lg text-sm ${
              errors.feeType ? 'border-red-500' : 'border-slate-200'
            }`}
          />
          {errors.feeType && (
            <p className="text-xs text-red-500 mt-1">{errors.feeType}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Annual Amount (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.amount || ''}
            onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className={`w-full px-3 py-2 border rounded-lg text-sm ${
              errors.amount ? 'border-red-500' : 'border-slate-200'
            }`}
          />
          {errors.amount && (
            <p className="text-xs text-red-500 mt-1">{errors.amount}</p>
          )}
        </div>

        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fee Terms <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.feeTerms}
              onChange={(e) => handleChange('feeTerms', parseInt(e.target.value))}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                showFeeTermsError ? 'border-red-500' : 'border-slate-200'
              }`}
            >
              <option value={1}>Yearly (1)</option>
              <option value={2}>Half-yearly (2)</option>
              <option value={4}>Quarterly (4)</option>
              <option value={12}>Monthly (12)</option>
            </select>
            {existingFeeTerms && (
              <p className="text-xs text-slate-500 mt-1">
                Existing structure uses {getFeeTermsLabel(existingFeeTerms)}. 
                Fee terms must match for the same class and academic year.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEditing ? 'Update' : 'Add'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export { FeeStructureFormModal };
