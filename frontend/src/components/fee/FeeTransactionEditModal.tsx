import React, { useState } from 'react';
import { BaseModal } from '../common/BaseModal';
import { Button } from '../ui/button';
import { formatCurrency } from '../../lib/utils';
import type { FeeTransaction } from '../../services/feeService';

interface FeeTransactionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: FeeTransaction | null;
  onSubmit: (data: { dueDate: string }) => Promise<void>;
}

export const FeeTransactionEditModal: React.FC<FeeTransactionEditModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSubmit,
}) => {
  const [dueDate, setDueDate] = useState('');
  const [processing, setProcessing] = useState(false);

  React.useEffect(() => {
    if (transaction) {
      setDueDate(transaction.dueDate ? transaction.dueDate.split('T')[0] : '');
    }
  }, [transaction]);

  const handleSubmit = async () => {
    if (!dueDate) return;

    try {
      setProcessing(true);
      await onSubmit({ dueDate });
      setDueDate('');
    } catch {
      // Error handled by parent
    } finally {
      setProcessing(false);
    }
  };

  if (!transaction) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Due Date - ${transaction.feeType || 'Combined Fee'}`}
      size="md"
    >
      <div className="p-6 space-y-5">
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Student</span>
            <span className="font-semibold text-slate-900">{transaction.studentName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Class</span>
            <span className="font-semibold text-slate-900">{transaction.className}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Fee Type</span>
            <span className="font-semibold">{transaction.feeType || 'Combined Fee'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Term</span>
            <span className="font-semibold">
              {transaction.termNumber ? `Term ${transaction.termNumber}` : 'Yearly'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Amount Due</span>
            <span className="font-semibold text-slate-900">{formatCurrency(transaction.amountDue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Current Due Date</span>
            <span className="font-semibold">
              {transaction.dueDate
                ? new Date(transaction.dueDate).toLocaleDateString('en-IN')
                : 'Not Set'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            New Due Date *
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300"
          />
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
            onClick={handleSubmit}
            loading={processing}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={!dueDate}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default FeeTransactionEditModal;
