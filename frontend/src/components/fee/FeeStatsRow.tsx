import React from "react";

interface FeeStatsRowProps {
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  paidPercentage: number;
}

const FeeStatsRow: React.FC<FeeStatsRowProps> = ({
  totalAmount,
  totalPaid,
  totalPending,
  paidPercentage,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">
          Total Fee
        </p>
        <p className="text-xl font-black text-blue-700">
          ${Number(totalAmount).toFixed(2)}
        </p>
      </div>
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
          Total Paid
        </p>
        <p className="text-xl font-black text-emerald-700">
          ${Number(totalPaid).toFixed(2)}
        </p>
      </div>
      <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
        <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">
          Pending
        </p>
        <p className="text-xl font-black text-rose-700">
          ${Number(totalPending).toFixed(2)}
        </p>
      </div>
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
          Progress
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${paidPercentage}%` }}
            />
          </div>
          <span className="text-sm font-black text-slate-700">
            {paidPercentage}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default FeeStatsRow;
