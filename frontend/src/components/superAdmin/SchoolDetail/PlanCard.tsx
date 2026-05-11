import React from 'react';
import type { SubscriptionTier } from '../../../types/school';
import { PLAN_FEATURE_COMPARISON } from '../../../lib/permissions';

interface PlanCardProps {
  name: string;
  planId: number;
  priceYearly: string | number;
  priceHalfYearly?: string | number;
  priceQuarterly?: string | number;
  priceMonthly?: string | number;
  features: Record<string, boolean>;
  isCurrentPlan?: boolean;
  isSelected?: boolean;
  onSelect?: (planId: number) => void;
}

const PLAN_TIER_MAP: Record<string, SubscriptionTier> = {
  basic: 'BASIC',
  premium: 'PREMIUM',
  business: 'BUSINESS',
};

const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  fee_management: 'Fee Management',
  marks_management: 'Marks Management',
  attendance: 'Attendance Tracking',
  syllabus_tracking: 'Syllabus Tracking',
  teacher_allocation: 'Teacher Allocation',
  analytics: 'Academic Analytics',
};

const PlanCard: React.FC<PlanCardProps> = ({
  name,
  planId,
  priceYearly,
  priceHalfYearly,
  priceQuarterly,
  priceMonthly,
  features: _features,
  isCurrentPlan,
  isSelected,
  onSelect,
}) => {
  const tier = PLAN_TIER_MAP[name.toLowerCase()] || 'BASIC';
  const planFeatures = PLAN_FEATURE_COMPARISON[tier] || {};

  const borderClass = isCurrentPlan
    ? 'border-emerald-400 ring-2 ring-emerald-100'
    : isSelected
      ? 'border-[#4A9FD4] ring-2 ring-[#4A9FD4]/20'
      : 'border-slate-200 hover:border-slate-300';

  const badgeClass = name.toLowerCase() === 'business'
    ? 'bg-[#1e3a5f] text-white'
    : name.toLowerCase() === 'premium'
      ? 'bg-[#4A9FD4] text-white'
      : 'bg-slate-400 text-white';

  return (
    <div
      className={`relative rounded-2xl border-2 ${borderClass} bg-white p-6 transition-all cursor-pointer`}
      onClick={() => onSelect?.(Number(planId))}
    >
      {isCurrentPlan && (
        <div className="absolute -top-3 left-6 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
          Current Plan
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <span className={`text-[11px] font-black px-4 py-1.5 rounded-lg tracking-widest uppercase ${badgeClass}`}>
          {name.toUpperCase()}
        </span>
        {isSelected && !isCurrentPlan && (
          <span className="material-symbols-outlined text-[#4A9FD4] text-xl">check_circle</span>
        )}
      </div>

      <div className="mb-6">
        <p className="text-3xl font-black text-[#1E3A5F]">
          ₹{Number(priceYearly).toLocaleString('en-IN')}
          <span className="text-sm font-bold text-slate-400">/year</span>
        </p>
        {(priceHalfYearly || priceQuarterly || priceMonthly) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {priceHalfYearly && Number(priceHalfYearly) > 0 && (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                Half-Yearly: ₹{Number(priceHalfYearly).toLocaleString('en-IN')}
              </span>
            )}
            {priceQuarterly && Number(priceQuarterly) > 0 && (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                Quarterly: ₹{Number(priceQuarterly).toLocaleString('en-IN')}
              </span>
            )}
            {priceMonthly && Number(priceMonthly) > 0 && (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                Monthly: ₹{Number(priceMonthly).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {Object.entries(planFeatures).map(([feature, enabled]) => (
          <div key={feature} className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-sm ${enabled ? 'text-emerald-500' : 'text-slate-300'}`}>
              {enabled ? 'check' : 'close'}
            </span>
            <span className={`text-xs font-medium ${enabled ? 'text-slate-600' : 'text-slate-400'}`}>
              {FEATURE_DISPLAY_NAMES[feature] || feature}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanCard;
