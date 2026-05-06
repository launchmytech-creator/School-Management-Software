import React from 'react';
import { BaseModal } from './BaseModal';
import { Button } from '../ui/button';
import InputField from '../ui/InputField';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatCurrency } from '../../lib/utils';
import type { RecordPaymentDto, FeeTransaction } from '../../services/feeService';

const generateReceiptNumber = (): string => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  return `RCP-${year}${month}${day}-${hours}${minutes}${seconds}`;
};

const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

const formatDisplayDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const recordPaymentSchema = z.object({
  amountPaid: z.string().min(1, 'Amount is required'),
  paymentMode: z.enum(['cash', 'card', 'upi', 'cheque', 'bank_transfer']),
});

interface TermGroup {
  id: string;
  termNumber: number | null;
  termLabel: string;
  transactions: FeeTransaction[];
  totalAmountDue: number;
  totalAmountPaid: number;
  totalAmountPending: number;
}

interface FeePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  term: TermGroup | null;
  onSubmit: (data: RecordPaymentDto) => Promise<void>;
}

export const FeePaymentModal: React.FC<FeePaymentModalProps> = ({
  isOpen,
  onClose,
  term,
  onSubmit,
}) => {
  const [processing, setProcessing] = React.useState(false);
  const [receiptNumber] = React.useState(generateReceiptNumber());

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<{ amountPaid: string; paymentMode: RecordPaymentDto['paymentMode'] }>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      amountPaid: '',
      paymentMode: 'cash',
    },
  });

  const paymentDate = getTodayDate();
  const watchAmount = watch('amountPaid');

  const handleFormSubmit = async (data: { amountPaid: string; paymentMode: RecordPaymentDto['paymentMode'] }) => {
    if (!term) return;

    try {
      setProcessing(true);
      const payload: RecordPaymentDto = {
        amountPaid: parseFloat(data.amountPaid),
        paymentMode: data.paymentMode,
      };
      payload.paymentDate = paymentDate;
      payload.receiptNumber = receiptNumber;

      await onSubmit(payload);
      reset();
    } catch {
    } finally {
      setProcessing(false);
    }
  };

  if (!term) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment - ${term.termLabel}`}
      size="md"
    >
      <div className="p-6 space-y-5">
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Term</span>
            <span className="font-semibold text-slate-900">{term.termLabel}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Components</span>
            <span className="font-semibold">{term.transactions.length} fee types</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Total Amount</span>
            <span className="font-semibold">{formatCurrency(term.totalAmountDue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Already Paid</span>
            <span className="font-semibold text-emerald-600">{formatCurrency(term.totalAmountPaid)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-slate-200 pt-3">
            <span className="text-slate-700 font-semibold">Pending Amount</span>
            <span className="font-bold text-rose-600">{formatCurrency(term.totalAmountPending)}</span>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600">
            This payment will be distributed across all pending fee components in this term.
          </p>
        </div>

        <InputField
          label="Payment Amount"
          type="number"
          placeholder="Enter amount to collect"
          error={errors.amountPaid?.message}
          {...register('amountPaid')}
        />

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Mode *</label>
          <select
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register('paymentMode')}
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="cheque">Cheque</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Date</label>
            <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700">
              {formatDisplayDate(paymentDate)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Receipt Number</label>
            <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-medium text-slate-900">
              {receiptNumber}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(handleFormSubmit)}
            loading={processing}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            disabled={!watchAmount}
          >
            Record Payment
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default FeePaymentModal;
