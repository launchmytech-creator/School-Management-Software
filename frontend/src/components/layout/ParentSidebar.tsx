import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  name: string;
  icon: string;
  path: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard',  icon: 'dashboard',      path: '/parent/dashboard'   },
  { name: 'Attendance', icon: 'event_available', path: '/parent/attendance'  },
  { name: 'Syllabus',   icon: 'auto_stories',    path: '/parent/syllabus'   },
  { name: 'Fees',       icon: 'payments',        path: '/parent/fees'        },
];

const ParentSidebar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-56 bg-[#1E3A5F] h-screen flex flex-col text-white/60 relative z-20 shadow-2xl flex-shrink-0">
      {/* Brand */}
      <div className="p-5 pt-7 flex items-center gap-3 border-b border-white/5">
        <div className="w-9 h-9 bg-[#4A9FD4] rounded-xl flex items-center justify-center shadow-lg shadow-[#4A9FD4]/20 flex-shrink-0">
          <span
            className="material-symbols-outlined text-white text-lg"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            school
          </span>
        </div>
        <div className="leading-none">
          <p className="font-black text-sm text-white tracking-tight">ST. XAVIER'S</p>
          <p className="text-[10px] text-white/40 font-semibold tracking-widest uppercase">Management</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 group ${
                isActive
                  ? 'bg-[#2C4A70] text-white'
                  : 'hover:bg-white/5 hover:text-white/80'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`material-symbols-outlined text-[20px] ${isActive ? 'text-[#4A9FD4]' : ''}`}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span className={`text-[13px] font-semibold tracking-tight ${isActive ? 'text-white' : ''}`}>
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Contact Support */}
      <div className="p-4 border-t border-white/5 space-y-3">
        <button className="w-full flex items-center justify-center gap-2 bg-[#4A9FD4] hover:bg-[#3a8fc4] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors">
          <span className="material-symbols-outlined text-[16px]">support_agent</span>
          Contact Support
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-all text-xs font-bold tracking-tight w-full px-2"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Logout
        </button>
      </div>
    </div>
  );
};

export default ParentSidebar;
