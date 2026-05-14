import React from 'react';

const AuthSidebar: React.FC = () => {
  return (
    <div className="hidden lg:flex w-[60%] bg-[#133257] relative flex-col justify-between p-10 overflow-hidden">
      {/* Abstract shapes for background */}
      <div className="absolute top-[-20%] right-[-15%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-15%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Logo */}
      <div className="flex items-center gap-3 z-10">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-[#133257] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            school
          </span>
        </div>
        <h1 className="text-white text-xl font-bold tracking-tight">EduManage</h1>
      </div>

      {/* Center Content */}
      <div className="flex flex-col items-center text-center z-10">
        <div className="relative mb-8 scale-90">
          {/* Building Illustration */}
          <div className="relative">
            <svg width="280" height="160" viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Main Building */}
              <rect x="60" y="60" width="160" height="80" rx="4" stroke="white" strokeWidth="2" fill="none"/>
              
              {/* Windows Row 1 */}
              <rect x="75" y="75" width="20" height="20" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.1"/>
              <rect x="105" y="75" width="20" height="20" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.1"/>
              <rect x="135" y="75" width="20" height="20" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.1"/>
              <rect x="165" y="75" width="20" height="20" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.1"/>
              <rect x="195" y="75" width="20" height="20" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.1"/>
              
              {/* Windows Row 2 */}
              <rect x="75" y="105" width="20" height="20" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.1"/>
              <rect x="105" y="105" width="20" height="20" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.1"/>
              <rect x="135" y="105" width="20" height="20" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.1"/>
              <rect x="165" y="105" width="20" height="20" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.1"/>
              <rect x="195" y="105" width="20" height="20" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.1"/>
              
              {/* Door */}
              <rect x="120" y="115" width="40" height="25" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.05"/>
              
              {/* Flag Pole */}
              <line x1="140" y1="30" x2="140" y2="60" stroke="white" strokeWidth="2"/>
              <path d="M140 30 L175 42 L140 55 Z" fill="white" fillOpacity="0.8"/>
              
              {/* Ground Line */}
              <line x1="20" y1="140" x2="260" y2="140" stroke="white" strokeWidth="2"/>
              
              {/* Trees */}
              <circle cx="30" cy="125" r="15" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.1"/>
              <line x1="30" y1="140" x2="30" y2="125" stroke="white" strokeWidth="1.5"/>
              
              <circle cx="250" cy="125" r="15" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.1"/>
              <line x1="250" y1="140" x2="250" y2="125" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
        </div>
        <h2 className="text-white text-3xl font-bold mb-3">Manage Your School Smarter</h2>
        <p className="text-white/70 text-base max-w-sm leading-relaxed">
          A complete digital platform for students, teachers, parents and administrators.
        </p>
      </div>

      {/* Bottom Pills */}
      <div className="flex flex-col items-center gap-3 z-10">
        <div className="flex flex-wrap justify-center gap-2">
          {['Super Admin', 'Admin', 'Accountant', 'Teacher', 'Parent'].map((role) => (
            <span key={role} className="px-4 py-1.5 rounded-full border border-white/20 bg-white/10 text-white/90 text-xs font-medium">
              {role}
            </span>
          ))}
        </div>
        <p className="text-white/40 text-[9px] uppercase tracking-widest font-bold">Role-based access for everyone</p>
      </div>
    </div>
  );
};

export default AuthSidebar;
