import React from "react";
import { CheckCircle, Clock, XCircle } from "lucide-react";

interface FeeTransactionCardProps {
  termNumber?: number | null;
  academicYearName?: string | null;
  status: string;
  originalAmount: number | null;
  amountPaid: number | null;
  amountPending: number | null;
  dueDate: string | null;
  waiverAmount?: number | null;
  paymentDate?: string | null;
  paymentMode?: string | null;
  receiptNumber?: string | null;
}

const FeeTransactionCard: React.FC<FeeTransactionCardProps> = ({
  termNumber,
  academicYearName,
  status,
  originalAmount,
  amountPaid,
  amountPending,
  dueDate,
  waiverAmount,
  paymentDate,
  paymentMode,
  receiptNumber,
}) => {
  return (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-base font-black text-slate-900">
            Term {termNumber || 1}
          </h4>
          <p className="text-xs text-slate-500">
            {academicYearName}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            status === "paid"
              ? "bg-emerald-100 text-emerald-700"
              : status === "partial"
                ? "bg-amber-100 text-amber-700"
                : status === "waived"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-rose-100 text-rose-700"
          }`}
        >
          {status === "paid" ? (
            <CheckCircle size={10} />
          ) : status === "partial" ? (
            <Clock size={10} />
          ) : (
            <XCircle size={10} />
          )}
          {status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs mb-3">
        <div>
          <p className="text-[9px] text-slate-400 font-bold uppercase">
            Original
          </p>
          <p className="font-bold text-slate-700">
            ${Number(originalAmount).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-[9px] text-slate-400 font-bold uppercase">
            Paid
          </p>
          <p className="font-bold text-emerald-600">
            ${Number(amountPaid).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-[9px] text-slate-400 font-bold uppercase">
            Pending
          </p>
          <p className="font-bold text-rose-600">
            ${Number(amountPending).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-[9px] text-slate-400 font-bold uppercase">
            Due Date
          </p>
          <p className="font-bold text-slate-700">
            {dueDate ? new Date(dueDate).toLocaleDateString() : "—"}
          </p>
        </div>
        {Number(waiverAmount) > 0 && (
          <div>
            <p className="text-[9px] text-purple-600 font-bold uppercase">
              Waiver
            </p>
            <p className="font-bold text-purple-600">
              -${Number(waiverAmount).toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {status !== "pending" && paymentDate && (
        <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-3 text-[10px]">
          <div>
            <span className="text-slate-400">
              Paid:{" "}
            </span>
            <span className="font-bold text-slate-700">
              {new Date(paymentDate).toLocaleDateString()}
            </span>
          </div>
          {paymentMode && (
            <div>
              <span className="text-slate-400">
                Mode:{" "}
              </span>
              <span className="font-bold text-slate-700 capitalize">
                {paymentMode.replace(/_/g, " ")}
              </span>
            </div>
          )}
          {receiptNumber && (
            <div>
              <span className="text-slate-400">
                Receipt:{" "}
              </span>
              <span className="font-bold text-slate-700">
                {receiptNumber}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeeTransactionCard;
