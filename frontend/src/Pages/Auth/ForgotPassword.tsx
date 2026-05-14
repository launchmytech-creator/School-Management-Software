import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthSidebar from "../../components/auth/AuthSidebar";
import FormField from "../../components/ui/FormField";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "../../schemas/auth.schema";
import { authService } from "../../services/authService";
import { useNotification } from "../../context/NotificationContext";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setLoading(true);
      await authService.forgotPassword(data.email);
      setShowSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send reset email. Please try again.";
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
                <span className="material-symbols-outlined text-green-600 text-3xl">mail</span>
              </div>
              <h3 className="text-[#133257] text-3xl font-bold mb-3">
                Check Your Email
              </h3>
              <p className="text-[#133257]/60 text-sm leading-relaxed mb-8">
                If an account exists with this email, we've sent a password reset link. Please check your inbox.
              </p>
              <p className="text-[#133257]/50 text-xs mb-8">
                The reset link will expire in 1 hour.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full h-12 bg-[#133257] hover:bg-[#133257]/90 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-[#133257]/20"
              >
                Back to Sign In
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
              Forgot Password?
            </h3>
            <p className="text-[#133257]/50 text-sm leading-relaxed">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <FormField
              label="Email Address"
              placeholder="Enter your email"
              type="email"
              registration={register("email")}
              error={errors.email}
              icon="alternate_email"
            />

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
                  Sending...
                </>
              ) : (
                <>
                  Send Reset Link
                  <span className="material-symbols-outlined text-lg">
                    send
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

export default ForgotPassword;