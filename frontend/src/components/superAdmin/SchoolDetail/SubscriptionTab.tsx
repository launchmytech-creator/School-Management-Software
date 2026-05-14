import React, { useState } from 'react';
import type { School } from '../../../types/school';
import PlanCard from './PlanCard';
import PlanChangeDialog from './PlanChangeDialog';
import { useCalculateUpgrade, usePurchaseSubscription } from '../../../hooks/queries/useSchools';

interface SubscriptionTabProps {
  school: School;
  plans: Record<string, unknown>[];
  onSchoolUpdated: () => void;
}

const SubscriptionTab: React.FC<SubscriptionTabProps> = ({ school, plans, onSchoolUpdated }) => {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Record<string, unknown> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const calculateMutation = useCalculateUpgrade();
  const purchaseMutation = usePurchaseSubscription();

  const currentPlan = plans.find(p => {
    const planName = (p.name as string)?.toLowerCase();
    return planName === school.plan.toLowerCase();
  });

  const handlePlanSelect = (planId: number) => {
    const plan = plans.find(p => Number(p.id) === planId);
    if (plan) {
      setSelectedPlanId(planId);
      setSelectedPlan(plan);
      setIsDialogOpen(true);
    }
  };

  const handleCalculate = (planId: number, feeTerm: string) => {
    calculateMutation.mutate({ schoolId: school.id, data: { planId, feeTerm } });
  };

  const handleConfirm = (data: { planId: number; feeTerm: string; feeTermNumeric: number; paymentMode: string }) => {
    purchaseMutation.mutate(
      { schoolId: school.id, data: { ...data, transactionReference: '' } },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setSelectedPlanId(null);
          setSelectedPlan(null);
          onSchoolUpdated();
        },
      }
    );
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
        <h4 className="text-sm font-black text-[#1E3A5F] uppercase tracking-widest mb-4">Current Subscription</h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Plan</p>
            <p className="text-lg font-black text-[#1E3A5F]">{school.plan}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
            <p className="text-sm font-bold text-slate-700 capitalize">{school.subscriptionStatus}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">End Date</p>
            <p className="text-sm font-bold text-slate-700">
              {school.subscriptionEndDate ? new Date(school.subscriptionEndDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Credit Balance</p>
            <p className="text-lg font-black text-purple-700">₹{(school.creditBalance || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-black text-[#1E3A5F] uppercase tracking-widest mb-6">Available Plans</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const planName = (plan.name as string)?.toLowerCase();
            const isCurrent = planName === school.plan.toLowerCase();
            return (
              <PlanCard
                key={String(plan.id)}
                name={plan.name as string}
                planId={Number(plan.id)}
                priceYearly={plan.price_yearly as string | number}
                priceHalfYearly={plan.price_half_yearly as string | number}
                priceQuarterly={plan.price_quarterly as string | number}
                priceMonthly={plan.price_monthly as string | number}
                features={(plan.features as Record<string, boolean>) || {}}
                isCurrentPlan={isCurrent}
                isSelected={selectedPlanId === Number(plan.id)}
                onSelect={handlePlanSelect}
              />
            );
          })}
        </div>
      </div>

      <PlanChangeDialog
        key={`plan-change-${isDialogOpen ? selectedPlanId : 'closed'}`}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedPlanId(null);
          setSelectedPlan(null);
          calculateMutation.reset();
        }}
        schoolId={school.id}
        currentPlanId={Number(currentPlan?.id) || 0}
        currentPlanName={school.plan}
        selectedPlanId={selectedPlanId}
        selectedPlanName={selectedPlan?.name as string || ''}
        selectedPlanPricing={{
          yearly: Number(selectedPlan?.price_yearly) || 0,
          halfYearly: Number(selectedPlan?.price_half_yearly) || 0,
          quarterly: Number(selectedPlan?.price_quarterly) || 0,
          monthly: Number(selectedPlan?.price_monthly) || 0,
        }}
        subscriptionEndDate={school.subscriptionEndDate}
        onConfirm={handleConfirm}
        isCalculating={calculateMutation.isPending}
        calculationResult={calculateMutation.data || null}
        onCalculate={handleCalculate}
      />

      {purchaseMutation.isPending && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#0F172A]/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-700">Processing subscription...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionTab;
