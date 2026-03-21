import React from 'react';

const AuthSidebar: React.FC = () => {
  return (
    <div className="hidden lg:flex w-[60%] bg-primary relative flex-col justify-between p-10 overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2 z-10">
        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20">
          <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            diamond
          </span>
        </div>
        <h1 className="text-white text-xl font-display font-bold tracking-tight">EduManage SMS</h1>
      </div>

      {/* Center Content */}
      <div className="flex flex-col items-center text-center z-10">
        <div className="relative mb-8 scale-90">
          {/* Outline Building Illustration */}
          <div className="w-64 h-40 border-2 border-white/20 rounded-t-2xl relative flex items-center justify-center">
            <div className="w-10 h-16 border-2 border-white/30 rounded-t-full absolute bottom-0 left-10"></div>
            <div className="w-14 h-24 border-2 border-accent/40 rounded-t-full absolute bottom-0"></div>
            <div className="w-10 h-16 border-2 border-white/30 rounded-t-full absolute bottom-0 right-10"></div>
          </div>
        </div>
        <h2 className="text-white text-3xl font-display font-bold mb-3">Manage Your School Smarter</h2>
        <p className="text-white/60 text-base max-w-sm leading-relaxed">
          A complete digital platform for students, teachers, parents and administrators.
        </p>
      </div>

      {/* Bottom Pills */}
      <div className="flex flex-col items-center gap-3 z-10">
        <div className="flex flex-wrap justify-center gap-2">
          {['Super Admin', 'Admin', 'Accountant', 'Teacher', 'Parent'].map((role) => (
            <span key={role} className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/70 text-[10px] font-medium backdrop-blur-sm">
              {role}
            </span>
          ))}
        </div>
        <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold">Role-based access for everyone</p>
      </div>

      {/* Abstract shapes for background */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none"></div>
    </div>
  );
};

export default AuthSidebar;
