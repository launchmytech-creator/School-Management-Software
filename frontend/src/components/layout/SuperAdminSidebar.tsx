import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SuperAdminSidebar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', icon: 'grid_view', path: '/super-admin/dashboard' },
    { name: 'Schools', icon: 'school', path: '/super-admin/schools' },
    { name: 'Create School', icon: 'add_business', path: '/super-admin/create-school' },
    // { name: 'Settings', icon: 'settings', path: '/super-admin/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-72 bg-[#1E3A5F] h-screen flex flex-col text-white/60 relative z-20 shadow-2xl overflow-hidden font-body flex-shrink-0">
      {/* Brand Section */}
      <div className="p-8 pt-10 flex items-center gap-4">
        <div className="w-11 h-11 bg-[#4A9FD4] rounded-xl flex items-center justify-center shadow-lg shadow-[#4A9FD4]/20">
          <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            admin_panel_settings
          </span>
        </div>
        <span className="font-display font-black text-2xl text-white tracking-tight leading-none">EduManage</span>
      </div>

      <nav className="flex-1 px-4 py-12 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-6 py-3.5 rounded-xl transition-all duration-200 group relative ${
                isActive 
                ? 'bg-[#2C4A70] text-white active shadow-sm' 
                : 'hover:bg-white/5 hover:text-white/80'
              }`
            }
          >
            <span className={`material-symbols-outlined text-xl transition-colors ${item.name === 'Dashboard' ? 'group-[.active]:fill-1' : ''}`}>
              {item.icon}
            </span>
            <span className="font-bold text-[15px] tracking-tight">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-8 pb-10 border-t border-white/5">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 text-white/40 hover:text-white transition-all group font-bold text-sm tracking-tight w-full px-2"
        >
          <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default SuperAdminSidebar;
