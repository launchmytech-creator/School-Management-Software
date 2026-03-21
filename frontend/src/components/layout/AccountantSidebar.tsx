import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AccountantSidebar: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/accountant/dashboard' },
    { name: 'Fee Collection', icon: 'payments', path: '/accountant/fees' },
    { name: 'Fee Defaulters', icon: 'warning', path: '/accountant/fee-defaulters' },
    { name: 'Students', icon: 'group', path: '/accountant/students' },
    { name: 'Reports', icon: 'analytics', path: '/accountant/reports' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-[240px] bg-primary text-white flex flex-col fixed h-full z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="size-8 bg-accent-sky rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
            school
          </span>
        </div>
        <h1 className="text-xl font-bold tracking-tight font-display">EduManage</h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-button font-medium transition-colors ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-white/10">
        <div className="flex items-center gap-3 px-2">
          <div className="size-10 rounded-full bg-slate-500 overflow-hidden">
            <div className="w-full h-full bg-accent-sky flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {user?.fullName?.charAt(0) || 'A'}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.fullName || 'Accountant'}</p>
            <p className="text-xs text-white/50">School Accountant</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full mt-3 flex items-center gap-3 px-2 py-2 text-white/50 hover:text-white transition-colors text-sm font-medium"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AccountantSidebar;
