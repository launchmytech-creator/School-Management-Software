import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import TeacherSidebar from '../components/layout/TeacherSidebar';
import AppHeader from '../components/common/AppHeader';
import RouteErrorBoundary from '../components/error/RouteErrorBoundary';

const ROUTE_TITLES: Record<string, string> = {
  "/teacher/dashboard": "Dashboard",
  "/teacher/my-classes": "My Classes",
  "/teacher/attendance": "Attendance",
  "/teacher/syllabus": "Syllabus",
  "/teacher/announcements": "Announcements",
};

interface TeacherLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const TeacherLayout: React.FC<TeacherLayoutProps> = ({ children, title }) => {
  const location = useLocation();

  useEffect(() => {
    const pageTitle = title || ROUTE_TITLES[location.pathname] || "Teacher Portal";
    document.title = `${pageTitle} | EduManage`;
  }, [location.pathname, title]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-body text-slate-800">
      <TeacherSidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AppHeader customRole="Teacher" />

        <main className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-white shadow-inner">
          <div className="max-w-[1400px] mx-auto">
            <RouteErrorBoundary>{children}</RouteErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;
