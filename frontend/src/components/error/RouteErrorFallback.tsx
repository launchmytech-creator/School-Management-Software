import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { ErrorFallbackProps } from "./ErrorBoundary";

const RouteErrorFallback: React.FC<ErrorFallbackProps> = ({ resetErrorBoundary }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoToDashboard = () => {
    let path = "/admin/dashboard";
    if (user?.role === "teacher") path = "/teacher/dashboard";
    else if (user?.role === "parent") path = "/parent/dashboard";
    else if (user?.role === "accountant") path = "/accountant/dashboard";
    else if (user?.role === "super_admin") path = "/super-admin/dashboard";
    navigate(path);
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-premium p-10 max-w-md w-full text-center space-y-5">
        <div className="mx-auto w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-amber-500">warning</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-display font-black text-[#1E3A5F] tracking-tight">
            This page crashed
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            An error occurred while loading this page. The rest of the application is still working fine.
          </p>
        </div>

        {import.meta.env.DEV && (
          <div className="bg-slate-50 rounded-xl p-3 text-left overflow-auto max-h-24 text-xs font-mono text-slate-500 border border-slate-100">
            <p className="truncate text-slate-600">Check console for error details</p>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={resetErrorBoundary}
            className="h-12 px-8 rounded-xl bg-[#4A9FD4] text-white font-black text-xs uppercase tracking-widest shadow-md shadow-blue-200/50 hover:bg-[#4A9FD4]/95 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Try Again
          </button>
          <button
            onClick={handleGoToDashboard}
            className="h-12 px-8 rounded-xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteErrorFallback;
