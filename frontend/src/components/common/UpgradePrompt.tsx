import React from 'react';
import { FEATURE_LABELS, getRequiredPlan, PLAN_LABELS } from '../../lib/permissions';
import { Lock } from 'lucide-react';
import type { SubscriptionTier } from '../../types/school';

interface UpgradePromptProps {
  feature: string;
  className?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ feature, className = '' }) => {
  const requiredPlan = getRequiredPlan(feature);
  const featureName = FEATURE_LABELS[feature] || feature;
  const planName = requiredPlan ? PLAN_LABELS[requiredPlan as SubscriptionTier] : 'Premium';

  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] p-8 ${className}`}>
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-amber-600" />
        </div>
        
        <h2 className="text-xl font-bold text-amber-900 mb-2">
          Feature Not Available
        </h2>
        
        <p className="text-amber-700 mb-4">
          <span className="font-semibold">{featureName}</span> is not included in your current plan.
        </p>
        
        <div className="bg-white rounded-xl p-4 border border-amber-100">
          <p className="text-sm text-slate-600 mb-2">Required Plan:</p>
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-[#1E3A5F] text-white">
            {planName} Plan
          </span>
        </div>
        
        <p className="text-xs text-amber-600 mt-4">
          Contact your administrator to upgrade your subscription plan.
        </p>
      </div>
    </div>
  );
};

export default UpgradePrompt;
