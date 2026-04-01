import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { name: "Dashboard", icon: "dashboard", path: "/accountant/dashboard" },
  { name: "Fee Collection", icon: "payments", path: "/accountant/fees" },
  {
    name: "Fee Defaulters",
    icon: "warning",
    path: "/accountant/fee-defaulters",
  },
  { name: "Students", icon: "group", path: "/accountant/students" },
  { name: "Add Student", icon: "person_add", path: "/accountant/add-student" },
  { name: "Attendance", icon: "how_to_reg", path: "/accountant/attendance" },
  {
    name: "Exams",
    icon: "assignment",
    path: "/accountant/exams",
  },
  {
    name: "Marks Entry",
    icon: "edit_note",
    path: "/accountant/marks-entry",
  },
  {
    name: "Exam Results",
    icon: "grade",
    path: "/accountant/exam-results",
  },
  {
    name: "Fee Structures",
    icon: "receipt_long",
    path: "/accountant/fee-structures",
  },
  {
    name: "Announcements",
    icon: "campaign",
    path: "/accountant/announcements",
  },
];

const AccountantSidebar: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-[240px] bg-[#1E3A5F] text-white flex flex-col fixed h-full z-20 shadow-2xl">
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

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[#2C4A70] text-white shadow-sm"
                  : "text-white/70 hover:bg-white/5 hover:text-white/90"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`material-symbols-outlined text-[18px] transition-colors ${
                    isActive ? "text-[#4A9FD4]" : ""
                  }`}
                  style={{
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {item.icon}
                </span>
                <span className="font-semibold text-[13px] tracking-tight">
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
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
    </aside>
  );
};

export default AccountantSidebar;
