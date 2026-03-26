import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TeacherSidebar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/teacher/dashboard' },
    { name: 'My Classes', icon: 'school', path: '/teacher/my-classes' },
    { name: 'Mark Attendance', icon: 'how_to_reg', path: '/teacher/attendance' },
    { name: 'My Students', icon: 'group', path: '/teacher/students' },
    { name: 'Syllabus Progress', icon: 'playlist_add_check', path: '/teacher/syllabus' },
    { name: 'Announcements', icon: 'campaign', path: '/teacher/announcements' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-72 bg-[#1E3A5F] h-screen flex flex-col text-white/60 relative z-20 shadow-2xl overflow-hidden font-body flex-shrink-0">
      <div className="p-8 pt-10 flex items-center gap-4">
        <div className="w-11 h-11 bg-[#4A9FD4] rounded-xl flex items-center justify-center shadow-lg shadow-[#4A9FD4]/20">
          <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            school
          </span>
        </div>
        <span className="font-display font-black text-2xl text-white tracking-tight leading-none">EduManage</span>
      </div>

      <div className="px-4 py-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-4">Teacher Menu</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-200 group relative ${
                isActive 
                ? 'bg-[#2C4A70] text-white active shadow-sm' 
                : 'hover:bg-white/5 hover:text-white/80'
              }`
            }
          >
            <span className="material-symbols-outlined text-xl transition-colors">
              {item.icon}
            </span>
            <span className="font-bold text-[14px] tracking-tight">{item.name}</span>
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

export default TeacherSidebar;
