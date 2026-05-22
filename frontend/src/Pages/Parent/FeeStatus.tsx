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
import { AlertTriangle, Phone, Mail, HeadphonesIcon } from 'lucide-react';

const EMPTY_CHILDREN: LinkedStudent[] = [];

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

  // Group by billing cycle (feeTerms), sorted by feeTerms asc
  const feeGroups = useMemo(() => {
    const groups: Record<string, { cycle: string; feeTerms: number | null; txs: FeeTransaction[] }> = {};
    for (const tx of transactions) {
      const key = String(tx.feeTerms ?? 0);
      if (!groups[key]) groups[key] = { cycle: tx.billingCycle, feeTerms: tx.feeTerms, txs: [] };
      groups[key].txs.push(tx);
    }
    for (const g of Object.values(groups)) {
      g.txs.sort((a, b) => (a.termNumber ?? 999) - (b.termNumber ?? 999));
    }
    return Object.values(groups).sort((a, b) => (a.feeTerms ?? 0) - (b.feeTerms ?? 0));
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
    <div className="max-w-3xl mx-auto space-y-5 pb-10 px-1">
      <PageHeader
        title="Fee Status"
        subtitle={selected?.fullName ?? settings?.schoolName ?? undefined}
        breadcrumb={{
          links: [
            { label: 'Dashboard', href: '/parent/dashboard' },
            { label: 'Fee Status', active: true },
          ],
        }}
      />

      {/* urgent due alert */}
      {urgentTx && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800">Payment Due</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {urgentTx.billingCycle}
              {urgentTx.termNumber ? ` — Term ${urgentTx.termNumber}` : ''} payment of{' '}
              <span className="font-black">{formatINR(urgentTx.amountPending)}</span> is pending.
              Please contact the school to make the payment.
            </p>
          </div>
        </div>
      )}

      {/* summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Total Fee</p>
          <p className="text-lg font-black text-blue-700">{formatINR(totalAnnual)}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Paid</p>
          <p className="text-lg font-black text-emerald-700">{formatINR(totalPaid)}</p>
        </div>
        <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
          <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">Pending</p>
          <p className="text-lg font-black text-rose-700">{formatINR(totalDue)}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Progress</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-slate-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${paidPct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${paidPct}%` }}
              />
            </div>
            <span className="text-xs font-black text-slate-700">{paidPct}%</span>
          </div>
        </div>
      </div>

      {/* transactions grouped by billing cycle */}
      {feeGroups.length > 0 ? (
        <div className="space-y-6">
          {feeGroups.map((group) => {
            const groupPaid    = group.txs.reduce((s, t) => s + t.amountPaid, 0);
            const groupPending = group.txs.reduce((s, t) => s + t.amountPending, 0);
            const groupTotal   = group.txs.reduce((s, t) => s + t.amountDue, 0);
            const groupPaidPct = groupTotal > 0 ? Math.round((groupPaid / groupTotal) * 100) : 0;
            const allPaid      = group.txs.every(t => t.status === 'paid');

            return (
              <div key={String(group.feeTerms)}>
                {/* cycle header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                      allPaid
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {group.cycle} Fees
                    </span>
                    <span className="text-xs text-slate-400">
                      {group.txs.length} {group.feeTerms === 1 ? 'payment' : `instalment${group.txs.length !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    {groupPending > 0
                      ? <span className="text-rose-600 font-bold">Due {formatINR(groupPending)}</span>
                      : <span className="text-emerald-600 font-bold">✓ All clear</span>
                    }
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-400">{groupPaidPct}% paid</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {group.txs.map((tx) => (
                    <FeeTransactionCard
                      key={tx.id}
                      termNumber={tx.termNumber}
                      academicYearName={tx.academicYearName}
                      status={tx.status}
                      originalAmount={tx.amountDue}
                      amountPaid={tx.amountPaid}
                      amountPending={tx.amountPending}
                      dueDate={tx.dueDate}
                      waiverAmount={tx.waiverAmount}
                      paymentDate={tx.paymentDate}
                      paymentMode={tx.paymentMode}
                      receiptNumber={tx.receiptNumber}
                      onDownloadReceipt={
                        tx.receiptNumber && tx.status === 'paid'
                          ? () => handleDownloadReceipt(tx)
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <p className="text-slate-400 font-medium">No fee records found</p>
          <p className="text-xs text-slate-300 mt-1">Contact school if you believe this is an error.</p>
        </div>
      )}

      {/* contact help card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-4 flex-wrap">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
          <HeadphonesIcon size={18} className="text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-900 text-sm">Need Help with Payments?</p>
          <p className="text-xs text-slate-400 mt-0.5">Contact your school accountant</p>
        </div>
        <div className="flex items-center gap-5 flex-wrap">
          {settings?.contactPhone && (
            <a href={`tel:${settings.contactPhone}`} className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
              <Phone size={14} />{settings.contactPhone}
            </a>
          )}
          {settings?.contactEmail && (
            <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
              <Mail size={14} />{settings.contactEmail}
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
