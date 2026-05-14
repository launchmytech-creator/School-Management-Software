import React from 'react';
import type { SubscriptionTier, SubscriptionPlan } from '../../../types/school';

interface PlanSelectionProps {
  selectedPlan: SubscriptionTier;
  setSelectedPlan: (plan: SubscriptionTier) => void;
  plans?: SubscriptionPlan[];
}

const PLAN_CONFIG: Record<SubscriptionTier, { subtitle: string; features: { name: string; included: boolean }[] }> = {
  BASIC: {
    subtitle: 'Fee & Marks Management',
    features: [
      { name: 'Fee Management', included: true },
      { name: 'Marks Management', included: true },
    ],
  },
  PREMIUM: {
    subtitle: 'Basic + Attendance & Syllabus',
    features: [
      { name: 'Fee Management', included: true },
      { name: 'Marks Management', included: true },
      { name: 'Attendance Management', included: true },
      { name: 'Syllabus Tracking', included: true },
      { name: 'Teacher Allocation', included: false },
      { name: 'Academic Analytics', included: false },
    ],
  },
  BUSINESS: {
    subtitle: 'All Features Included',
    features: [
      { name: 'Fee Management', included: true },
      { name: 'Marks Management', included: true },
      { name: 'Attendance Management', included: true },
      { name: 'Syllabus Tracking', included: true },
      { name: 'Teacher Allocation', included: true },
      { name: 'Academic Analytics', included: true },
    ],
  },
};

const PlanSelection: React.FC<PlanSelectionProps> = ({ selectedPlan, setSelectedPlan }) => {
  const planTiers: SubscriptionTier[] = ['BASIC', 'PREMIUM', 'BUSINESS'];

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-4 text-[#1E3A5F]">
        <span className="material-symbols-outlined text-2xl">workspace_premium</span>
        <h3 className="text-xl font-display font-bold">Subscription Plan</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {planTiers.map((tier) => {
          const config = PLAN_CONFIG[tier];
          const isSelected = selectedPlan === tier;

          return (
            <div 
              key={tier}
              onClick={() => setSelectedPlan(tier)}
              className={`rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                isSelected 
                  ? 'border-[#4A9FD4] shadow-lg shadow-blue-100' 
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-display font-black text-lg ${isSelected ? 'text-[#4A9FD4]' : 'text-slate-700'}`}>
                    {tier}
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'border-[#4A9FD4] bg-[#4A9FD4]' : 'border-slate-200'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 mb-4">{config.subtitle}</p>

                <div className="space-y-2">
                  {config.features.map(feature => (
                    <div 
                      key={feature.name}
                      className={`flex items-center gap-2 ${
                        feature.included ? '' : 'opacity-40'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-xs ${
                        feature.included ? 'text-emerald-500' : 'text-slate-300'
                      }`}>
                        {feature.included ? 'check_circle' : 'cancel'}
                      </span>
                      <span className={`text-[11px] font-medium ${
                        feature.included ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PlanSelection;