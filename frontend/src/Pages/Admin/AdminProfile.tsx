import React, { useState, useEffect } from "react";
import {
  User,
  Shield,
  CreditCard,
  Check,
  X,
  Loader2,
  ExternalLink,
  Star,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
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

const AdminProfile: React.FC = () => {
  const { user, hasFeature, refetchUser } = useAuth();
  const { showNotification } = useNotification();

  // Profile state
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password state
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Subscription state
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
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

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
    }
    fetchPlans();
  }, [user]);

  const fetchPlans = async () => {
    if (!user?.schoolId) return;
    setLoadingPlans(true);
    try {
      const data = await schoolService.getAvailablePlans(String(user.schoolId));
      setPlans(data);
    } catch {
      showNotification("Failed to load subscription plans", "error");
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleProfileUpdate = async () => {
    setSavingProfile(true);
    try {
      await authService.updateProfile({ fullName, phone });
      await refetchUser();
      setProfileSuccess(true);
      showNotification("Profile updated successfully", "success");
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showNotification(
        error.response?.data?.message || "Failed to update profile",
        "error",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword) {
      showNotification("Please enter a new password", "error");
      return;
    }
    setSavingPassword(true);
    try {
      await authService.updateProfile({
        password: newPassword,
        currentPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordSuccess(true);
      showNotification("Password changed successfully", "success");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showNotification(
        error.response?.data?.message || "Failed to change password",
        "error",
      );
    } finally {
      setSavingPassword(false);
    }
  };

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
      fetchPlans();
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

  const getAllFeatures = () => {
    const features = new Set<string>();
    PLAN_ORDER.forEach((plan) => {
      Object.keys(PLAN_FEATURE_COMPARISON[plan]).forEach((f) =>
        features.add(f),
      );
    });
    return Array.from(features);
  };

  const isCurrentPlan = (planId: number) => planId === currentPlanId;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            My Profile
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your account settings and subscription
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Info Card */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700 text-2xl font-black">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Profile Information
              </h2>
              <p className="text-sm text-slate-500">
                Update your personal details
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
              />
            </div>

            <Button
              onClick={handleProfileUpdate}
              disabled={savingProfile}
              className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
            >
              {savingProfile ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : profileSuccess ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Saved!
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>

        {/* Security Card */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Security</h2>
              <p className="text-sm text-slate-500">Change your password</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              onClick={handlePasswordChange}
              disabled={savingPassword || !currentPassword || !newPassword}
              className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {savingPassword ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : passwordSuccess ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Password Changed!
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </div>
        </div>
      </div>

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
                    href="https://wa.me/916283484605"
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
