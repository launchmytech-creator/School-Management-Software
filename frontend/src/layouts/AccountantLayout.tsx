import React from 'react';
import { useLocation } from 'react-router-dom';
import AccountantSidebar from '../components/layout/AccountantSidebar';
import { useAuth } from '../context/AuthContext';

interface AccountantLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AccountantLayout: React.FC<AccountantLayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const { user } = useAuth();

  const getPageTitle = () => {
    if (title) return title;
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('fees')) return 'Fee Collection';
    if (path.includes('fee-defaulters')) return 'Fee Defaulters';
    if (path.includes('students')) return 'Students';
    if (path.includes('fee-structures')) return 'Fee Structures';
    if (path.includes('reports')) return 'Reports';
    return 'Accountant Portal';
  };

  return (
    <div className="flex min-h-screen bg-background-light">
      <AccountantSidebar />
      
      <main className="flex-1 ml-[240px]">
        <header className="h-[64px] bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-primary font-display">{getPageTitle()}</h2>
          
          <div className="flex items-center gap-6">
            <button className="relative text-slate-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute -top-1 -right-1 size-2 bg-accent-orange rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-3">
              <span className="bg-teal-50 text-accent-teal text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-teal-100">
                Accountant
              </span>
              <div className="size-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                <div className="w-full h-full bg-accent-sky flex items-center justify-center">
                  <span className="text-white font-bold">
                    {user?.fullName?.charAt(0) || 'A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1440px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AccountantLayout;
