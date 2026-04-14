import React from 'react';
import type { UseFormRegister } from 'react-hook-form';
import { getAcademicYearOptions } from '../../../lib/utils';
import type { SubscriptionTier } from '../../../types/school';

const academicYearOptions = getAcademicYearOptions(5);

interface SubscriptionSettingsFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  errors: Record<string, { message?: string }>;
  selectedPlan?: SubscriptionTier;
  onPlanChange?: (plan: SubscriptionTier) => void;
  isEditMode?: boolean;
}

const PLAN_OPTIONS: { value: SubscriptionTier; label: string; description: string }[] = [
  { value: 'BASIC', label: 'Basic', description: 'Fee & Marks Management' },
  { value: 'PREMIUM', label: 'Premium', description: 'Basic + Attendance & Syllabus' },
  { value: 'BUSINESS', label: 'Business', description: 'All Features' },
];

const SubscriptionSettingsForm: React.FC<SubscriptionSettingsFormProps> = ({ 
  register, 
  errors, 
  selectedPlan, 
  onPlanChange,
  isEditMode = false 
}) => {
  return (
    <div className="space-y-16">
      <section className="space-y-8">
        <div className="flex items-center gap-4 text-[#1E3A5F]">
          <span className="material-symbols-outlined text-2xl">settings_applications</span>
          <h3 className="text-xl font-display font-bold">Subscription Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Subscription Status</label>
            <div className="relative">
              <select 
                {...register('subscriptionStatus')}
                className={`w-full px-6 h-14 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold text-slate-600 appearance-none cursor-pointer ${errors.subscriptionStatus ? 'border-red-500' : 'border-slate-100'}`}
              >
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="expired">Expired</option>
              </select>
              <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
            </div>
            {errors.subscriptionStatus && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest pl-1 mt-1">{errors.subscriptionStatus.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest pl-1 mb-1">
              Subscription End Date
            </label>
            <input
              type="date"
              {...register('subscriptionEndDate')}
              required
              className={`w-full px-6 h-14 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium text-slate-700 ${errors.subscriptionEndDate ? 'border-red-500' : 'border-slate-100'}`}
            />
            {errors.subscriptionEndDate && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest pl-1 mt-1">{errors.subscriptionEndDate.message}</p>}
          </div>
        </div>
      </section>

      {isEditMode && onPlanChange && (
        <>
          <hr className="border-slate-50" />
          
          <section className="space-y-8">
            <div className="flex items-center gap-4 text-[#1E3A5F]">
              <span className="material-symbols-outlined text-2xl">workspace_premium</span>
              <h3 className="text-xl font-display font-bold">Subscription Plan</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLAN_OPTIONS.map((plan) => (
                <button
                  key={plan.value}
                  type="button"
                  onClick={() => onPlanChange(plan.value)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedPlan === plan.value
                      ? plan.value === 'BUSINESS'
                        ? 'border-[#1E3A5F] bg-[#1E3A5F]/5'
                        : plan.value === 'PREMIUM'
                          ? 'border-[#4A9FD4] bg-[#4A9FD4]/5'
                          : 'border-slate-400 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full ${
                      plan.value === 'BUSINESS' ? 'bg-[#1E3A5F]' :
                      plan.value === 'PREMIUM' ? 'bg-[#4A9FD4]' : 'bg-slate-400'
                    }`} />
                    <span className="font-bold text-slate-900">{plan.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{plan.description}</p>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      <hr className="border-slate-50" />

      <section className="space-y-8">
        <div className="flex items-center gap-4 text-[#1E3A5F]">
          <span className="material-symbols-outlined text-2xl">calendar_month</span>
          <h3 className="text-xl font-display font-bold">Academic Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Starting Academic Year</label>
            <div className="relative">
              <select 
                {...register('academicYear')}
                className="w-full px-6 h-14 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold text-slate-600 appearance-none cursor-pointer"
              >
                {academicYearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SubscriptionSettingsForm;
