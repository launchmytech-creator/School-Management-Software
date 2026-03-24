import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthSidebar from '../../components/auth/AuthSidebar';
import InputField from '../../components/ui/InputField';

const RoleItem: React.FC<{ icon: string; isSelected: boolean; onSelect: () => void }> = ({ icon, isSelected, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 transition-all relative ${
      isSelected ? 'border-accent bg-accent/5' : 'border-slate-100 bg-white hover:border-slate-200'
    }`}
  >
    <span className={`material-symbols-outlined text-xl ${isSelected ? 'text-accent' : 'text-slate-400'}`}
      style={{ fontVariationSettings: isSelected ? "'FILL' 0" : "'FILL' 0" }}
    >
      {icon}
    </span>
    {isSelected && (
      <div className="absolute -top-1.5 -right-1.5 bg-accent text-white rounded-full p-0.5 border-2 border-white">
        <span className="material-symbols-outlined text-[10px] font-bold leading-none">check</span>
      </div>
    )}
  </button>
);

// --- Main Page Component ---

const Register: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState('school');

  return (
    <div className="flex h-screen w-full bg-white font-body overflow-hidden selection:bg-accent/20">
      
      {/* SHARED SIDEBAR */}
      <AuthSidebar />

      {/* RIGHT CONTENT */}
      <div className="flex-1 lg:w-[40%] flex flex-col px-8 md:px-16 py-6 overflow-hidden">
        {/* Header Link */}
        <div className="flex justify-end mb-8">
          <p className="text-slate-400 text-xs">
            Already have an account? 
            <Link to="/login" className="text-accent font-bold ml-1 hover:underline">Sign In</Link>
          </p>
        </div>

        {/* Form Area */}
        <div className="max-w-[400px] mx-auto w-full flex-1 flex flex-col justify-center">
          <h3 className="text-slate-900 text-3xl font-display font-bold mb-1 flex items-center gap-2">
            Create Your Account 👋
          </h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Register to join your school portal. Your role will be detected automatically.
          </p>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 tracking-tight">I am a...</label>
              <div className="flex gap-2">
                {[
                  { id: 'super', icon: 'security' },
                  { id: 'school', icon: 'apartment' },
                  { id: 'account', icon: 'description' },
                  { id: 'teacher', icon: 'menu_book' },
                  { id: 'parent', icon: 'family_restroom' }
                ].map((role) => (
                  <RoleItem 
                    key={role.id} 
                    icon={role.icon} 
                    isSelected={selectedRole === role.id} 
                    onSelect={() => setSelectedRole(role.id)} 
                  />
                ))}
              </div>
            </div>

            <InputField label="Full Name" placeholder="Alexander Hamilton" />
            <InputField label="Email Address" placeholder="example@edumanage.com" type="email" icon="alternate_email" />
            <InputField label="School ID" placeholder="SCH-2024-X" icon="badge" />
            <InputField label="Password" placeholder="••••••••" type="password" icon="lock_open" />

            <div className="flex items-center gap-2 py-1">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-200 text-accent focus:ring-accent transition-all cursor-pointer" id="terms" />
              <label htmlFor="terms" className="text-[10px] text-slate-500 cursor-pointer select-none leading-none">
                I agree to the <Link to="/terms" className="text-accent font-bold hover:underline">Terms</Link> and <Link to="/privacy" className="text-accent font-bold hover:underline">Privacy</Link>.
              </label>
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-accent hover:bg-accent/90 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-accent/25 transition-all transform active:scale-[0.98]"
            >
              Get Started
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>

            {/* Hint Box (smaller) */}
            {/* <div className="p-3 bg-accent/5 border border-accent/10 rounded-xl flex gap-3">
              <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-xs">info</span>
              </div>
              <p className="text-slate-600 text-[10px] leading-relaxed font-medium">
                Registering as <span className="text-accent font-bold uppercase">{selectedRole} Admin</span>. You'll have access to 
                your school's management panel.
              </p>
            </div> */}
          </form>

          {/* Copyright */}
          {/* <div className="mt-8 text-center">
            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">
              © 2024 EDUMANAGE SMS. ALL RIGHTS RESERVED.
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Register;