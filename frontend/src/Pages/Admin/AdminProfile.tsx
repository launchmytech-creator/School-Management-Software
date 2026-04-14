import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Check,
  X,
  Loader2,
  ExternalLink,
  Star,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { schoolService } from "../../services/schoolService";
import { useNotification } from "../../context/NotificationContext";
import { Button } from "../../components/ui/button";
import {
  PLAN_LABELS,
  PLAN_DESCRIPTIONS,
  PLAN_FEATURE_COMPARISON,
  PLAN_PRICING,
  PLAN_ORDER,
  FEATURE_LABELS,
} from "../../lib/permissions";
import type { SubscriptionPlan, SubscriptionTier } from "../../types/school";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import PageHeader from "../../components/common/PageHeader";
import { useAvailablePlans } from "../../hooks/queries";

const AdminProfile: React.FC = () => {
  const { user, refetchUser } = useAuth();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading: loadingPlans } = useAvailablePlans(String(user?.schoolId || ''));
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [changingPlan, setChangingPlan] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    planId: null as number | null,
  });

  const currentPlanName = user?.subscriptionPlan as SubscriptionTier;
  const currentPlanId = user?.subscriptionPlanId;

  const handlePlanChange = async () => {
    if (!selectedPlan || !user?.schoolId) return;
    setChangingPlan(true);
    try {
      await schoolService.changePlan(String(user.schoolId), {
        targetPlanId: selectedPlan.id,
      });
      await refetchUser();
      showNotification(
        `Successfully changed to ${PLAN_LABELS[selectedPlan.name]} plan!`,
        "success",
      );
      setConfirmDialog({ isOpen: false, planId: null });
      setSelectedPlan(null);
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    } catch (err: unknown) {
      const error = err as { 
        response?: { data?: { message?: string } }; 
        message?: string 
      };
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        "Failed to change plan";
      showNotification(errorMessage, "error");
    } finally {
      setChangingPlan(false);
    }
  };

  const getPlanColor = (plan: SubscriptionTier) => {
    switch (plan) {
      case "BASIC":
        return {
          bg: "bg-emerald-100",
          text: "text-emerald-700",
          border: "border-emerald-200",
          icon: Check,
        };
      case "PREMIUM":
        return {
          bg: "bg-blue-100",
          text: "text-blue-700",
          border: "border-blue-200",
          icon: Star,
        };
      case "BUSINESS":
        return {
          bg: "bg-purple-100",
          text: "text-purple-700",
          border: "border-purple-200",
          icon: Star,
        };
      default:
        return {
          bg: "bg-slate-100",
          text: "text-slate-700",
          border: "border-slate-200",
          icon: Check,
        };
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Plans"
        subtitle="Manage your subscription plans"
        breadcrumb={{
          links: [
            { label: "Settings", href: "/admin/school-settings" },
            { label: "Plans", active: true },
          ],
        }}
      />

      {/* Subscription Section */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Subscription Plans
              </h2>
              <p className="text-sm text-slate-500">
                Choose the plan that fits your school's needs
              </p>
            </div>
          </div>
        </div>

        {/* Plan Cards */}
        {loadingPlans ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {PLAN_ORDER.map((planName) => {
                const plan = plans.find((p) => p.name === planName);
                const colors = getPlanColor(planName);
                const isCurrent = currentPlanId === plan?.id;

                return (
                  <div
                    key={planName}
                    className={`rounded-2xl p-6 border-2 transition-all ${
                      isCurrent
                        ? `${colors.border} ${colors.bg}`
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {isCurrent && (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${colors.text} mb-3`}
                      >
                        Current Plan
                      </span>
                    )}
                    <h3 className={`text-xl font-black ${colors.text}`}>
                      {PLAN_LABELS[planName]}
                    </h3>
                    <p className="text-2xl font-black text-slate-900 mt-2">
                      {PLAN_PRICING[planName]}
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      {PLAN_DESCRIPTIONS[planName]}
                    </p>

                    <div className="mt-4 space-y-2">
                      {Object.entries(PLAN_FEATURE_COMPARISON[planName]).map(
                        ([feature, enabled]) => (
                          <div key={feature} className="flex items-center gap-2">
                            {enabled ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <X className="w-4 h-4 text-slate-300" />
                            )}
                            <span
                              className={`text-sm ${
                                enabled ? "text-slate-700" : "text-slate-400"
                              }`}
                            >
                              {FEATURE_LABELS[feature]}
                            </span>
                          </div>
                        ),
                      )}
                    </div>

                    {!isCurrent && plan && (
                      <Button
                        onClick={() => {
                          setSelectedPlan(plan);
                          setConfirmDialog({
                            isOpen: true,
                            planId: plan.id,
                          });
                        }}
                        className={`w-full mt-6 rounded-xl font-bold ${
                          planName === "BUSINESS"
                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                            : planName === "PREMIUM"
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        Select Plan
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Contact Support */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">
                    Need Help Choosing a Plan?
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Contact our sales team on WhatsApp for personalized
                    assistance.
                  </p>
                  <a
                    href="https://wa.me/91628384605"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 text-sm font-bold text-green-600 hover:text-green-700"
                  >
                    Contact via WhatsApp
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => {
          setConfirmDialog({ isOpen: false, planId: null });
          setSelectedPlan(null);
        }}
        onConfirm={handlePlanChange}
        title={`${selectedPlan && PLAN_ORDER.indexOf(selectedPlan.name) > PLAN_ORDER.indexOf(currentPlanName || "BASIC") ? "Upgrade" : "Downgrade"} Plan`}
        message={`Are you sure you want to ${selectedPlan && PLAN_ORDER.indexOf(selectedPlan.name) > PLAN_ORDER.indexOf(currentPlanName || "BASIC") ? "upgrade" : "downgrade"} to ${selectedPlan ? PLAN_LABELS[selectedPlan.name] : ""} plan?`}
        confirmText={changingPlan ? "Processing..." : "Confirm"}
        variant="warning"
      />
    </div>
  );
};

export default AdminProfile;
