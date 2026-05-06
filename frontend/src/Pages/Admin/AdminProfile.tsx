import React, { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Check,
  X,
  Loader2,
  Calendar,
  Receipt,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { schoolService } from "../../services/schoolService";
import { useNotification } from "../../context/NotificationContext";
import { Button } from "../../components/ui/button";
import {
  PLAN_LABELS,
  PLAN_FEATURE_COMPARISON,
  PLAN_ORDER,
  FEATURE_LABELS,
} from "../../lib/permissions";
import type { SubscriptionPlan, SubscriptionTier, FeeTerm } from "../../types/school";
import { ConfirmDialog } from "../../components/modals/ConfirmDialog";
import PageHeader from "../../components/common/PageHeader";
import { useAvailablePlans } from "../../hooks/queries";

const FEE_TERM_LABELS: Record<FeeTerm, string> = {
  'YEARLY': 'Yearly',
  'HALF-YEARLY': 'Half-Yearly',
  'QUARTERLY': 'Quarterly',
  'MONTHLY': 'Monthly',
};

const FEE_TERM_NUMERIC: Record<FeeTerm, number> = {
  'YEARLY': 1,
  'HALF-YEARLY': 2,
  'QUARTERLY': 4,
  'MONTHLY': 12,
};

const FEE_TO_API_KEY: Record<FeeTerm, string> = {
  'YEARLY': 'yearly',
  'HALF-YEARLY': 'half-yearly',
  'QUARTERLY': 'quarterly',
  'MONTHLY': 'monthly',
};

const formatCurrency = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

interface PlanWithPricing extends SubscriptionPlan {
  allowed_fee_terms?: string[];
  price_yearly?: number;
  price_half_yearly?: number;
  price_quarterly?: number;
  price_monthly?: number;
}

const PLAN_TIER: Record<string, number> = {
  'BASIC': 1,
  'PREMIUM': 2,
  'BUSINESS': 3,
};

const AdminProfile: React.FC = () => {
  const { user, refetchUser } = useAuth();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading: loadingPlans } = useAvailablePlans(String(user?.schoolId || ''));
  const [selectedPlan, setSelectedPlan] = useState<PlanWithPricing | null>(null);
  const [selectedFeeTerm, setSelectedFeeTerm] = useState<FeeTerm>('YEARLY');
  const [changingPlan, setChangingPlan] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    planId: null as number | null,
  });
  const [paymentHistory, setPaymentHistory] = useState<Record<string, unknown>[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [pricingPreview, setPricingPreview] = useState<{
    originalAmount: number;
    creditApplied: number;
    payableAmount: number;
    remainingDays: number;
    newPlanName: string;
    currentPlanName: string;
    feeTerm: string;
    newEndDate: string;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const currentPlanName = user?.subscriptionPlan as SubscriptionTier;
  const currentPlanId = user?.subscriptionPlanId;
  const subscriptionStatus = user?.subscriptionStatus;

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async () => {
    if (!user?.schoolId) return;
    setLoadingHistory(true);
    try {
      const history = await schoolService.getSubscriptionHistory(String(user.schoolId));
      setPaymentHistory(history);
    } catch {
      showNotification('Failed to load payment history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const daysRemaining = useMemo(() => {
    if (!user?.subscriptionEndDate) return 0;
    const now = new Date();
    const endDate = new Date(user.subscriptionEndDate);
    const diff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [user?.subscriptionEndDate]);

  const getPlanTier = (planName: string) => PLAN_TIER[planName] || 0;

  const getChangeType = (newPlanName: string): 'upgrade' | 'downgrade' | 'same_plan' => {
    const currentTier = getPlanTier((currentPlanName || '').toUpperCase());
    const newTier = getPlanTier(newPlanName.toUpperCase());
    if (newTier > currentTier) return 'upgrade';
    if (newTier < currentTier) return 'downgrade';
    return 'same_plan';
  };

  const handlePlanSelect = async (plan: PlanWithPricing) => {
    if (!plan || !user?.schoolId) return;
    setSelectedPlan(plan);

    const allowedTerms: FeeTerm[] = plan.allowed_fee_terms
      ? plan.allowed_fee_terms.map((t: string) => {
          const map: Record<string, FeeTerm> = { yearly: 'YEARLY', 'half-yearly': 'HALF-YEARLY', quarterly: 'QUARTERLY', monthly: 'MONTHLY' };
          return map[t] || 'YEARLY';
        })
      : ['YEARLY'];
    setSelectedFeeTerm(allowedTerms[0]);

    const changeType = getChangeType(plan.name);
    if (changeType === 'upgrade') {
      setLoadingPreview(true);
      try {
        const preview = await schoolService.calculateUpgrade(String(user.schoolId), {
          planId: plan.id,
          feeTerm: FEE_TO_API_KEY[allowedTerms[0]],
        });
        setPricingPreview(preview);
      } catch {
        setPricingPreview(null);
      } finally {
        setLoadingPreview(false);
      }
    } else {
      setPricingPreview(null);
    }
  };

  const handleFeeTermChange = async (term: FeeTerm) => {
    setSelectedFeeTerm(term);
    if (!selectedPlan || !user?.schoolId) return;

    const changeType = getChangeType(selectedPlan.name);
    if (changeType === 'upgrade') {
      setLoadingPreview(true);
      try {
        const preview = await schoolService.calculateUpgrade(String(user.schoolId), {
          planId: selectedPlan.id,
          feeTerm: FEE_TO_API_KEY[term],
        });
        setPricingPreview(preview);
      } catch {
        setPricingPreview(null);
      } finally {
        setLoadingPreview(false);
      }
    }
  };

  const handlePlanChange = async () => {
    if (!selectedPlan || !user?.schoolId) return;
    setChangingPlan(true);
    try {
      const result = await schoolService.purchaseSubscription(String(user.schoolId), {
        planId: selectedPlan.id,
        feeTerm: FEE_TO_API_KEY[selectedFeeTerm],
        feeTermNumeric: FEE_TERM_NUMERIC[selectedFeeTerm],
        paymentMode: 'cash',
      });

      await refetchUser();

      if (result.type === 'downgrade') {
        showNotification(result.message || 'Downgrade scheduled successfully', 'success');
      } else if (result.type === 'upgrade') {
        showNotification(
          `Upgraded to ${result.planName}! Credit: ${formatCurrency(result.creditApplied || 0)}. You paid: ${formatCurrency(result.payableAmount || 0)}.`,
          'success'
        );
      } else {
        showNotification(
          `Purchased ${result.planName} plan with ${FEE_TERM_LABELS[selectedFeeTerm]} billing!`,
          'success'
        );
      }

      setConfirmDialog({ isOpen: false, planId: null });
      setSelectedPlan(null);
      setPricingPreview(null);
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string
      };
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to purchase subscription";
      showNotification(errorMessage, "error");
    } finally {
      setChangingPlan(false);
    }
  };

  const getPlanColor = (plan: SubscriptionTier) => {
    switch (plan) {
      case "BASIC":
        return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", btn: "bg-emerald-600 hover:bg-emerald-700" };
      case "PREMIUM":
        return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", btn: "bg-blue-600 hover:bg-blue-700" };
      case "BUSINESS":
        return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", btn: "bg-purple-600 hover:bg-purple-700" };
      default:
        return { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", btn: "bg-slate-600 hover:bg-slate-700" };
    }
  };

  const getPlanPrice = (plan: PlanWithPricing, feeTerm: FeeTerm): number => {
    const key = `price_${FEE_TO_API_KEY[feeTerm].replace('-', '_')}`;
    const val = (plan as Record<string, unknown>)[key];
    return val ? Number(val) : 0;
  };

  const getConfirmMessage = () => {
    if (!selectedPlan) return '';
    const changeType = getChangeType(selectedPlan.name);

    if (changeType === 'upgrade' && pricingPreview) {
      return `Upgrade to ${PLAN_LABELS[selectedPlan.name]} with ${FEE_TERM_LABELS[selectedFeeTerm]} billing.`;
    }

    if (changeType === 'downgrade') {
      return `Downgrade to ${PLAN_LABELS[selectedPlan.name]} will take effect when your current subscription expires${user?.subscriptionEndDate ? ` on ${new Date(user.subscriptionEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}. Your current plan continues until then.`;
    }

    return `Are you sure you want to purchase ${PLAN_LABELS[selectedPlan.name]} plan with ${FEE_TERM_LABELS[selectedFeeTerm]} billing?`;
  };

  const getConfirmDialogVariant = () => {
    if (!selectedPlan) return 'warning' as const;
    const changeType = getChangeType(selectedPlan.name);
    if (changeType === 'downgrade') return 'info' as const;
    return 'warning' as const;
  };

  const getConfirmText = () => {
    if (changingPlan) return 'Processing...';
    if (!selectedPlan) return 'Confirm Purchase';
    const changeType = getChangeType(selectedPlan.name);
    if (changeType === 'upgrade') return 'Confirm Upgrade';
    if (changeType === 'downgrade') return 'Schedule Downgrade';
    return 'Confirm Purchase';
  };

  const getButtonLabel = () => {
    if (!selectedPlan) return 'Purchase Subscription';
    const changeType = getChangeType(selectedPlan.name);
    if (changeType === 'upgrade') return 'Upgrade Now';
    if (changeType === 'downgrade') return 'Schedule Downgrade';
    return 'Purchase Subscription';
  };

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Plans"
        subtitle="Manage your subscription, view pricing details and payment history"
        breadcrumb={{
          links: [
            { label: "Settings", href: "/admin/school-settings" },
            { label: "Plans", active: true },
          ],
        }}
      />

      {/* Plan Cards */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Available Plans</h2>
            <p className="text-sm text-slate-500">Select a plan and billing frequency</p>
          </div>
        </div>

        {loadingPlans ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLAN_ORDER.map((planName) => {
              const plan = plans.find((p) => p.name?.toUpperCase() === planName) as PlanWithPricing | undefined;
              const colors = getPlanColor(planName);
              const isCurrent = currentPlanId === plan?.id;
              const allowedTerms: FeeTerm[] = plan?.allowed_fee_terms
                ? plan.allowed_fee_terms.map((t: string) => {
                    const map: Record<string, FeeTerm> = { yearly: 'YEARLY', 'half-yearly': 'HALF-YEARLY', quarterly: 'QUARTERLY', monthly: 'MONTHLY' };
                    return map[t] || 'YEARLY';
                  })
                : ['YEARLY'];

              const isSelected = selectedPlan?.id === plan?.id;
              const changeType = plan ? getChangeType(plan.name) : null;

              return (
                <div
                  key={planName}
                  onClick={() => {
                    if (!isCurrent && plan) {
                      handlePlanSelect(plan);
                    }
                  }}
                  className={`rounded-2xl p-6 border-2 transition-all ${
                    isSelected
                      ? `${colors.border} ${colors.bg} shadow-md`
                      : isCurrent
                        ? `${colors.border} ${colors.bg} opacity-70`
                        : "border-slate-200 hover:border-slate-300"
                  } ${!isCurrent && plan ? 'cursor-pointer' : ''}`}
                >
                  {isCurrent && (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${colors.text} ${colors.bg} border ${colors.border} mb-3`}>
                      <Check className="w-3 h-3" /> Current Plan
                    </span>
                  )}

                  {changeType === 'upgrade' && !isCurrent && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
                      <ArrowUpCircle className="w-3 h-3" /> Upgrade
                    </span>
                  )}

                  {changeType === 'downgrade' && !isCurrent && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 mb-3">
                      <ArrowDownCircle className="w-3 h-3" /> Downgrade
                    </span>
                  )}

                  <h3 className={`text-xl font-black ${colors.text}`}>
                    {PLAN_LABELS[planName]}
                  </h3>

                  {plan && (
                    <div className="mt-3 mb-4">
                      <p className="text-3xl font-black text-slate-900">
                        {formatCurrency(getPlanPrice(plan, allowedTerms[0]))}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        per {FEE_TERM_LABELS[allowedTerms[0]].toLowerCase()} billing
                      </p>
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    {Object.entries(PLAN_FEATURE_COMPARISON[planName]).map(
                      ([feature, enabled]) => (
                        <div key={feature} className="flex items-center gap-2">
                          {enabled ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <X className="w-4 h-4 text-slate-300" />
                          )}
                          <span className={`text-sm ${enabled ? "text-slate-700" : "text-slate-400"}`}>
                            {FEATURE_LABELS[feature]}
                          </span>
                        </div>
                      ),
                    )}
                  </div>

                  {isSelected && plan && allowedTerms.length > 1 && (
                    <div className="mt-5 pt-5 border-t border-slate-200/60">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Billing Frequency</p>
                      <div className="flex flex-wrap gap-2">
                        {allowedTerms.map((term) => (
                          <button
                            key={term}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFeeTermChange(term);
                            }}
                            className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${
                              selectedFeeTerm === term
                                ? 'bg-slate-800 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {FEE_TERM_LABELS[term]} · {formatCurrency(getPlanPrice(plan, term))}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isSelected && plan && (
                    <div className="mt-5 pt-5 border-t border-slate-200/60">
                      <p className="text-sm font-bold text-slate-700 mb-2">
                        Total: {formatCurrency(getPlanPrice(plan, selectedFeeTerm))} / {FEE_TERM_LABELS[selectedFeeTerm].toLowerCase()}
                      </p>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDialog({ isOpen: true, planId: plan.id });
                        }}
                        className={`w-full rounded-xl font-bold text-white ${colors.btn}`}
                      >
                        {getButtonLabel()}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Payment History</h2>
            <p className="text-sm text-slate-500">Your past subscription payments</p>
          </div>
        </div>

        {loadingHistory && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        )}

        {!loadingHistory && (
          paymentHistory.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">No payment history found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                    <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing</th>
                    <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paymentHistory.map((payment) => {
                    const paymentType = (payment.payment_type as string) || 'new_purchase';
                    const typeLabel = paymentType === 'upgrade' ? 'Upgrade' :
                      paymentType === 'downgrade_scheduled' ? 'Downgrade Scheduled' :
                      paymentType === 'billing_change' ? 'Billing Change' : 'New Purchase';
                    const typeColor = paymentType === 'upgrade' ? 'bg-blue-100 text-blue-700' :
                      paymentType === 'downgrade_scheduled' ? 'bg-amber-100 text-amber-700' :
                      paymentType === 'billing_change' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700';

                    return (
                      <tr key={payment.id as string} className="hover:bg-slate-50/50">
                        <td className="py-4 px-4 text-sm text-slate-700 font-medium">
                          {payment.payment_date ? new Date(payment.payment_date as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-sm font-bold text-slate-700">
                          {payment.plan_name as string}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-600 capitalize">
                          {payment.fee_term as string}
                        </td>
                        <td className="py-4 px-4 text-sm font-bold text-slate-800">
                          {formatCurrency(payment.amount as number)}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold ${typeColor}`}>
                            {typeLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => {
          setConfirmDialog({ isOpen: false, planId: null });
          setSelectedPlan(null);
        }}
        onConfirm={handlePlanChange}
        title={
          selectedPlan && getChangeType(selectedPlan.name) === 'upgrade' ? 'Upgrade Subscription' :
          selectedPlan && getChangeType(selectedPlan.name) === 'downgrade' ? 'Schedule Downgrade' :
          'Purchase Subscription'
        }
        message={getConfirmMessage()}
        confirmText={getConfirmText()}
        variant={getConfirmDialogVariant()}
        loading={changingPlan}
      >
        {pricingPreview && selectedPlan && getChangeType(selectedPlan.name) === 'upgrade' && (
          <div className="mt-2 bg-slate-50 rounded-xl p-5 space-y-3">
            {loadingPreview ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                <span className="ml-2 text-sm text-slate-500">Calculating pricing...</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Original Price</span>
                  <span className="text-sm font-bold text-slate-800">{formatCurrency(pricingPreview.originalAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-emerald-600">
                    Credit ({pricingPreview.remainingDays} days remaining)
                  </span>
                  <span className="text-sm font-bold text-emerald-600">- {formatCurrency(pricingPreview.creditApplied)}</span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                  <span className="text-base font-bold text-slate-900">You Pay</span>
                  <span className="text-xl font-black text-slate-900">{formatCurrency(pricingPreview.payableAmount)}</span>
                </div>
                <p className="text-xs text-slate-500 text-center">
                  New subscription valid until {new Date(pricingPreview.newEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </>
            )}
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
};

export default AdminProfile;
