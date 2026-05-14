import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthSidebar from "../../components/auth/AuthSidebar";
import FormField from "../../components/ui/FormField";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "../../schemas/auth.schema";

interface LoginError {
  type: "network" | "unauthorized" | "validation" | "server" | "unknown";
  message: string;
}


const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<LoginError | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const parseError = (error: unknown): LoginError => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (
        message.includes("network") ||
        message.includes("fetch") ||
        message.includes("connection")
      ) {
        return {
          type: "network",
          message:
            "Network error. Please check your internet connection and try again.",
        };
      }
      if (
        message.includes("school_003") ||
        message.includes("subscription has expired")
      ) {
        return {
          type: "validation",
          message:
            "Your school subscription has expired. Please contact your administrator to renew.",
        };
      }
      if (
        message.includes("school_004") ||
        message.includes("subscription is suspended")
      ) {
        return {
          type: "validation",
          message:
            "Your school subscription is suspended. Please contact support for assistance.",
        };
      }
      if (
        message.includes("school_005") ||
        message.includes("trial period has expired")
      ) {
        return {
          type: "validation",
          message:
            "Your trial period has expired. Please purchase a subscription plan to continue.",
        };
      }
      if (
        message.includes("401") ||
        message.includes("unauthorized") ||
        message.includes("invalid credentials") ||
        message.includes("email") ||
        message.includes("password")
      ) {
        return {
          type: "unauthorized",
          message: "Invalid email or password. Please try again.",
        };
      }
      if (
        message.includes("403") ||
        message.includes("access denied") ||
        message.includes("forbidden")
      ) {
        return {
          type: "validation",
          message: "Access denied. Your account may have been suspended.",
        };
      }
      if (message.includes("500") || message.includes("server")) {
        return {
          type: "server",
          message: "Server error. Please try again later.",
        };
      }
      if (message.includes("timeout")) {
        return {
          type: "network",
          message:
            "Request timed out. Please check your connection and try again.",
        };
      }
      return {
        type: "unknown",
        message: error.message || "Login failed. Please try again.",
      };
    }
    return {
      type: "unknown",
      message: "An unexpected error occurred. Please try again.",
    };
  };

  const onSubmit = async (data: LoginFormData) => {
    setLoginError(null);

    try {
      setLoading(true);
      const user = await login(data);
      showNotification("Welcome back! Login successful.", "success");

      const role = user.role;
      const dashboardMap: Record<string, string> = {
        super_admin: "/super-admin/dashboard",
        school_admin: "/admin/dashboard",
        teacher: "/teacher/dashboard",
        parent: "/parent/dashboard",
        accountant: "/accountant/dashboard",
      };

      navigate(dashboardMap[role] || "/login");
    } catch (error: unknown) {
      const parsedError = parseError(error);
      setLoginError(parsedError);

      if (parsedError.type === "unauthorized") {
        reset({ ...data, password: "" });
      }

      showNotification(parsedError.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setLoginError(null);
    document
      .querySelector("form")
      ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  };

  const getErrorStyles = () => {
    if (!loginError) return "";
    switch (loginError.type) {
      case "network":
        return "border-orange-400 bg-orange-50";
      case "unauthorized":
        return "border-red-400 bg-red-50";
      case "server":
        return "border-red-400 bg-red-50";
      default:
        return "border-red-400 bg-red-50";
    }
  };

  return (
    <div className="flex h-screen w-full bg-white font-body overflow-hidden">
      <AuthSidebar />

      <div className="flex-1 lg:w-[40%] flex flex-col px-8 md:px-16 py-6 overflow-hidden bg-white">
        <div className="flex justify-end mb-12"></div>

        <div className="max-w-[400px] mx-auto w-full flex-1 flex flex-col justify-center">
          <div className="mb-8">
            <h3 className="text-[#133257] text-4xl font-bold mb-2">
              Welcome Back
            </h3>
            <p className="text-[#133257]/50 text-sm leading-relaxed">
              Sign in to your school portal
            </p>
          </div>

          {loginError && (
            <div
              className={`mb-6 p-4 rounded-lg border-2 ${getErrorStyles()} flex items-start gap-3`}
            >
              <span className="material-symbols-outlined text-[#133257] mt-0.5">
                {loginError.type === "network"
                  ? "wifi_off"
                  : loginError.type === "unauthorized"
                    ? "error"
                    : "warning"}
              </span>
              <div className="flex-1">
                <p className="text-sm text-[#133257] font-medium">
                  {loginError.message}
                </p>
                {loginError.type === "network" ||
                loginError.type === "server" ? (
                  <button
                    onClick={handleRetry}
                    disabled={loading}
                    className="mt-2 text-xs font-bold text-[#133257] hover:underline disabled:opacity-50"
                  >
                    Try Again
                  </button>
                ) : null}
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <FormField
              label="Email Address"
              placeholder="Enter your email"
              type="email"
              registration={register("email")}
              error={errors.email}
              icon="alternate_email"
            />

            <div className="space-y-1.5">
              <FormField
                label="Password"
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                registration={register("password")}
                error={errors.password}
                icon="lock_open"
                onToggleEye={() => setShowPassword(!showPassword)}
              />
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#133257]/60 hover:text-[#133257] font-medium"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            {/* <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-[#133257]/30 text-[#133257] focus:ring-[#133257]"
              />
              <label
                htmlFor="remember"
                className="text-xs text-[#133257]/60 font-medium cursor-pointer"
              >
                Remember me
              </label>
            </div> */}

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
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <span className="material-symbols-outlined text-lg">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="mt-auto pt-12 text-center">
            <p className="text-[#133257]/30 text-[10px] font-medium uppercase tracking-wider"></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
