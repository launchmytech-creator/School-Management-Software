import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  name: string;
  icon: string;
  path: string;
}

interface NavGroup {
  label: string;
  icon: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    icon: 'grid_view',
    items: [
      { name: 'Dashboard', icon: 'dashboard', path: '/admin/dashboard' },
    ],
  },
  {
    label: 'People',
    icon: 'groups',
    items: [
      { name: 'Students', icon: 'group', path: '/admin/students' },
      { name: 'Student Promotion', icon: 'trending_up', path: '/admin/student-promotion' },
      { name: 'Teachers', icon: 'person', path: '/admin/teachers' },
      { name: 'Teacher Allocation', icon: 'assignment_ind', path: '/admin/teacher-allocation' },
      { name: 'Teacher Attendance', icon: 'event_available', path: '/admin/teacher-attendance' },
      { name: 'Accountants', icon: 'account_balance_wallet', path: '/admin/accountants' },
      { name: 'Parents', icon: 'family_restroom', path: '/admin/parents' },
    ],
  },
  {
    label: 'Academics',
    icon: 'menu_book',
    items: [
      { name: 'Classes', icon: 'school', path: '/admin/classes' },
      { name: 'Syllabus Tracking', icon: 'playlist_add_check', path: '/admin/syllabus-tracking' },
    ],
  },
  {
    label: 'Exams & Results',
    icon: 'assignment',
    items: [
      { name: 'Examinations', icon: 'assignment', path: '/admin/exams' },
      { name: 'Class Comparison', icon: 'compare_arrows', path: '/admin/class-comparison' },
    ],
  },
  {
    label: 'Finance',
    icon: 'payments',
    items: [
      { name: 'Fees', icon: 'payments', path: '/admin/fees' },
      { name: 'Fee Structures', icon: 'receipt_long', path: '/admin/fee-structures' },
      { name: 'Fee Defaulters', icon: 'warning', path: '/admin/fee-defaulters' },
    ],
  },
  {
    label: 'Schedule & Comms',
    icon: 'schedule',
    items: [
      { name: 'Holidays', icon: 'event', path: '/admin/holidays' },
      { name: 'Academic Years', icon: 'calendar_month', path: '/admin/academic-years' },
      { name: 'Announcements', icon: 'campaign', path: '/admin/announcements' },
      { name: 'Student Records', icon: 'history', path: '/admin/student-history' },
    ],
  },
  {
    label: 'Settings',
    icon: 'settings',
    items: [
      { name: 'Plans', icon: 'credit_card', path: '/admin/profile' },
      { name: 'School Settings', icon: 'settings', path: '/admin/school-settings' },
    ],
  },
];

const AdminSidebar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine which group is active based on current path
  const activeGroupIndex = navGroups.findIndex((g) =>
    g.items.some((item) => location.pathname.startsWith(item.path))
  );

  const [openGroup, setOpenGroup] = useState<number>(activeGroupIndex >= 0 ? activeGroupIndex : 0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleGroup = (index: number) => {
    setOpenGroup((prev) => (prev === index ? -1 : index));
  };

  return (
    <div className="w-72 bg-[#1E3A5F] h-screen flex flex-col text-white/60 relative z-20 shadow-2xl overflow-hidden font-body flex-shrink-0">
      {/* Brand */}
      <div className="p-6 pt-8 flex items-center gap-4 border-b border-white/5">
        <div className="w-10 h-10 bg-[#4A9FD4] rounded-xl flex items-center justify-center shadow-lg shadow-[#4A9FD4]/20 flex-shrink-0">
          <span
            className="material-symbols-outlined text-white text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            school
          </span>
        </div>
        <span className="font-display font-black text-xl text-white tracking-tight leading-none">
          EduManage
        </span>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar space-y-1">
        {navGroups.map((group, groupIndex) => {
          const isOpen = openGroup === groupIndex;
          const isGroupActive = group.items.some((item) =>
            location.pathname.startsWith(item.path)
          );

          return (
            <div key={group.label}>
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(groupIndex)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group
                  ${isGroupActive ? 'text-white bg-white/5' : 'hover:bg-white/5 hover:text-white/80'}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-[18px] transition-colors ${
                      isGroupActive ? 'text-[#4A9FD4]' : ''
                    }`}
                    style={{ fontVariationSettings: isGroupActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {group.icon}
                  </span>
                  <span
                    className={`text-[13px] font-bold tracking-wide uppercase ${
                      isGroupActive ? 'text-white' : 'text-white/50'
                    }`}
                  >
                    {group.label}
                  </span>
                </div>
                <span
                  className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>

              {/* Group Items */}
              {isOpen && (
                <div className="mt-1 ml-3 pl-3 border-l border-white/10 space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-150 group ${
                          isActive
                            ? 'bg-[#2C4A70] text-white shadow-sm'
                            : 'hover:bg-white/5 hover:text-white/80'
                        }`
                      }
                    >
                      <span className="material-symbols-outlined text-[18px] transition-colors">
                        {item.icon}
                      </span>
                      <span className="font-semibold text-[13px] tracking-tight">{item.name}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-6 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-white/40 hover:text-white transition-all group font-bold text-sm tracking-tight w-full px-2"
        >
          <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
            logout
          </span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
