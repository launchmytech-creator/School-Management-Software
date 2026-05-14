import React from "react";
import { useNavigate } from "react-router-dom";

interface FeeSummary {
  total_fees: string;
  per_term_fee: string;
  paid_fees: string;
  pending_fees: string;
  terms_paid: string;
  terms_left: string;
}

interface FeeSummaryCardProps {
  feeSummary: FeeSummary;
  studentId: number;
}

export const FeeSummaryCard: React.FC<FeeSummaryCardProps> = ({
  feeSummary,
  studentId,
}) => {
  const navigate = useNavigate();

  const termsLeft = feeSummary?.terms_left
    ? parseInt(feeSummary.terms_left)
    : 0;
  const termsPaid = feeSummary?.terms_paid
    ? parseInt(feeSummary.terms_paid)
    : 0;
  const perTermFee = feeSummary?.per_term_fee
    ? parseFloat(feeSummary.per_term_fee)
    : 0;
  const totalFee = feeSummary?.total_fees
    ? parseFloat(feeSummary.total_fees)
    : 0;
  const totalPaid = feeSummary?.paid_fees
    ? parseFloat(feeSummary.paid_fees)
    : 0;
  const totalDue = feeSummary?.pending_fees
    ? parseFloat(feeSummary.pending_fees)
    : 0;

  const hasPending = termsLeft > 0;
  const totalTerms = termsLeft + termsPaid;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-lg text-emerald-500"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                payments
              </span>
            </div>
            <h3 className="font-bold text-slate-800">Fee Summary</h3>
          </div>
          {hasPending && (
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
              {termsLeft} Term{termsLeft !== 1 ? "s" : ""} Left
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="mb-5 p-4 bg-slate-50 rounded-xl flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-600">
            Per Term Fee
          </span>
          <span className="text-xl font-black text-slate-800">
            ₹{perTermFee.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-xl font-black text-slate-800">
              ₹{totalFee.toLocaleString()}
            </p>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Total Fee
            </p>
            <p className="text-[10px] text-slate-400">({totalTerms} Terms)</p>
          </div>

          <div className="w-px h-12 bg-slate-200" />

          <div className="text-center flex-1">
            <p className="text-xl font-black text-emerald-600">
              ₹{totalPaid.toLocaleString()}
            </p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Paid</p>
            <p className="text-[10px] text-slate-400">
              ({termsPaid} Term{termsPaid !== 1 ? "s" : ""})
            </p>
          </div>

          <div className="w-px h-12 bg-slate-200" />

          <div className="text-center flex-1">
            <p
              className={`text-xl font-black ${hasPending ? "text-rose-500" : "text-emerald-600"}`}
            >
              ₹{totalDue.toLocaleString()}
            </p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Balance</p>
            <p className="text-[10px] text-slate-400">({termsLeft} Left)</p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 flex items-center justify-between">
        <button
          onClick={() => navigate(`/parent/fees?studentId=${studentId}`)}
          className="text-sm font-semibold text-[#4A9FD4] hover:underline transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );
};
