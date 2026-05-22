import React, { useState, useRef, useEffect } from 'react';
import { BaseModal } from './BaseModal';
import type { FeeStructureGroup } from '../../services/feeStructureService';
import type { Class } from '../../types/class';
import type { AcademicYear } from '../../types/academicYear';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { feeStructureService } from '../../services/feeStructureService';
import { ChevronDown, Plus } from 'lucide-react';

const COMMON_FEE_TYPES = [
  'Tuition Fee',
  'Exam Fee',
  'Library Fee',
  'Sports Fee',
  'Transport Fee',
  'Hostel Fee',
  'Lab Fee',
  'Activity Fee',
  'Computer Fee',
  'Annual Function Fee',
  'Registration Fee',
  'Development Fee',
];

const feeStructureFormSchema = z.object({
  classId: z.number().min(1, 'Class is required'),
  academicYearId: z.number().min(1, 'Academic year is required'),
  feeType: z.string().min(1, 'Fee type is required'),
  amount: z.number().min(0.01, 'Amount is required'),
  feeTerms: z.number().min(1, 'Fee terms is required'),
});

interface FeeTypeComboBoxProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

const FeeTypeComboBox: React.FC<FeeTypeComboBoxProps> = ({ value, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: existingTypes = [] } = useQuery<string[]>({
    queryKey: ['fee-types'],
    queryFn: () => feeStructureService.getUniqueFeeTypes(),
    staleTime: 5 * 60 * 1000,
  });

  // Merge DB types + common defaults, deduplicated
  const allSuggestions = Array.from(new Set([...existingTypes, ...COMMON_FEE_TYPES])).sort();

  const filtered = inputValue.trim()
    ? allSuggestions.filter(t => t.toLowerCase().includes(inputValue.toLowerCase()))
    : allSuggestions;

  const isCustom = inputValue.trim() && !allSuggestions.some(t => t.toLowerCase() === inputValue.toLowerCase());

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const select = (type: string) => {
    setInputValue(type);
    onChange(type);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className={`flex items-center border rounded-lg overflow-hidden ${error ? 'border-red-500' : 'border-slate-200'} bg-white`}>
        <input
          type="text"
          value={inputValue}
          placeholder="e.g., Library Fee, Sports Fee…"
          className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
          onChange={e => {
            setInputValue(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        <button
          type="button"
          title="Show fee type suggestions"
          onClick={() => setOpen(o => !o)}
          className="px-2 py-2 text-slate-400 hover:text-slate-600"
        >
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {isCustom && (
            <button
              type="button"
              onMouseDown={() => select(inputValue.trim())}
              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-blue-600 hover:bg-blue-50 font-medium border-b border-slate-100"
            >
              <Plus size={13} />
              Add "{inputValue.trim()}" as new fee type
            </button>
          )}
          {filtered.length === 0 && !isCustom ? (
            <p className="px-3 py-2 text-xs text-slate-400">Type a name to create a new fee type</p>
          ) : (
            filtered.map(type => (
              <button
                key={type}
                type="button"
                onMouseDown={() => select(type)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                  type === value ? 'text-blue-600 font-semibold bg-blue-50' : 'text-slate-700'
                }`}
              >
                {type}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

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
}) => {
  const isEditing = !!editingStructure;
  const [savingLocal, setSavingLocal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<z.infer<typeof feeStructureFormSchema>>({
    resolver: zodResolver(feeStructureFormSchema),
  });

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
          <Controller
            name="feeType"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <FeeTypeComboBox
                value={field.value}
                onChange={field.onChange}
                error={errors.feeType?.message}
              />
            )}
          />
          {errors.feeType && (
            <p className="text-xs text-red-500 mt-1">{errors.feeType.message}</p>
          )}
          <p className="text-xs text-slate-400 mt-1">
            Pick from suggestions or type any new fee type name.
          </p>
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
              Billing Cycle <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              {...register('feeTerms', { valueAsNumber: true })}
            >
              <option value={1}>Yearly (paid once a year)</option>
              <option value={2}>Half-Yearly (2 instalments)</option>
              <option value={4}>Quarterly (4 instalments)</option>
              <option value={12}>Monthly (12 instalments)</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Each fee type can have its own billing cycle.
            </p>
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
