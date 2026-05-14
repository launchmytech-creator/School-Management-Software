import React, { useState, useEffect } from 'react';

import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { User, Shield, Lock, Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import InputField from '../../components/ui/InputField';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

const SchoolSettingsPage: React.FC = () => {
  const { showNotification } = useNotification();
  const { user, refetchUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
    }
  }, [user]);

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

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="School Settings"
        subtitle="Manage your profile and security"
        breadcrumb={{
          links: [
            { label: "Settings", href: "/admin/school-settings" },
            { label: "School Settings", active: true },
          ],
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            Profile Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 text-xl font-black">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm text-slate-500">Your personal details</p>
            </div>
            <InputField
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <InputField
              label="Email"
              type="email"
              value={user?.email || ""}
              disabled
            />
            <InputField
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
            />
            <Button
              onClick={handleProfileUpdate}
              disabled={savingProfile}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
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

        {/* Security */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            Security
          </h3>
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
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold disabled:opacity-50"
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
    </div>
  );
};

export default SchoolSettingsPage;
