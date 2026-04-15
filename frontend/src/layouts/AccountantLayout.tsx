import React from "react";
import { useLocation } from "react-router-dom";
import AccountantSidebar from "../components/layout/AccountantSidebar";
import { useAuth } from "../context/AuthContext";
import RouteErrorBoundary from "../components/error/RouteErrorBoundary";

interface AccountantLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const AccountantLayout: React.FC<AccountantLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  const location = useLocation();
  const { user } = useAuth();

  const getPageTitle = () => {
    if (title) return title;
    const path = location.pathname;
    if (path.includes("dashboard")) return "Dashboard";
    if (path.includes("fees")) return "Fee Collection";
    if (path.includes("fee-defaulters")) return "Fee Defaulters";
    if (path.includes("students")) return "Students";
    if (path.includes("fee-structures")) return "Fee Structures";
    if (path.includes("reports")) return "Reports";
    return "Accountant Portal";
  };

  return (
    <div className="flex min-h-screen bg-background-light">
      <AccountantSidebar />

      <main className="flex-1 ml-[240px]">
        <header className="h-[64px] bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-primary font-display">
              {getPageTitle()}
            </h2>
            {subtitle && (
              <p className="text-sm text-slate-500 font-normal mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-slate-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute -top-1 -right-1 size-2 bg-blue-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <p className="text-sm font-semibold text-slate-800">
                  {user?.fullName || "Accountant"}
                </p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200/50 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                  School Accountant
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full blur-sm opacity-30"></div>
                <div className="relative size-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg ring-2 ring-white">
                  <span className="text-white font-bold text-sm">
                    {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1440px] mx-auto">
          <RouteErrorBoundary>{children}</RouteErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default AccountantLayout;
