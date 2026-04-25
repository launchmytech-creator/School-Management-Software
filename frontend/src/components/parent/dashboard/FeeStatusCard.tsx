import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { ChildOverview } from '../../../hooks/queries/useDashboard';

interface FeeStatusCardProps {
  child: ChildOverview;
}

export const FeeStatusCard: React.FC<FeeStatusCardProps> = ({ child }) => {
  const navigate = useNavigate();

  const totalFees = parseFloat(child.fee_summary.total_fees) || 0;
  const paidFees = parseFloat(child.fee_summary.paid_fees) || 0;
  const pendingFees = parseFloat(child.fee_summary.pending_fees) || 0;
  const hasPendingFees = pendingFees > 0;

  const paidPercentage = totalFees > 0 ? Math.round((paidFees / totalFees) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">Fee Status</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            hasPendingFees
              ? 'bg-rose-100 text-rose-600'
              : 'bg-emerald-100 text-emerald-600'
          }`}
        >
          {hasPendingFees ? 'Pending' : 'Paid'}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500">Total Fees</span>
          <span className="text-sm font-bold text-slate-900">${totalFees.toFixed(0)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500">Paid</span>
          <span className="text-sm font-bold text-emerald-600">${paidFees.toFixed(0)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500">Pending</span>
          <span className="text-sm font-bold text-rose-600">${pendingFees.toFixed(0)}</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${paidPercentage}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">{paidPercentage}% paid</p>
      </div>

      {hasPendingFees && (
        <button
          onClick={() => navigate(`/parent/fees?studentId=${child.student.id}`)}
          className="mt-4 w-full py-2 bg-rose-50 text-rose-600 rounded-xl text-sm font-semibold hover:bg-rose-100 transition-colors"
        >
          Pay Now
        </button>
      )}
    </div>
  );
};