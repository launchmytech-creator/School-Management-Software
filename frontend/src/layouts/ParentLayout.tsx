/** Parent Layout
 * 
 * Layout wrapper for all parent pages.
 * Includes sidebar navigation and header with child selector dropdown.
 * Shows child's name, class, and section in header.
 */
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ParentSidebar from '../components/layout/ParentSidebar';
import { useAuth } from '../context/AuthContext';
import { useSelectedChild } from '../context/SelectedChildContext';
import { useParentChildren } from '../hooks/queries';
import RouteErrorBoundary from '../components/error/RouteErrorBoundary';

const ROUTE_TITLES: Record<string, string> = {
  "/parent/dashboard": "Dashboard",
  "/parent/attendance": "Attendance",
  "/parent/syllabus": "Syllabus",
  "/parent/fees": "Fee Status",
  "/parent/exam-results": "Exam Results",
};

interface ParentLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const ParentLayout: React.FC<ParentLayoutProps> = ({ children, title }) => {
  const { user } = useAuth();
  const location = useLocation();
  const { selectedChildId, setSelectedChildId } = useSelectedChild();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: childrenData } = useParentChildren(Number(user?.id));
  const childrenList = childrenData || [];

  const selectedChild = childrenList.find(c => c.id === selectedChildId) || childrenList[0];

  useEffect(() => {
    const pageTitle = title || ROUTE_TITLES[location.pathname] || 'Parent Portal';
    document.title = `${pageTitle} | EduManage`;
  }, [location.pathname, title]);

  useEffect(() => {
    if (childrenList.length > 0 && !selectedChildId) {
      setSelectedChildId(childrenList[0].id);
    }
  }, [childrenList, selectedChildId, setSelectedChildId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownOpen && !(e.target as Element).closest('.relative')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]);

  const displayName = user?.fullName || 'Parent';
  const avatarSeed = String(user?.id || 'parent');

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-body text-slate-800">
      <ParentSidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 flex-shrink-0 z-10">
          {/* Child Selector */}
          {childrenList.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-[#4A9FD4]">account_circle</span>
                <span className="font-semibold text-slate-700">{selectedChild?.fullName?.split(' ')[0] || 'Select'}</span>
                <span className="material-symbols-outlined text-[16px] text-slate-400">
                  {dropdownOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                  {childrenList.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => {
                        setSelectedChildId(child.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                        selectedChildId === child.id ? 'bg-slate-50 text-[#4A9FD4]' : 'text-slate-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">account_circle</span>
                      <div className="text-left">
                        <p className="font-medium">{child.fullName}</p>
                        <p className="text-[10px] text-slate-400">{child.className}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

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
        <main className="flex-1 overflow-y-auto p-12 bg-[#F8FAFC] custom-scrollbar">
          <RouteErrorBoundary>{children}</RouteErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default ParentLayout;
