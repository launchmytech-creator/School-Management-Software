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
  allowed_fee_terms: string[];
}

interface EditingPrices {
  yearly: number;
  halfYearly: number;
  quarterly: number;
  monthly: number;
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
  const [editingPrices, setEditingPrices] = useState<EditingPrices | null>(null);

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const data = await schoolService.getAvailablePlansWithPricing();
      return data as Plan[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ planId, prices }: { planId: number; prices: Partial<Record<string, number>> }) => {
      return schoolService.updatePlanPricing(planId, prices);
    },
    onSuccess: () => {
      showNotification('Pricing updated successfully', 'success');
      setEditingPlanId(null);
      setEditingPrices(null);
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
    onError: (error: Error) => {
      showNotification(error.message || 'Failed to update pricing', 'error');
    },
  });

  const startEditing = (plan: Plan) => {
    setEditingPlanId(plan.id);
    setEditingPrices({
      yearly: plan.price_yearly,
      halfYearly: plan.price_half_yearly,
      quarterly: plan.price_quarterly,
      monthly: plan.price_monthly,
    });
  };

  const cancelEditing = () => {
    setEditingPlanId(null);
    setEditingPrices(null);
  };

  const savePricing = () => {
    if (!editingPlanId || !editingPrices) return;
    updateMutation.mutate({
      planId: editingPlanId,
      prices: {
        priceYearly: editingPrices.yearly,
        priceHalfYearly: editingPrices.halfYearly,
        priceQuarterly: editingPrices.quarterly,
        priceMonthly: editingPrices.monthly,
      },
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

  const feeTermColumns = [
    { key: 'yearly' as const, label: 'Yearly', allowedFor: ['Basic', 'Premium', 'Business'] },
    { key: 'halfYearly' as const, label: 'Half-Yearly', allowedFor: ['Premium', 'Business'] },
    { key: 'quarterly' as const, label: 'Quarterly', allowedFor: ['Premium', 'Business'] },
    { key: 'monthly' as const, label: 'Monthly', allowedFor: ['Premium', 'Business'] },
  ];

  return (
    <MainLayout title="Pricing Management">
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <div className="space-y-2">
          <h2 className="text-[28px] font-display font-extrabold text-[#1E3A5F]">
            Pricing Management
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            Manage subscription plan prices. Changes only affect new purchases — existing school payments remain unchanged.
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
              {feeTermColumns.map(col => (
                <div key={col.key} className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  {col.label}
                </div>
              ))}
            </div>

            {/* Plan Rows */}
            {plans.map((plan) => {
              const isEditing = editingPlanId === plan.id;
              const isBasic = plan.name === 'Basic';

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

                  {/* Price Columns */}
                  {feeTermColumns.map(col => {
                    const isAllowed = col.allowedFor.includes(plan.name);
                    const dbKey = `price_${col.key === 'yearly' ? 'yearly' : col.key === 'halfYearly' ? 'half_yearly' : col.key === 'quarterly' ? 'quarterly' : 'monthly'}`;
                    const value = editingPrices ? editingPrices[col.key] : (plan as Record<string, number>)[dbKey];

                    if (!isAllowed) {
                      return (
                        <div key={col.key} className="text-center text-slate-300 text-xs font-medium">
                          —
                        </div>
                      );
                    }

                    if (isEditing && editingPrices) {
                      return (
                        <div key={col.key} className="flex items-center justify-center">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                            <input
                              type="number"
                              min={0}
                              value={editingPrices[col.key]}
                              onChange={(e) => setEditingPrices(prev => prev ? { ...prev, [col.key]: Number(e.target.value) } : null)}
                              className="w-28 h-10 pl-7 pr-3 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={col.key} className="text-center text-sm font-bold text-slate-700">
                        {formatCurrency(value)}
                      </div>
                    );
                  })}
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

        {!editingPlanId && plans.length > 0 && (
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={() => startEditing(plans[0])}
              className="h-12 px-8 rounded-xl border border-primary text-primary font-bold text-xs uppercase tracking-widest hover:bg-primary/5 transition-all cursor-pointer flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              Edit Prices
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
              Updating plan prices only affects <strong className="text-slate-700">new subscription purchases</strong>. 
              Existing school payment records are stored at the time of purchase and will <strong className="text-slate-700">not be affected</strong> by price changes.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PricingManagement;
