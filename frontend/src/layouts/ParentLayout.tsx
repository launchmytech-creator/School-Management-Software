import React from 'react';
import ParentSidebar from '../components/layout/ParentSidebar';
import { useAuth } from '../context/AuthContext';

interface ParentLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const ParentLayout: React.FC<ParentLayoutProps> = ({ children, title = 'Parent Portal' }) => {
  const { user } = useAuth();

  React.useEffect(() => {
    document.title = `${title} | EduManage`;
  }, [title]);

  const displayName = user?.fullName || 'Parent';
  const avatarSeed = String(user?.id || 'parent');

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-body text-slate-800">
      <ParentSidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 flex-shrink-0 z-10">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search records..."
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4A9FD4]/30 focus:border-[#4A9FD4] w-64 transition-all"
            />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-5">
            <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-400 rounded-full border-2 border-white" />
            </button>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-[#1E3A5F] leading-tight">{displayName}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#4A9FD4]">Parent</p>
              </div>
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-100 bg-slate-100 shadow-sm">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ParentLayout;
