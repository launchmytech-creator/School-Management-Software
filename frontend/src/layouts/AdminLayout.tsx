import React from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from '../components/layout/AdminSidebar';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import { useAuth } from '../context/AuthContext';
import AcademicYearPill from '../components/academicYear/AcademicYearPill';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const { user } = useAuth();
  const location = useLocation();

  React.useEffect(() => {
    document.title = `${title} | EduManage`;
  }, [title]);

  const displayName = user?.fullName || 'User';
  const displayRole = user?.role?.replace('_', ' ') || 'Admin';
  const avatarSeed = typeof user?.id === 'string' ? user.id : String(user?.id || 'default');

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-body text-slate-800">
      {/* Dynamic Sidebar based on route then role */}
      {location.pathname.startsWith('/super-admin') ? (
        <SuperAdminSidebar />
      ) : location.pathname.startsWith('/admin') ? (
        <AdminSidebar />
      ) : user?.role === 'super_admin' ? (
        <SuperAdminSidebar />
      ) : (
        <AdminSidebar />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header - Matches image precisely */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-12 flex-shrink-0 z-10 w-full">
          {/* Academic Year Selection */}
          <AcademicYearPill />
          
          <div className="flex items-center gap-8">
            <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
              <span className="material-symbols-outlined text-2xl">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-400 rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center gap-4">
              <div className="text-right flex flex-col items-end">
                <span className="text-sm font-bold text-[#1E3A5F]">{displayName}</span>
                <span className="bg-[#F1F5F9] text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight">{displayRole}</span>
              </div>
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-100 bg-slate-100 shadow-sm">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-white shadow-inner">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
export default AdminLayout;
