import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import AuthSidebar from "../../components/auth/AuthSidebar";
import FormField from "../../components/ui/FormField";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordFormData } from "../../schemas/auth.schema";
import { authService } from "../../services/authService";
import { useNotification } from "../../context/NotificationContext";

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  if (!token) {
    return (
      <div className="flex h-screen w-full bg-white font-body overflow-hidden">
        <AuthSidebar />

        <div className="flex-1 lg:w-[40%] flex flex-col px-8 md:px-16 py-6 overflow-hidden bg-white">
          <div className="max-w-[400px] mx-auto w-full flex-1 flex flex-col justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-red-600 text-3xl">error</span>
              </div>
              <h3 className="text-[#133257] text-3xl font-bold mb-3">
                Invalid Reset Link
              </h3>
              <p className="text-[#133257]/60 text-sm leading-relaxed mb-8">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <button
                onClick={() => navigate("/forgot-password")}
                className="w-full h-12 bg-[#133257] hover:bg-[#133257]/90 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-[#133257]/20"
              >
                Request New Link
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setLoading(true);
      await authService.resetPassword(token, data.newPassword);
      setShowSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reset password. Please try again.";
      showNotification(message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="flex h-screen w-full bg-white font-body overflow-hidden">
        <AuthSidebar />

        <div className="flex-1 lg:w-[40%] flex flex-col px-8 md:px-16 py-6 overflow-hidden bg-white">
          <div className="max-w-[400px] mx-auto w-full flex-1 flex flex-col justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
              </div>
              <h3 className="text-[#133257] text-3xl font-bold mb-3">
                Password Reset Complete
              </h3>
              <p className="text-[#133257]/60 text-sm leading-relaxed mb-8">
                Your password has been successfully reset. You can now login with your new password.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full h-12 bg-[#133257] hover:bg-[#133257]/90 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-[#133257]/20"
              >
                Sign In
                <span className="material-symbols-outlined text-lg">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white font-body overflow-hidden">
      <AuthSidebar />

      <div className="flex-1 lg:w-[40%] flex flex-col px-8 md:px-16 py-6 overflow-hidden bg-white">
        <div className="max-w-[400px] mx-auto w-full flex-1 flex flex-col justify-center">
          <div className="mb-8">
            <h3 className="text-[#133257] text-4xl font-bold mb-2">
              Reset Password
            </h3>
            <p className="text-[#133257]/50 text-sm leading-relaxed">
              Create a new password for your account.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <FormField
              label="New Password"
              placeholder="Enter new password"
              type={showPassword ? "text" : "password"}
              registration={register("newPassword")}
              error={errors.newPassword}
              icon="lock"
              onToggleEye={() => setShowPassword(!showPassword)}
            />

            <FormField
              label="Confirm Password"
              placeholder="Confirm new password"
              type={showConfirmPassword ? "text" : "password"}
              registration={register("confirmPassword")}
              error={errors.confirmPassword}
              icon="lock"
              onToggleEye={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            <div className="bg-[#133257]/5 p-3 rounded-lg">
              <p className="text-xs text-[#133257]/70 font-medium mb-2">Password must contain:</p>
              <ul className="text-xs text-[#133257]/60 space-y-1">
                <li className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]">check</span>
                  At least 8 characters
                </li>
                <li className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]">check</span>
                  One uppercase letter
                </li>
                <li className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]">check</span>
                  One lowercase letter
                </li>
                <li className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]">check</span>
                  One number
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-12 bg-[#133257] hover:bg-[#133257]/90 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-[#133257]/20 mt-6 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Resetting...
                </>
              ) : (
                <>
                  Reset Password
                  <span className="material-symbols-outlined text-lg">
                    check
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="text-xs text-[#133257]/60 hover:text-[#133257] font-medium inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;