import React from 'react';
import { z } from 'zod';
import { createSchoolFormSchema } from '../../../schemas/school.schema';
import type { UseFormRegister } from 'react-hook-form';
import { getAcademicYearOptions } from '../../../lib/utils';

type CreateSchoolFormData = z.infer<typeof createSchoolFormSchema>;

interface SubscriptionSettingsFormProps {
  register: UseFormRegister<CreateSchoolFormData>;
  errors: Record<string, { message?: string }>;
}

const academicYearOptions = getAcademicYearOptions(5);

const SubscriptionSettingsForm: React.FC<SubscriptionSettingsFormProps> = ({ 
  register, 
  errors 
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
