import React, { useState, useEffect, useCallback } from 'react';
import ParentLayout from '../../layouts/ParentLayout';
import { useAuth } from '../../context/AuthContext';
import { parentService } from '../../services/parentService';
import { feeService } from '../../services/feeService';
import { schoolSettingsService } from '../../services/schoolSettingsService';
import type { LinkedStudent } from '../../types/parent';
import type { FeeTransaction, StudentFeeSummary } from '../../services/feeService';
import type { SchoolSettings } from '../../services/schoolSettingsService';

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const fmtDate = (d: string) => {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ── status badge ──────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    paid:    'bg-emerald-100 text-emerald-700 border border-emerald-200',
    partial: 'bg-blue-100 text-blue-700 border border-blue-200',
    pending: 'bg-amber-100 text-amber-700 border border-amber-200',
    waived:  'bg-slate-100 text-slate-500 border border-slate-200',
  };
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${map[status] ?? map.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// ── main ──────────────────────────────────────────────────────────────────────

const ParentFeeStatus: React.FC = () => {
  const { user } = useAuth();

  const [children, setChildren]       = useState<LinkedStudent[]>([]);
  const [selected, setSelected]       = useState<LinkedStudent | null>(null);
  const [transactions, setTxns]       = useState<FeeTransaction[]>([]);
  const [feeSummary, setFeeSummary]   = useState<StudentFeeSummary | null>(null);
  const [settings, setSettings]       = useState<SchoolSettings | null>(null);
  const [loading, setLoading]         = useState(true);
  const [txLoading, setTxLoading]     = useState(false);

  // fetch children + school settings once
  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      parentService.getParentChildren(Number(user.id)),
      schoolSettingsService.getSettings().catch(() => null),
    ]).then(([kids, sch]) => {
      setChildren(kids);
      if (kids.length > 0) setSelected(kids[0]);
      setSettings(sch);
    }).finally(() => setLoading(false));
  }, [user?.id]);

  // fetch transactions when child changes
  const fetchTxns = useCallback(async () => {
    if (!selected) return;
    setTxLoading(true);
    try {
      const data = await feeService.getStudentFeeTransactions(selected.id);
      setTxns(data);
      const [summary] = feeService.aggregateByStudent(data);
      setFeeSummary(summary ?? null);
    } catch { setTxns([]); setFeeSummary(null); }
    finally { setTxLoading(false); }
  }, [selected]);


  useEffect(() => { fetchTxns(); }, [fetchTxns]);


  // first pending/partial transaction for the alert banner
  const urgentTx = transactions.find(t => t.status === 'pending' || t.status === 'partial');

  // summary totals from aggregateByStudent
  const totalAnnual = feeSummary?.totalAmount  ?? 0;
  const totalPaid   = feeSummary?.totalPaid    ?? 0;
  const totalDue    = feeSummary?.totalPending ?? 0;
  const paidPct     = totalAnnual > 0 ? Math.round((totalPaid / totalAnnual) * 100) : 0;

  if (loading) {
    return (
      <ParentLayout title="Fee Status">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-[#4A9FD4] border-t-transparent rounded-full animate-spin" />
        </div>
      </ParentLayout>
    );
  }

  return (
    <ParentLayout title="Fee Status">
      <div className="p-8 max-w-5xl mx-auto space-y-6 pb-10">

        {/* School header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#4A9FD4] rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
          </div>
          <span className="font-black text-[#1E3A5F] text-base tracking-tight">
            {settings?.schoolName ?? 'St. Xavier\'s School'}
          </span>
        </div>

        {/* Child tabs */}
        {children.length > 0 && (
          <div className="flex items-center gap-1 border-b border-slate-200">
            {children.map(c => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                  selected?.id === c.id
                    ? 'border-[#4A9FD4] text-[#4A9FD4]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {c.fullName.split(' ')[0]}
              </button>
            ))}
          </div>
        )}

        {/* Page title */}
        <h1 className="text-2xl font-black text-slate-900">Fee Status</h1>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Annual Fee */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Total Annual Fee</p>
            <p className="text-3xl font-black text-slate-900">{fmt(totalAnnual)}</p>
          </div>

          {/* Amount Paid */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Amount Paid</p>
            <p className="text-3xl font-black text-slate-900">{fmt(totalPaid)}</p>
            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4A9FD4] rounded-full transition-all duration-700"
                style={{ width: `${paidPct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">{paidPct}% of total fee paid</p>
          </div>

          {/* Amount Due */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Amount Due</p>
            <p className={`text-3xl font-black ${totalDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {fmt(totalDue)}
            </p>
            {totalDue === 0 && (
              <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                All Clear
              </span>
            )}
          </div>
        </div>

        {/* Due alert banner */}
        {urgentTx && (
          <div className="flex items-center gap-3 bg-amber-400 text-white rounded-2xl px-5 py-4 shadow-sm">
            <span className="material-symbols-outlined text-[20px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
              warning
            </span>
            <p className="text-sm font-semibold">
              {urgentTx.feeType} fee of{' '}
              <span className="font-black">{fmt(urgentTx.amountDue - urgentTx.amountPaid)}</span>
              {urgentTx.dueDate ? ` is due by ${fmtDate(urgentTx.dueDate)}.` : '.'}{' '}
              Please contact school for payment.
            </p>
          </div>
        )}

        {/* Payment breakdown table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-black text-slate-900 text-base">Payment Breakdown</h2>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-[#4A9FD4] text-xs font-bold hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              Print Full Statement
            </button>
          </div>

          {txLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#4A9FD4] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-slate-200 block mb-3">receipt_long</span>
              <p className="text-sm text-slate-400 font-medium">No fee records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Term Name', 'Due Date', 'Fee Amount', 'Amount Paid', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, i) => (
                    <tr
                      key={tx.id}
                      className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${
                        i === transactions.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {tx.feeType}
                        {tx.termNumber ? ` – Term ${tx.termNumber}` : ''}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {tx.dueDate ? fmtDate(tx.dueDate) : '—'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{fmt(tx.amountDue)}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{fmt(tx.amountPaid)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="px-6 py-4">
                        {tx.status === 'paid' && tx.receiptNumber ? (
                          <button className="flex items-center gap-1 text-[#4A9FD4] text-xs font-bold hover:underline whitespace-nowrap">
                            <span className="material-symbols-outlined text-[14px]">download</span>
                            Download Receipt
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Help card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex items-center gap-5 flex-wrap">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-slate-400 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              support_agent
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-slate-900 text-sm">Need Help with Payments?</p>
            <p className="text-xs text-slate-400 mt-0.5">School Accountant</p>
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            {settings?.contactPhone && (
              <a
                href={`tel:${settings.contactPhone}`}
                className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#4A9FD4] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-[#4A9FD4]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  call
                </span>
                {settings.contactPhone}
              </a>
            )}
            {settings?.contactEmail && (
              <a
                href={`mailto:${settings.contactEmail}`}
                className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#4A9FD4] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-[#4A9FD4]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  mail
                </span>
                {settings.contactEmail}
              </a>
            )}
            {!settings?.contactPhone && !settings?.contactEmail && (
              <p className="text-xs text-slate-400">Contact your school administration for payment assistance.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-300 pb-2">
          © 2024 EduManage School Management System. All rights reserved.
        </p>

      </div>
    </ParentLayout>
  );
};

export default ParentFeeStatus;
