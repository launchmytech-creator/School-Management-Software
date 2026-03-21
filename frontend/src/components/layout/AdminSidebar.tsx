import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/admin/dashboard' },
    { name: 'Classes', icon: 'school', path: '/admin/classes' },
    { name: 'Students', icon: 'group', path: '/admin/students' },
    { name: 'Student Promotion', icon: 'trending_up', path: '/admin/student-promotion' },
    { name: 'Teachers', icon: 'person', path: '/admin/teachers' },
    { name: 'Teacher Allocation', icon: 'assignment_ind', path: '/admin/teacher-allocation' },
    { name: 'Teacher Attendance', icon: 'event_available', path: '/admin/teacher-attendance' },
    { name: 'Accountants', icon: 'account_balance_wallet', path: '/admin/accountants' },
    { name: 'Parents', icon: 'family_restroom', path: '/admin/parents' },
    // { name: 'Attendance', icon: 'how_to_reg', path: '/admin/attendance' },
    { name: 'Fees', icon: 'payments', path: '/admin/fees' },
    { name: 'Fee Defaulters', icon: 'warning', path: '/admin/fee-defaulters' },
    { name: 'Fee Structures', icon: 'receipt_long', path: '/admin/fee-structures' },
    { name: 'Examinations', icon: 'assignment', path: '/admin/exams' },
    { name: 'Exam Results', icon: 'grade', path: '/admin/exam-results' },
    { name: 'Marks Entry', icon: 'edit_note', path: '/admin/marks-entry' },
    { name: 'Subjects', icon: 'menu_book', path: '/admin/subjects' },
    { name: 'Chapters', icon: 'format_list_numbered', path: '/admin/subjects/1/chapters' },
    { name: 'Class Subjects', icon: 'link', path: '/admin/class-subjects' },
    { name: 'Syllabus Tracking', icon: 'playlist_add_check', path: '/admin/syllabus-tracking' },
    { name: 'Holidays', icon: 'event', path: '/admin/holidays' },
    { name: 'Academic Years', icon: 'calendar_month', path: '/admin/academic-years' },
    { name: 'Announcements', icon: 'campaign', path: '/admin/announcements' },
    { name: 'Timetables', icon: 'schedule', path: '/admin/timetables' },
    // { name: 'Assignments', icon: 'assignment', path: '/admin/assignments' },
    { name: 'Reports', icon: 'analytics', path: '/admin/reports' },
    { name: 'Settings', icon: 'settings', path: '/admin/school-settings' },
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
            school
          </span>
        </div>
        <span className="font-display font-black text-2xl text-white tracking-tight leading-none">EduManage</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
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

export default AdminSidebar;
