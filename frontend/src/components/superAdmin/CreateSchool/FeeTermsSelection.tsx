import React from 'react';
import type { FeeTerm, SubscriptionTier } from '../../../types/school';

interface FeeTermsSelectionProps {
  feeTerm: FeeTerm;
  setFeeTerm: (term: FeeTerm) => void;
  selectedPlan: SubscriptionTier;
}

const FeeTermsSelection: React.FC<FeeTermsSelectionProps> = ({ feeTerm, setFeeTerm, selectedPlan }) => {

  const feeTerms: { id: FeeTerm; label: string; numericId: number }[] = [
    { id: 'YEARLY', label: 'Yearly', numericId: 1 },
    { id: 'HALF-YEARLY', label: 'Half-Yearly', numericId: 2 },
    { id: 'QUARTERLY', label: 'Quarterly', numericId: 4 },
    { id: 'MONTHLY', label: 'Monthly', numericId: 12 },
  ];

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-4 text-[#1E3A5F]">
        <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
        <h3 className="text-xl font-display font-bold">Fee Terms</h3>
      </div>

      <div className="bg-slate-50/80 p-1.5 rounded-xl flex gap-1 border border-slate-100">
        {feeTerms.map((term) => {
          const isSelected = feeTerm === term.id;
          return (
            <button
              key={term.id}
              onClick={() => setFeeTerm(term.id)}
              type="button"
              className={`flex-1 py-3.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white text-primary shadow-md'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {term.label}
            </button>
          );
        })}
      </div>

      {feeTerm === 'YEARLY' && (
        <div className="bg-blue-50/50 border border-blue-100/50 p-6 rounded-2xl flex gap-5 items-start">
          <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] flex items-center justify-center flex-shrink-0 text-primary">
            <span className="material-symbols-outlined">help</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-primary tracking-tight">About Yearly Terms</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Fees are collected once at the beginning of the academic session. This structure offers a 10% discount to parents and reduces administrative overhead.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default FeeTermsSelection;
