import React from 'react';
import type { SubscriptionTier } from '../../../types/school';

interface PlanSelectionProps {
  selectedPlan: SubscriptionTier;
  setSelectedPlan: (plan: SubscriptionTier) => void;
}

const PlanSelection: React.FC<PlanSelectionProps> = ({ selectedPlan, setSelectedPlan }) => {
  const plans = [
    { id: 'BASIC', name: 'Basic', price: '99', students: '500 Students', features: ['Core Modules'], recommended: false },
    { id: 'PREMIUM', name: 'Premium', price: '249', students: '2000 Students', features: ['Advanced Analytics', 'Parent Portal'], recommended: true },
    { id: 'BUSINESS', name: 'Business', price: '499', students: 'Unlimited Students', features: ['Multi-campus', 'Priority Support'], recommended: false },
  ];

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-4 text-[#1E3A5F]">
        <span className="material-symbols-outlined text-2xl">payments</span>
        <h3 className="text-xl font-display font-bold">Subscription Plan</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id as SubscriptionTier)}
            className={`p-6 rounded-2xl border-2 transition-all relative group shadow-sm cursor-pointer ${
              selectedPlan === plan.id 
              ? 'border-primary bg-primary/5 ring-4 ring-primary/5' 
              : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
          >
            {plan.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#4A9FD4] text-white text-[9px] font-black px-4 py-1.5 rounded-full tracking-widest uppercase shadow-md">
                Recommended
              </div>
            )}

            <div className="flex justify-between items-center w-full mb-6">
              <span className="font-display font-black text-xl text-slate-800">{plan.name}</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === plan.id ? 'border-[#4A9FD4]' : 'border-slate-200'
              }`}>
                {selectedPlan === plan.id && <div className="w-2.5 h-2.5 bg-[#4A9FD4] rounded-full"></div>}
              </div>
            </div>

            <div className="mb-8 group-hover:scale-110 transition-transform duration-300">
              <span className="text-4xl font-display font-black text-[#1E3A5F]">${plan.price}</span>
              <span className="text-slate-400 text-sm font-bold ml-1">/mo</span>
            </div>

            <ul className="space-y-3 w-full border-t border-slate-100 pt-6 mt-auto">
              <li className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                {plan.students}
              </li>
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight text-left">
                  <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PlanSelection;
