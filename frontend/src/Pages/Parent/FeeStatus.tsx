import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParentChildren } from '../../hooks/queries';
import { useStudentFees } from '../../hooks/queries/useFeeTransactions';
import { useQuery } from '@tanstack/react-query';
import { schoolSettingsService } from '../../services/schoolSettingsService';
import type { LinkedStudent } from '../../types/parent';
import type { FeeTransaction } from '../../services/feeService';
import { computeFeeSummary } from '../../lib/fee-utils';
import type { SchoolSettings } from '../../services/schoolSettingsService';
import StatusBadge from '../../components/common/StatusBadge';

const fmt = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const fmtDate = (d: string) => {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const txLabel = (tx: FeeTransaction): string =>
  tx.termNumber ? `Term ${tx.termNumber}` : 'Fee';

const printElement = (el: HTMLElement, title: string) => {
  const win = window.open('', '_blank', 'width=800,height=600');
  if (!win) return;
  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 13px; color: #1e293b; padding: 24px; }
          h1 { font-size: 18px; font-weight: 900; margin-bottom: 4px; }
          h2 { font-size: 14px; font-weight: 700; margin-bottom: 16px; color: #475569; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase;
               letter-spacing: 0.05em; color: #94a3b8; padding: 8px 12px; border-bottom: 2px solid #e2e8f0; }
          td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
          .paid    { background: #d1fae5; color: #065f46; }
          .partial { background: #dbeafe; color: #1e40af; }
          .pending { background: #fef3c7; color: #92400e; }
          .waived  { background: #f1f5f9; color: #64748b; }
          .breakdown { font-size: 10px; color: #94a3b8; margin-top: 3px; }
          .summary { display: flex; gap: 32px; margin-bottom: 20px; padding: 16px; background: #f8fafc;
                     border-radius: 8px; border: 1px solid #e2e8f0; }
          .summary-item label { font-size: 10px; font-weight: 700; text-transform: uppercase;
                                letter-spacing: 0.05em; color: #94a3b8; display: block; margin-bottom: 4px; }
          .summary-item span  { font-size: 20px; font-weight: 900; color: #0f172a; }
          .due { color: #e11d48; }
          .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>${el.innerHTML}</body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 300);
};

const EMPTY_CHILDREN: LinkedStudent[] = [];

const ParentFeeStatus: React.FC = () => {
  const { user } = useAuth();

  const { data: childrenData, isLoading: childrenLoading } = useParentChildren(Number(user?.id));
  const children = childrenData || EMPTY_CHILDREN;
  const [selected, setSelected] = useState<LinkedStudent | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const statementRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const { data: settings } = useQuery<SchoolSettings>({
    queryKey: ['school-settings'],
    queryFn: () => schoolSettingsService.getSettings(),
    staleTime: 30 * 60 * 1000,
  });

  const { data: transactions = [], isLoading: txLoading } = useStudentFees(selected?.id ?? 0);

  const feeSummary = React.useMemo(() => {
    if (transactions.length === 0) return null;
    return computeFeeSummary(transactions, "amountDue");
  }, [transactions]);

  React.useEffect(() => {
    if (children.length > 0 && !selected) {
      setSelected(children[0]);
    }
  }, [children, selected]);

  React.useEffect(() => {
    const updateScrollState = () => {
      if (tabsRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    if (tabsRef.current) {
      updateScrollState();
      tabsRef.current.addEventListener('scroll', updateScrollState);
      return () => tabsRef.current?.removeEventListener('scroll', updateScrollState);
    }
  }, [children]);

  const handleScrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
      setTimeout(() => {
        if (tabsRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
          setCanScrollLeft(scrollLeft > 0);
          setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
      }, 300);
    }
  };

  const urgentTx = transactions.find(t => t.status === 'pending' || t.status === 'partial');
  const totalAnnual = feeSummary?.totalAmount ?? 0;
  const totalPaid = feeSummary?.totalPaid ?? 0;
  const totalDue = feeSummary?.totalPending ?? 0;
  const paidPct = totalAnnual > 0 ? Math.round((totalPaid / totalAnnual) * 100) : 0;

  const handlePrintStatement = () => {
    if (!statementRef.current) return;
    printElement(statementRef.current, `Fee Statement – ${selected?.fullName ?? ''}`);
  };

  const handlePrintReceipt = (tx: FeeTransaction) => {
    const schoolName = settings?.schoolName ?? 'School';
    const el = document.createElement('div');
    el.innerHTML = `
      <h1>${schoolName}</h1>
      <h2>Fee Receipt</h2>
      <div class="summary">
        <div class="summary-item"><label>Student</label><span style="font-size:15px">${selected?.fullName ?? ''}</span></div>
        <div class="summary-item"><label>Receipt No.</label><span style="font-size:15px">${tx.receiptNumber ?? '—'}</span></div>
        <div class="summary-item"><label>Payment Date</label><span style="font-size:15px">${tx.paymentDate ? fmtDate(tx.paymentDate) : '—'}</span></div>
      </div>
      <table>
        <thead><tr>
          <th>Description</th><th>Due Date</th><th>Fee Amount</th>
          <th>Amount Paid</th><th>Balance</th><th>Status</th>
        </tr></thead>
        <tbody><tr>
          <td>
            ${txLabel(tx)}
            ${tx.feeType ? `<div class="breakdown">${tx.feeType}</div>` : ''}
          </td>
          <td>${tx.dueDate ? fmtDate(tx.dueDate) : '—'}</td>
          <td>${fmt(tx.amountDue)}</td>
          <td>${fmt(tx.amountPaid)}</td>
          <td class="${tx.amountPending > 0 ? 'due' : ''}">${fmt(tx.amountPending)}</td>
          <td><span class="badge ${tx.status}">${tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}</span></td>
        </tr></tbody>
      </table>
      <div class="footer">Generated on ${new Date().toLocaleDateString('en-IN')} · ${schoolName}</div>
    `;
    printElement(el, `Receipt – ${txLabel(tx)}`);
  };

  if (childrenLoading) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-[#4A9FD4] border-t-transparent rounded-full animate-spin" />
        </div>
    );
  }

  return (
      <div className="p-8 max-w-5xl mx-auto space-y-6 pb-10">

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#4A9FD4] rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
          <span className="font-black text-[#1E3A5F] text-base tracking-tight">
            {settings?.schoolName ?? 'School'}
          </span>
        </div>

        {children.length > 0 && (
          <div className="relative">
            <div ref={tabsRef} className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto scrollbar-hide px-10">
              {children.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap flex-shrink-0 ${
                    selected?.id === c.id
                      ? 'border-[#4A9FD4] text-[#4A9FD4]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {c.fullName.split(' ')[0]}
                </button>
              ))}
            </div>
            {canScrollLeft && (
              <button
                onClick={() => handleScrollTabs('left')}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center z-20 hover:bg-slate-50 hover:border-slate-300 hover:shadow transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-slate-600" style={{ fontVariationSettings: "'FILL' 1" }}>chevron_left</span>
              </button>
            )}
            {canScrollRight && (
              <button
                onClick={() => handleScrollTabs('right')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center z-20 hover:bg-slate-50 hover:border-slate-300 hover:shadow transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-slate-600" style={{ fontVariationSettings: "'FILL' 1" }}>chevron_right</span>
              </button>
            )}
          </div>
        )}

        <h1 className="text-2xl font-black text-slate-900">Fee Status</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Total Annual Fee</p>
            <p className="text-3xl font-black text-slate-900">{fmt(totalAnnual)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Amount Paid</p>
            <p className="text-3xl font-black text-slate-900">{fmt(totalPaid)}</p>
            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#4A9FD4] rounded-full transition-all duration-700" style={{ width: `${paidPct}%` }} />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">{paidPct}% of total fee paid</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Amount Due</p>
            <p className={`text-3xl font-black ${totalDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmt(totalDue)}</p>
            {totalDue === 0 && (
              <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                All Clear
              </span>
            )}
          </div>
        </div>

        {urgentTx && (
          <div className="flex items-center gap-3 bg-amber-400 text-white rounded-2xl px-5 py-4 shadow-sm">
            <span className="material-symbols-outlined text-[20px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <p className="text-sm font-semibold">
              {txLabel(urgentTx)} of <span className="font-black">{fmt(urgentTx.amountPending)}</span>
              {urgentTx.dueDate ? ` is due by ${fmtDate(urgentTx.dueDate)}.` : '.'}{' '}
              Please contact school for payment.
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-black text-slate-900 text-base">Payment Breakdown</h2>
            <button
              onClick={handlePrintStatement}
              className="flex items-center gap-1.5 text-[#4A9FD4] text-xs font-bold hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              Print Full Statement
            </button>
          </div>

          <div ref={statementRef}>
            <div className="hidden" id="print-header">
              <h1>{settings?.schoolName ?? 'School'}</h1>
              <h2>Fee Statement – {selected?.fullName}</h2>
              <div className="summary">
                <div className="summary-item"><label>Total Annual Fee</label><span>{fmt(totalAnnual)}</span></div>
                <div className="summary-item"><label>Amount Paid</label><span>{fmt(totalPaid)}</span></div>
                <div className="summary-item"><label>Balance Due</label><span className={totalDue > 0 ? 'due' : ''}>{fmt(totalDue)}</span></div>
              </div>
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
                <table className="w-full text-sm" id="fee-table">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Term', 'Due Date', 'Fee Amount', 'Amount Paid', 'Balance', 'Status', 'Receipt'].map(h => (
                        <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, i) => (
                      <tr
                        key={tx.id}
                        className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${i === transactions.length - 1 ? 'border-b-0' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{txLabel(tx)}</p>
                          {tx.feeType && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">
                              {tx.feeType}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                          {tx.dueDate ? fmtDate(tx.dueDate) : '—'}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap">{fmt(tx.amountDue)}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap">{fmt(tx.amountPaid)}</td>
                        <td className="px-6 py-4 font-semibold whitespace-nowrap">
                          <span className={tx.amountPending > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                            {fmt(tx.amountPending)}
                          </span>
                        </td>
                        <td className="px-6 py-4"><StatusBadge status={tx.status} /></td>
                        <td className="px-6 py-4">
                          {tx.status === 'paid' ? (
                            <button
                              onClick={() => handlePrintReceipt(tx)}
                              className="flex items-center gap-1 text-[#4A9FD4] text-xs font-bold hover:underline whitespace-nowrap"
                            >
                              <span className="material-symbols-outlined text-[14px]">print</span>
                              Receipt
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
        </div>

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
              <a href={`tel:${settings.contactPhone}`} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#4A9FD4] transition-colors">
                <span className="material-symbols-outlined text-[18px] text-[#4A9FD4]" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
                {settings.contactPhone}
              </a>
            )}
            {settings?.contactEmail && (
              <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#4A9FD4] transition-colors">
                <span className="material-symbols-outlined text-[18px] text-[#4A9FD4]" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
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
