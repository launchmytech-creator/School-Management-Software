import React, { useEffect, useState } from 'react';
import type { School, SubscriptionTier } from '../../types/school';

interface SchoolDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (school: School) => void;
  school: School | null;
}

const PLAN_FEATURES: Record<SubscriptionTier, string[]> = {
  BASIC: [
    'Standard Student Records',
    'Basic Fee Tracking',
    'Email Support',
  ],
  PREMIUM: [
    'Advanced Student Records',
    'Online Fee Payments',
    'Custom Reports',
    'Priority Email Support',
  ],
  BUSINESS: [
    'Unlimited Student Records',
    'Advanced Fee Management',
    'Custom Domain & Email',
    'Premium Support 24/7',
  ],
};

const SchoolDetailDrawer: React.FC<SchoolDetailDrawerProps> = ({ isOpen, onClose, onEdit, school }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const timer = setTimeout(() => setAnimate(true), 10);
      return () => clearTimeout(timer);
    } else {
      setAnimate(false);
      const timer = setTimeout(() => setShouldRender(false), 500); // Wait for transition
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender && !isOpen) return null;

  const features = school ? PLAN_FEATURES[school.plan] : [];

  return (
    <div className={`fixed inset-0 z-[100] transition-visibility ${isOpen ? 'visible' : 'invisible'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[2px] transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`absolute right-0 top-0 h-full w-full max-w-[420px] bg-white shadow-2xl transition-transform duration-500 ease-out transform ${animate ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-display font-bold text-[#1E3A5F]">School Details</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {school && (
            <div className="space-y-10">
              {/* Profile Section */}
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 overflow-hidden border border-primary/5 p-1">
                   {school.logo ? (
                     <img src={school.logo} alt={school.name} className="w-full h-full object-cover rounded-xl" />
                   ) : (
                     <div className="w-full h-full rounded-xl bg-[#1E3A5F] flex items-center justify-center text-3xl font-black text-white">
                        {school.name.slice(0, 1).toUpperCase()}
                     </div>
                   )}
                </div>
                <h3 className="text-2xl font-display font-extrabold text-[#1E3A5F] mb-3">{school.name}</h3>
                <span className={`text-[10px] font-black px-4 py-1.5 rounded-full tracking-widest leading-none border uppercase ${
                  school.plan === 'BUSINESS' ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' :
                  school.plan === 'PREMIUM' ? 'bg-[#4A9FD4] text-white border-[#4A9FD4]' :
                  'bg-slate-400 text-white border-slate-400'
                }`}>
                  {school.plan} PLAN
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-y-10">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">School ID</p>
                  <p className="text-sm font-bold text-slate-700">#{school.id.slice(-8).toUpperCase()}</p>
                </div>
                <div className="space-y-1.5 text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Principal</p>
                  <p className="text-sm font-bold text-slate-700">Dr. Elena Gilbert</p>
                </div>
                <div className="col-span-2 space-y-1.5 border-t border-slate-50 pt-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                  <p className="text-sm font-bold text-slate-700">{school.email || 'contact@stxavier-int.edu'}</p>
                </div>
              </div>

              {/* Features Section */}
              <div className="space-y-6 pt-2">
                <div className="flex items-center gap-3">
                   <span className="material-symbols-outlined text-[#4A9FD4] text-xl">verified</span>
                   <p className="text-[11px] font-black text-[#1E3A5F] uppercase tracking-widest">Subscription Features</p>
                </div>
                <div className="space-y-4">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-4 group">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-emerald-100/50">
                        <span className="material-symbols-outlined text-emerald-500 text-sm font-bold">check</span>
                      </div>
                      <span className="text-sm font-medium text-slate-600 tracking-tight">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fee Configuration */}
              <div className="space-y-6 pt-2">
                <p className="text-[11px] font-black text-[#1E3A5F] uppercase tracking-widest">Fee Configuration</p>
                <div className="flex flex-wrap gap-3">
                  {['Term 1', 'Term 2', 'Term 3'].map(term => (
                    <div key={term} className="px-5 py-2.5 rounded-xl border border-[#4A9FD4]/20 bg-[#4A9FD4]/5 text-[#4A9FD4] text-xs font-bold tracking-tight">
                      {term}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-8 pb-10 border-t border-slate-100 bg-slate-50/30 flex gap-4">
          <button 
            onClick={() => school && onEdit(school)}
            className="flex-1 h-12 rounded-xl border-2 border-primary/20 bg-white text-primary font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            Edit School
          </button>
          <button className="flex-1 h-12 rounded-xl bg-[#4A9FD4] text-white font-bold text-sm hover:bg-[#4A9FD4]/90 transition-all shadow-md shadow-primary/20 cursor-pointer">
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchoolDetailDrawer;
