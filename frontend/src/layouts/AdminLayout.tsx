import React from "react";
import { useLocation } from "react-router-dom";
import AdminSidebar from "../components/layout/AdminSidebar";
import SuperAdminSidebar from "../components/layout/SuperAdminSidebar";
import ParentSidebar from "../components/layout/ParentSidebar";
import AppHeader from "../components/common/AppHeader";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const location = useLocation();

  React.useEffect(() => {
    document.title = `${title} | EduManage`;
  }, [title]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-body text-slate-800">
      {location.pathname.startsWith("/super-admin") ? (
        <SuperAdminSidebar />
      ) : location.pathname.startsWith("/admin") ? (
        <AdminSidebar />
      ) : (
        <AdminSidebar />
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AppHeader />

        <main className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-white shadow-inner">
          <div className="max-w-[1400px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
