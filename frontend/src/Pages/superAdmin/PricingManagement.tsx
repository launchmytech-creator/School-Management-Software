import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MainLayout from '../../layouts/MainLayout';
import { useNotification } from '../../context/NotificationContext';
import { schoolService } from '../../services/schoolService';

interface Plan {
  id: number;
  name: string;
  price_yearly: number;
  price_half_yearly: number;
  price_quarterly: number;
  price_monthly: number;
  features?: Record<string, boolean>;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

const PricingManagement: React.FC = () => {
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [editingYearlyPrice, setEditingYearlyPrice] = useState<number>(0);

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const data = await schoolService.getAvailablePlansWithPricing();
      return data as unknown as Plan[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ planId, priceYearly }: { planId: number; priceYearly: number }) => {
      return schoolService.updatePlanPricing(planId, { priceYearly });
    },
    onSuccess: () => {
      showNotification('Pricing updated successfully', 'success');
      setEditingPlanId(null);
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
    onError: (error: Error) => {
      showNotification(error.message || 'Failed to update pricing', 'error');
    },
  });

  const startEditing = (plan: Plan) => {
    setEditingPlanId(plan.id);
    setEditingYearlyPrice(plan.price_yearly);
  };

  const cancelEditing = () => {
    setEditingPlanId(null);
    setEditingYearlyPrice(0);
  };

  const savePricing = () => {
    if (!editingPlanId) return;
    updateMutation.mutate({
      planId: editingPlanId,
      priceYearly: editingYearlyPrice,
    });
  };

  const getPlanBadge = (name: string) => {
    switch (name) {
      case 'Basic': return 'bg-slate-400 text-white';
      case 'Premium': return 'bg-[#4A9FD4] text-white';
      case 'Business': return 'bg-[#1E3A5F] text-white';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  const getCalculatedPrices = (yearlyPrice: number) => {
    return {
      halfYearly: Math.round(yearlyPrice / 2),
      quarterly: Math.round(yearlyPrice / 4),
      monthly: Math.round(yearlyPrice / 12),
    };
  };

  return (
    <MainLayout title="Pricing Management">
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <div className="space-y-2">
          <h2 className="text-[28px] font-display font-extrabold text-[#1E3A5F]">
            Pricing Management
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            Set the yearly price for each plan. Half-yearly, quarterly, and monthly prices are calculated automatically.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Header Row */}
            <div className="bg-[#F8FAFC] border-b border-slate-100 grid grid-cols-5 gap-4 py-5 px-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Yearly (Edit)</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Half-Yearly</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Quarterly</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Monthly</div>
            </div>

            {/* Plan Rows */}
            {plans.map((plan) => {
              const isEditing = editingPlanId === plan.id;
              const calculated = getCalculatedPrices(isEditing ? editingYearlyPrice : plan.price_yearly);

              return (
                <div
                  key={plan.id}
                  className={`grid grid-cols-5 gap-4 py-6 px-4 items-center border-b border-slate-50 last:border-b-0 ${
                    isEditing ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'
                  }`}
                >
                  {/* Plan Name */}
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-md tracking-widest ${getPlanBadge(plan.name)}`}>
                      {plan.name.toUpperCase()}
                    </span>
                    {!isEditing && (
                      <button
                        onClick={() => startEditing(plan)}
                        className="text-slate-400 hover:text-primary transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                    )}
                  </div>

                  {/* Yearly Price (Editable) */}
                  <div className="flex items-center justify-center">
                    {isEditing ? (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                        <input
                          type="number"
                          min={0}
                          value={editingYearlyPrice}
                          onChange={(e) => setEditingYearlyPrice(Number(e.target.value))}
                          className="w-28 h-10 pl-7 pr-3 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                    ) : (
                      <div className="text-center text-sm font-bold text-slate-700">
                        {formatCurrency(plan.price_yearly)}
                      </div>
                    )}
                  </div>

                  {/* Half-Yearly (Auto-calculated) */}
                  <div className="text-center text-sm font-bold text-slate-700">
                    {formatCurrency(calculated.halfYearly)}
                  </div>

                  {/* Quarterly (Auto-calculated) */}
                  <div className="text-center text-sm font-bold text-slate-700">
                    {formatCurrency(calculated.quarterly)}
                  </div>

                  {/* Monthly (Auto-calculated) */}
                  <div className="text-center text-sm font-bold text-slate-700">
                    {formatCurrency(calculated.monthly)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        {editingPlanId && (
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={cancelEditing}
              disabled={updateMutation.isPending}
              className="h-12 px-8 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={savePricing}
              disabled={updateMutation.isPending}
              className="h-12 px-10 rounded-xl bg-[#4A9FD4] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-200/50 hover:bg-[#4A9FD4]/90 transition-all flex items-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">
                {updateMutation.isPending ? 'sync' : 'check'}
              </span>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 flex gap-5 items-start">
          <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] flex items-center justify-center flex-shrink-0 text-primary">
            <span className="material-symbols-outlined">info</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-primary tracking-tight">Important</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Only the yearly price is editable. Half-yearly, quarterly, and monthly prices are automatically calculated.
              Updates only affect <strong className="text-slate-700">new subscription purchases</strong>.
              Existing school payment records will <strong className="text-slate-700">not be affected</strong> by price changes.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PricingManagement;
