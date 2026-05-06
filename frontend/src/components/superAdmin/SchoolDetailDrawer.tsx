import React, { useEffect, useState } from "react";
import type { School } from "../../types/school";
import { PLAN_FEATURE_COMPARISON } from "../../lib/permissions";

interface SchoolDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (school: School) => void;
  school: School | null;
}

const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  fee_management: 'Fee Management',
  marks_management: 'Marks Management',
  attendance: 'Attendance Tracking',
  syllabus_tracking: 'Syllabus Tracking',
  teacher_allocation: 'Teacher Allocation',
  analytics: 'Academic Analytics',
};

const SchoolDetailDrawer: React.FC<SchoolDetailDrawerProps> = ({
  isOpen,
  onClose,
  onEdit,
  school,
}) => {
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

  return (
    <div
      className={`fixed inset-0 z-[100] transition-visibility ${isOpen ? "visible" : "invisible"}`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[2px] transition-opacity duration-300 ${animate ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-[420px] bg-white shadow-2xl transition-transform duration-500 ease-out transform ${animate ? "translate-x-0" : "translate-x-full"} flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-display font-bold text-[#1E3A5F]">
            School Details
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-slate-400">
              close
            </span>
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
                    <img
                      src={school.logo}
                      alt={school.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-[#1E3A5F] flex items-center justify-center text-3xl font-black text-white">
                      {school.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-display font-extrabold text-[#1E3A5F] mb-3">
                  {school.name}
                </h3>
                <span
                  className={`text-[10px] font-black px-4 py-1.5 rounded-full tracking-widest leading-none border uppercase ${
                    school.plan === "BUSINESS"
                      ? "bg-[#1E3A5F] text-white border-[#1E3A5F]"
                      : school.plan === "PREMIUM"
                        ? "bg-[#4A9FD4] text-white border-[#4A9FD4]"
                        : "bg-slate-400 text-white border-slate-400"
                  }`}
                >
                  {school.plan} PLAN
                </span>
                <span
                  className={`mt-2 text-[9px] font-black px-3 py-1 rounded-md tracking-wider uppercase ${
                    school.subscriptionStatus === 'trial'
                      ? 'bg-blue-100 text-blue-700'
                      : school.subscriptionStatus === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : school.subscriptionStatus === 'suspended'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {school.subscriptionStatus}
                </span>
              </div>

              {/* Info Grid */}
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-y-8">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      School ID
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      #{school.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Email
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {school.email || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Students
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {school.studentCount || 0}
                    </p>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Teachers
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {school.teacherCount || 0}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Phone
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {school.phone || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Fee Term
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {school.feeTerm || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Address - Full Width */}
                <div className="space-y-1.5 border-t border-slate-100 pt-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Address
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {school.address || "N/A"}
                  </p>
                </div>
              </div>

              {/* Features Section */}
              <div className="space-y-6 pt-2">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#4A9FD4] text-xl">
                    verified
                  </span>
                  <p className="text-[11px] font-black text-[#1E3A5F] uppercase tracking-widest">
                    Subscription Features
                  </p>
                </div>
                <div className="space-y-3">
                  {Object.entries(PLAN_FEATURE_COMPARISON[school.plan] || {}).map(([feature, enabled]) => (
                    <div key={feature} className="flex items-center gap-3 group">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        enabled 
                          ? 'bg-emerald-50 border border-emerald-100' 
                          : 'bg-slate-50 border border-slate-100'
                      }`}>
                        <span className={`material-symbols-outlined text-sm font-bold ${
                          enabled ? 'text-emerald-500' : 'text-slate-300'
                        }`}>
                          {enabled ? 'check' : 'close'}
                        </span>
                      </div>
                      <span className={`text-sm font-medium tracking-tight ${
                        enabled ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        {FEATURE_DISPLAY_NAMES[feature] || feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fee Configuration */}
              {/* <div className="space-y-6 pt-2">
                <p className="text-[11px] font-black text-[#1E3A5F] uppercase tracking-widest">
                  Fee Configuration
                </p>
                <div className="flex flex-wrap gap-3">
                  {["Term 1", "Term 2", "Term 3"].map((term) => (
                    <div
                      key={term}
                      className="px-5 py-2.5 rounded-xl border border-[#4A9FD4]/20 bg-[#4A9FD4]/5 text-[#4A9FD4] text-xs font-bold tracking-tight"
                    >
                      {term}
                    </div>
                  ))}
                </div>
              </div> */}
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
        </div>
      </div>
    </div>
  );
};

export default SchoolDetailDrawer;
