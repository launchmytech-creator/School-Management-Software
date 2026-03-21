import React from 'react';
import TeacherSidebar from '../components/layout/TeacherSidebar';
import AppHeader from '../components/common/AppHeader';

interface TeacherLayoutProps {
  children: React.ReactNode;
  title: string;
}

const TeacherLayout: React.FC<TeacherLayoutProps> = ({ children, title }) => {
  React.useEffect(() => {
    document.title = `${title} | EduManage`;
  }, [title]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-body text-slate-800">
      <TeacherSidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AppHeader customRole="Teacher" />

        <main className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-white shadow-inner">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;
