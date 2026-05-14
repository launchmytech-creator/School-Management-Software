import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  feeService,
  type RecordPaymentDto,
  type ApplyWaiverDto,
  type GenerateFeeTransactionsDto,
} from '../../services/feeService';
import { useNotification } from '../../context/NotificationContext';

export const useRecordPayment = () => {
  const qc = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: ({ transactionId, data }: { transactionId: number; data: RecordPaymentDto }) =>
      feeService.recordPayment(transactionId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-transactions'] });
      qc.invalidateQueries({ queryKey: ['fee-defaulters'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      showNotification('Payment recorded successfully', 'success');
    },
    onError: (err: Error) => {
      showNotification(err.message || 'Failed to record payment', 'error');
    },
  });
};

export const useApplyWaiver = () => {
  const qc = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: ({ transactionId, data }: { transactionId: number; data: ApplyWaiverDto }) =>
      feeService.applyWaiver(transactionId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-transactions'] });
      qc.invalidateQueries({ queryKey: ['fee-defaulters'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      showNotification('Waiver applied successfully', 'success');
    },
    onError: (err: Error) => {
      showNotification(err.message || 'Failed to apply waiver', 'error');
    },
  });
};

export const useGenerateFeeTransactions = () => {
  const qc = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (data: GenerateFeeTransactionsDto) =>
      feeService.generateFeeTransactions(data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['fee-transactions'] });
      qc.invalidateQueries({ queryKey: ['fee-structures'] });
      showNotification(
        `Generated ${result.generated} fee transactions successfully`,
        'success',
      );
    },
    onError: (err: Error) => {
      showNotification(err.message || 'Failed to generate fee transactions', 'error');
    },
  });
};
