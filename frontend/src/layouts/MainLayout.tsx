import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useStudentCache } from "../hooks/useStudentCache";
import RouteErrorBoundary from "../components/error/RouteErrorBoundary";
import AppHeader from "../components/common/AppHeader";
import AdminSidebar from "../components/layout/AdminSidebar";
import SuperAdminSidebar from "../components/layout/SuperAdminSidebar";
import TeacherSidebar from "../components/layout/TeacherSidebar";
import AccountantSidebar from "../components/layout/AccountantSidebar";
import ParentSidebar from "../components/layout/ParentSidebar";
import { useAuth } from "../context/AuthContext";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const SIDEBAR_MAP: Record<string, React.ComponentType> = {
  school_admin: AdminSidebar,
  super_admin: SuperAdminSidebar,
  teacher: TeacherSidebar,
  accountant: AccountantSidebar,
  parent: ParentSidebar,
};

const HEADER_ROLES: Record<string, string> = {
  teacher: "Teacher",
  accountant: "Accountant",
  parent: "Parent",
};

const MainLayout: React.FC<MainLayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  useStudentCache();

  React.useEffect(() => {
    if (title) {
      document.title = `${title} | EduManage`;
    }
  }, [title]);

  // Get sidebar and header based on USER ROLE from AuthContext
  const userRole = user?.role ?? "school_admin";
  const SidebarComponent = SIDEBAR_MAP[userRole] ?? AdminSidebar;
  const headerRole = HEADER_ROLES[userRole];

  const trialDaysRemaining = useMemo(() => {
    if (user?.subscriptionStatus !== 'trial' || !user.schoolId) return 0;
    const now = new Date();
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 1);
    return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [user?.subscriptionStatus, user?.schoolId]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-body text-slate-800">
      <SidebarComponent />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {user?.subscriptionStatus === 'trial' && trialDaysRemaining > 0 && (
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-blue-500 text-xl">info</span>
              <p className="text-sm font-medium text-blue-700">
                Trial period: <span className="font-bold">{trialDaysRemaining} days</span> remaining. 
                Upgrade to a paid plan for full access.
              </p>
            </div>
            <a
              href="/admin/profile"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
            >
              View Plans
            </a>
          </div>
        )}
        <AppHeader customRole={headerRole} />

        <main className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-white shadow-inner">
          <div className="max-w-[1400px] mx-auto">
            <RouteErrorBoundary>{children}</RouteErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;