import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FEATURE_LABELS, getRequiredPlan, PLAN_LABELS, PLAN_SUITABILITY, FEATURE_DESCRIPTIONS } from '../../lib/permissions';
import { Lock, Shield, Star, ArrowRight } from 'lucide-react';
import type { SubscriptionTier } from '../../types/school';
import { Button } from '../ui/button';

interface UpgradePromptProps {
  feature: string;
  className?: string;
}

const PLAN_COLORS: Record<SubscriptionTier, { bg: string; text: string; border: string }> = {
  BASIC: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  PREMIUM: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  BUSINESS: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
};

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ feature, className = '' }) => {
  const navigate = useNavigate();
  const requiredPlan = getRequiredPlan(feature);
  const featureName = FEATURE_LABELS[feature] || feature;
  const planName = requiredPlan ? PLAN_LABELS[requiredPlan as SubscriptionTier] : 'Premium';
  const planSuitability = requiredPlan ? PLAN_SUITABILITY[requiredPlan as SubscriptionTier] : '';
  const featureDescription = FEATURE_DESCRIPTIONS[feature] || '';
  const planColors = requiredPlan ? PLAN_COLORS[requiredPlan as SubscriptionTier] : PLAN_COLORS.PREMIUM;
  const PlanIcon = requiredPlan === 'BUSINESS' ? Star : Shield;

  const handleUpgrade = () => {
    navigate('/admin/profile?section=subscription');
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-[300px] p-6 ${className}`}>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-2xl p-8 max-w-md text-center shadow-lg">
        <div className={`w-16 h-16 ${planColors.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <Lock className={`w-8 h-8 ${planColors.text}`} />
        </div>
        
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Feature Not Available
        </h2>
        
        <p className="text-slate-700 mb-4">
          <span className="font-semibold text-lg">{featureName}</span>
        </p>
        
        {featureDescription && (
          <p className="text-sm text-slate-500 mb-4 italic">
            {featureDescription}
          </p>
        )}
        
        <div className={`bg-white rounded-xl p-4 border ${planColors.border} mb-4`}>
          <p className="text-sm text-slate-500 mb-2">Required Plan:</p>
          <div className="flex items-center justify-center gap-2">
            <PlanIcon className={`w-5 h-5 ${planColors.text}`} />
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${planColors.bg} ${planColors.text}`}>
              {planName} Plan
            </span>
          </div>
        </div>
        
        {planSuitability && (
          <p className="text-xs text-slate-500 mb-4">
            {planSuitability}
          </p>
        )}
        
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 mb-4">
          <p className="text-xs text-amber-700">
            Contact your administrator to upgrade your subscription plan.
          </p>
        </div>

        <Button
          onClick={handleUpgrade}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold"
        >
          <Shield className="w-4 h-4 mr-2" />
          Upgrade Plan
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default UpgradePrompt;
