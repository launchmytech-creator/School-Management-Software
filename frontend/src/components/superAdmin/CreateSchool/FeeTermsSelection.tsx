import React from 'react';
import type { FeeTerm, SubscriptionTier } from '../../../types/school';

interface FeeTermsSelectionProps {
  feeTerm: FeeTerm;
  setFeeTerm: (term: FeeTerm) => void;
  selectedPlan: SubscriptionTier;
}

const FeeTermsSelection: React.FC<FeeTermsSelectionProps> = ({ feeTerm, setFeeTerm, selectedPlan: _selectedPlan }) => {

  const feeTerms: { id: FeeTerm; label: string; numericId: number }[] = [
    { id: 'yearly', label: 'Yearly', numericId: 1 },
    { id: 'half-yearly', label: 'Half-Yearly', numericId: 2 },
    { id: 'quarterly', label: 'Quarterly', numericId: 4 },
    { id: 'monthly', label: 'Monthly', numericId: 12 },
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
    </section>
  );
};

export default FeeTermsSelection;
