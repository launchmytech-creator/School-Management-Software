import React from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

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

const fmt = (val: string | number) =>
  `₹${parseFloat(String(val) || "0").toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export const FeeSummaryCard: React.FC<FeeSummaryCardProps> = ({ feeSummary, studentId }) => {
  const navigate = useNavigate();

  const totalFee   = parseFloat(feeSummary?.total_fees   || "0");
  const paidFee    = parseFloat(feeSummary?.paid_fees    || "0");
  const pendingFee = parseFloat(feeSummary?.pending_fees || "0");
  const perTerm    = parseFloat(feeSummary?.per_term_fee || "0");
  const termsPaid  = parseInt(feeSummary?.terms_paid     || "0");
  const termsLeft  = parseInt(feeSummary?.terms_left     || "0");
  const totalTerms = termsPaid + termsLeft;

  const paidPct = totalFee > 0 ? Math.round((paidFee / totalFee) * 100) : 0;
  const allClear = termsLeft === 0 && totalTerms > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* header */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Wallet size={14} className="text-emerald-500" />
          </div>
          <span className="font-bold text-slate-800 text-sm">Fee Status</span>
        </div>
        {allClear ? (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">
            <CheckCircle2 size={10} /> All Paid
          </span>
        ) : termsLeft > 0 ? (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600">
            <AlertCircle size={10} /> {termsLeft} Term{termsLeft > 1 ? "s" : ""} Due
          </span>
        ) : null}
      </div>

      <div className="p-5 space-y-4">
        {/* per-term fee */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Per Term</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{fmt(perTerm)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Annual Total</p>
            <p className="text-sm font-bold text-slate-600 mt-0.5">{fmt(totalFee)}</p>
          </div>
        </div>

        {/* payment progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-600">Payment Progress</span>
            <span className="text-xs font-bold text-slate-800">{paidPct}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${allClear ? "bg-emerald-400" : "bg-blue-400"}`}
              style={{ width: `${paidPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-slate-400">{termsPaid} of {totalTerms} terms paid</span>
            {termsLeft > 0 && (
              <span className="text-[10px] font-semibold text-slate-500">{termsLeft} remaining</span>
            )}
          </div>
        </div>

        {/* paid vs pending */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wide mb-1">Paid</p>
            <p className="text-base font-black text-emerald-700">{fmt(paidFee)}</p>
          </div>
          <div className={`p-3 rounded-xl border ${pendingFee > 0 ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100"}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${pendingFee > 0 ? "text-rose-500" : "text-slate-400"}`}>
              Pending
            </p>
            <p className={`text-base font-black ${pendingFee > 0 ? "text-rose-700" : "text-slate-400"}`}>
              {pendingFee > 0 ? fmt(pendingFee) : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* footer */}
      <div className="px-5 pb-4">
        <button
          type="button"
          onClick={() => navigate(`/parent/fees?studentId=${studentId}`)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 transition-colors"
        >
          View Fee Details <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};
