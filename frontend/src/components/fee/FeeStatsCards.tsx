import React from 'react';
import { User, CheckCircle, XCircle, AlertTriangle, Wallet } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface FeeStatsCardsProps {
  totalStudents: number;
  fullyPaid: number;
  withPending: number;
  withPartial: number;
  totalPendingAmount: number;
}

export const FeeStatsCards: React.FC<FeeStatsCardsProps> = ({
  totalStudents,
  fullyPaid,
  withPending,
  withPartial,
  totalPendingAmount,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-slate-900">{totalStudents}</p>
            <p className="text-sm text-slate-500">Total Students</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl">
            <User className="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-emerald-700">{fullyPaid}</p>
            <p className="text-sm text-emerald-600">Fully Paid</p>
          </div>
          <div className="p-3 bg-emerald-100 rounded-xl">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </div>

      <div className="bg-rose-50 rounded-xl border border-rose-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-rose-700">{withPending}</p>
            <p className="text-sm text-rose-600">With Pending</p>
          </div>
          <div className="p-3 bg-rose-100 rounded-xl">
            <XCircle className="w-5 h-5 text-rose-600" />
          </div>
        </div>
      </div>

      <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-amber-700">{withPartial}</p>
            <p className="text-sm text-amber-600">Partial Payment</p>
          </div>
          <div className="p-3 bg-amber-100 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalPendingAmount)}</p>
            <p className="text-sm text-blue-600">Total Pending</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-xl">
            <Wallet className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeStatsCards;
