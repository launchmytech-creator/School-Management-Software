import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSelectedChild } from '../../context/SelectedChildContext';
import { useParentChildren } from '../../hooks/queries';
import { useStudentFees } from '../../hooks/queries/useFeeTransactions';
import { useQuery } from '@tanstack/react-query';
import { schoolSettingsService } from '../../services/schoolSettingsService';
import type { LinkedStudent } from '../../types/parent';
import type { FeeTransaction } from '../../services/feeService';
import { computeFeeSummary, printReceipt, formatINR } from '../../lib/fee-utils';
import type { SchoolSettings } from '../../services/schoolSettingsService';
import PageHeader from '../../components/common/PageHeader';
import FeeTransactionCard from '../../components/fee/FeeTransactionCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const EMPTY_CHILDREN: LinkedStudent[] = [];

/** Parent Fee Status Page
 * 
 * Displays child's fee transactions and payment history.
 * Shows pending dues, paid amounts, and allows printing receipts.
 * Uses SelectedChildContext for child selection.
 */
const ParentFeeStatus: React.FC = () => {
  const { user } = useAuth();
  const { selectedChildId } = useSelectedChild();

  const { data: childrenData, isLoading: childrenLoading } = useParentChildren(Number(user?.id));
  const children = childrenData || EMPTY_CHILDREN;

  const selected = useMemo(() => {
    if (selectedChildId && children.length > 0) {
      return children.find(c => c.id === selectedChildId) || children[0] || null;
    }
    return children[0] || null;
  }, [children, selectedChildId]);

  const { data: settings } = useQuery<SchoolSettings>({
    queryKey: ['school-settings'],
    queryFn: () => schoolSettingsService.getSettings(),
    staleTime: 30 * 60 * 1000,
  });

  const { data: transactions = [] } = useStudentFees(selected?.id ?? 0);

  const feeSummary = useMemo(() => {
    if (transactions.length === 0) return null;
    return computeFeeSummary(transactions, "amountDue");
  }, [transactions]);

  const urgentTx = transactions.find(t => t.status === 'pending' || t.status === 'partial');
  const totalAnnual = feeSummary?.totalAmount ?? 0;
  const totalPaid = feeSummary?.totalPaid ?? 0;
  const totalDue = feeSummary?.totalPending ?? 0;
  const paidPct = totalAnnual > 0 ? Math.round((totalPaid / totalAnnual) * 100) : 0;

  const handleDownloadReceipt = (tx: FeeTransaction) => {
    printReceipt({
      receiptNumber: tx.receiptNumber ?? undefined,
      studentName: selected?.fullName ?? '',
      className: selected?.className ?? undefined,
      termNumber: tx.termNumber ?? undefined,
      feeType: tx.feeType ?? undefined,
      amountDue: tx.amountDue ?? 0,
      amountPaid: tx.amountPaid ?? 0,
      amountPending: tx.amountPending ?? 0,
      paymentDate: tx.paymentDate ?? undefined,
      paymentMode: tx.paymentMode ?? undefined,
      dueDate: tx.dueDate ?? undefined,
      academicYearName: tx.academicYearName ?? undefined,
    }, settings?.schoolName ?? 'School');
  };

  if (childrenLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <PageHeader
        title="Fee Status"
        subtitle={settings?.schoolName ?? undefined}
        breadcrumb={{
          links: [
            { label: 'Dashboard', href: '/parent/dashboard' },
            { label: 'Fee Status', active: true },
          ],
        }}
      />

{urgentTx && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <span className="material-symbols-outlined text-[20px] flex-shrink-0 text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          <p className="text-sm font-semibold text-amber-700">
            {urgentTx.termNumber ? `Term ${urgentTx.termNumber}` : 'Fee'} of {urgentTx.amountPending} is due.{' '}
            Please contact school for payment.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Total Fee</p>
          <p className="text-xl font-black text-blue-700">{formatINR(totalAnnual)}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Paid</p>
          <p className="text-xl font-black text-emerald-700">{formatINR(totalPaid)}</p>
        </div>
        <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
          <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">Pending</p>
          <p className="text-xl font-black text-rose-700">{formatINR(totalDue)}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Progress</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${paidPct}%` }} />
            </div>
            <span className="text-sm font-black text-slate-700">{paidPct}%</span>
          </div>
        </div>
      </div>

      {transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <FeeTransactionCard
              key={transaction.id}
              termNumber={transaction.termNumber}
              academicYearName={transaction.academicYearName}
              status={transaction.status}
              originalAmount={transaction.amountDue}
              amountPaid={transaction.amountPaid}
              amountPending={transaction.amountPending}
              dueDate={transaction.dueDate}
              waiverAmount={transaction.waiverAmount}
              paymentDate={transaction.paymentDate}
              paymentMode={transaction.paymentMode}
              receiptNumber={transaction.receiptNumber}
              onDownloadReceipt={() => handleDownloadReceipt(transaction)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">No fee records found</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex items-center gap-5 flex-wrap">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-slate-400 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-900 text-sm">Need Help with Payments?</p>
          <p className="text-xs text-slate-400 mt-0.5">School Accountant</p>
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          {settings?.contactPhone && (
            <a href={`tel:${settings.contactPhone}`} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
              <span className="material-symbols-outlined text-[18px]">call</span>
              {settings.contactPhone}
            </a>
          )}
          {settings?.contactEmail && (
            <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
              <span className="material-symbols-outlined text-[18px]">mail</span>
              {settings.contactEmail}
            </a>
          )}
          {!settings?.contactPhone && !settings?.contactEmail && (
            <p className="text-xs text-slate-400">Contact your school administration for payment assistance.</p>
          )}
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-300 pb-2">
        © {new Date().getFullYear()} EduManage School Management System. All rights reserved.
      </p>
    </div>
  );
};

export default ParentFeeStatus;