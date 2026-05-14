import React, { useState } from 'react';
import { BaseModal } from './BaseModal';
import type { FeeStructureGroup } from '../../services/feeStructureService';
import type { Class } from '../../types/class';
import type { AcademicYear } from '../../types/academicYear';
import { getFeeTermsLabel } from '../../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const feeStructureFormSchema = z.object({
  classId: z.number().min(1, 'Class is required'),
  academicYearId: z.number().min(1, 'Academic year is required'),
  feeType: z.string().min(1, 'Fee type is required'),
  amount: z.number().min(0.01, 'Amount is required'),
  feeTerms: z.number().min(1, 'Fee terms is required'),
});

interface FeeStructureFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStructure: { group: FeeStructureGroup; componentId: number } | null;
  onSave: (data: { feeType: string; amount: number; classId?: number; academicYearId?: number; feeTerms?: number }) => Promise<void>;
  saving: boolean;
  classes: Class[];
  academicYears: AcademicYear[];
  groupedStructures: FeeStructureGroup[];
}

const FeeStructureFormModal: React.FC<FeeStructureFormModalProps> = ({
  isOpen,
  onClose,
  editingStructure,
  onSave,
  saving,
  classes,
  academicYears,
  groupedStructures,
}) => {
  const isEditing = !!editingStructure;
  const [savingLocal, setSavingLocal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof feeStructureFormSchema>>({
    resolver: zodResolver(feeStructureFormSchema),
  });

  const watchClassId = watch('classId');
  const watchAcademicYearId = watch('academicYearId');
  const watchFeeTerms = watch('feeTerms');

  const existingFeeTerms = groupedStructures.find(
    (g) => g.classId === watchClassId && g.academicYearId === watchAcademicYearId
  )?.feeTerms;

  const showFeeTermsError = !isEditing && existingFeeTerms && existingFeeTerms !== watchFeeTerms;

  const onSubmit = async (data: z.infer<typeof feeStructureFormSchema>) => {
    try {
      setSavingLocal(true);
      const payload: { feeType: string; amount: number; classId?: number; academicYearId?: number; feeTerms?: number } = {
        feeType: data.feeType,
        amount: data.amount,
      };
      if (!isEditing) {
        payload.classId = data.classId;
        payload.academicYearId = data.academicYearId;
        payload.feeTerms = data.feeTerms;
      }
      await onSave(payload);
      reset();
    } finally {
      setSavingLocal(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => { onClose(); reset(); }}
      title={isEditing ? 'Edit Fee Component' : 'Add Fee Component'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        {!isEditing && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  errors.classId ? 'border-red-500' : 'border-slate-200'
                }`}
                {...register('classId', { valueAsNumber: true })}
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.section && `- ${cls.section}`}
                  </option>
                ))}
              </select>
              {errors.classId && (
                <p className="text-xs text-red-500 mt-1">{errors.classId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  errors.academicYearId ? 'border-red-500' : 'border-slate-200'
                }`}
                {...register('academicYearId', { valueAsNumber: true })}
              >
                <option value="">Select Academic Year</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
              </select>
              {errors.academicYearId && (
                <p className="text-xs text-red-500 mt-1">{errors.academicYearId.message}</p>
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
            placeholder="e.g., Tuition Fee, Transport Fee"
            className={`w-full px-3 py-2 border rounded-lg text-sm ${
              errors.feeType ? 'border-red-500' : 'border-slate-200'
            }`}
            {...register('feeType')}
          />
          {errors.feeType && (
            <p className="text-xs text-red-500 mt-1">{errors.feeType.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Annual Amount (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            className={`w-full px-3 py-2 border rounded-lg text-sm ${
              errors.amount ? 'border-red-500' : 'border-slate-200'
            }`}
            {...register('amount', { valueAsNumber: true })}
          />
          {errors.amount && (
            <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>
          )}
        </div>

        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fee Terms <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                showFeeTermsError ? 'border-red-500' : 'border-slate-200'
              }`}
              {...register('feeTerms', { valueAsNumber: true })}
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
            onClick={() => { onClose(); reset(); }}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || savingLocal}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving || savingLocal ? 'Saving...' : isEditing ? 'Update' : 'Add'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export { FeeStructureFormModal };
