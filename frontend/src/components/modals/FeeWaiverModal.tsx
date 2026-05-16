import React, { useState } from 'react';
import { BaseModal } from './BaseModal';
import { Button } from '../ui/button';
import InputField from '../ui/InputField';
import { formatCurrency } from '../../lib/utils';
import type { FeeTransaction } from '../../services/feeService';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { feeWaiverSchema, type FeeWaiverFormData } from '../../schemas/fee.schema';

interface FeeWaiverModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: FeeTransaction | null;
  onSubmit: (waiverAmount: number, waiverReason: string) => Promise<void>;
}

export const FeeWaiverModal: React.FC<FeeWaiverModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSubmit,
}) => {
  const [processing, setProcessing] = useState(false);
  const [waiverError, setWaiverError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FeeWaiverFormData>({
    resolver: zodResolver(feeWaiverSchema),
  });

  const watchAmount = watch('waiverAmount');
  const watchReason = watch('waiverReason');

  const onSubmitHandler = async (data: FeeWaiverFormData) => {
    if (!transaction) return;

    try {
      setProcessing(true);
      setWaiverError(null);
      await onSubmit(parseFloat(data.waiverAmount), data.waiverReason);
      reset();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to apply waiver. Please try again.';
      setWaiverError(msg);
    } finally {
      setProcessing(false);
    }
  };

  if (!transaction) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply Fee Waiver"
      size="md"
    >
      <div className="p-6 space-y-5">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-700">
            A waiver will reduce the pending amount. This action requires approval and will be recorded.
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Fee Type</span>
            <span className="font-semibold text-slate-900">{transaction.feeType || 'Combined Fee'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Original Amount</span>
            <span className="font-semibold">{formatCurrency(transaction.originalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Current Amount Due</span>
            <span className="font-semibold">{formatCurrency(transaction.amountDue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Already Paid</span>
            <span className="font-semibold text-emerald-600">{formatCurrency(transaction.amountPaid)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-slate-200 pt-3">
            <span className="text-slate-700 font-semibold">Pending Amount</span>
            <span className="font-bold text-rose-600">{formatCurrency(transaction.amountPending)}</span>
          </div>
        </div>

        <InputField
          label="Waiver Amount"
          type="number"
          placeholder="Enter waiver amount"
          error={errors.waiverAmount?.message}
          {...register('waiverAmount')}
        />
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Waiver Reason</label>
          <textarea
            placeholder="Enter reason for waiver (e.g., scholarship, financial hardship, etc.)"
            rows={3}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            {...register('waiverReason')}
          />
        </div>

        {waiverError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 font-medium">
            {waiverError}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmitHandler)}
            loading={processing}
            className="flex-1 bg-amber-600 hover:bg-amber-700"
            disabled={!watchAmount || !watchReason}
          >
            Apply Waiver
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default FeeWaiverModal;
