import React from 'react';
import { useAuth } from '../../context/AuthContext';
import type { AuthUser } from '../../types/auth';

interface AppHeaderProps {
  user?: AuthUser | null;
  showYearPill?: boolean;
  customRole?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ user: propUser, showYearPill = true, customRole }) => {
  const { user: contextUser } = useAuth();
  const user = propUser || contextUser;

  const displayName = user?.fullName || 'User';
  const displayRole = customRole || user?.role?.replace('_', ' ') || 'User';
  const avatarSeed = typeof user?.id === 'string' ? user.id : String(user?.id || 'default');

  return (
    <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-12 flex-shrink-0 z-10 w-full">
      {showYearPill && (
        <div />
      )}
      
      <div className="flex items-center gap-8">
        <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
          <span className="material-symbols-outlined text-2xl">notifications</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-400 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-4">
          <div className="text-right flex flex-col items-end">
            <span className="text-sm font-bold text-[#1E3A5F]">{displayName}</span>
            <span className="bg-[#F1F5F9] text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight">
              {displayRole}
            </span>
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
  );
};

export default AppHeader;
