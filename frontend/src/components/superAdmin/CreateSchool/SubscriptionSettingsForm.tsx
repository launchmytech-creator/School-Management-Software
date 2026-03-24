import React from 'react';
import InputField from '../../ui/InputField';
import { getAcademicYearOptions } from '../../../lib/utils';

const academicYearOptions = getAcademicYearOptions(5);

interface SubscriptionSettingsFormProps {
  formData: {
    subscriptionStatus: string;
    subscriptionEndDate: string;
    academicYear: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  errors: Record<string, string>;
}

const SubscriptionSettingsForm: React.FC<SubscriptionSettingsFormProps> = ({ formData, handleChange, errors }) => {
  return (
    <div className="space-y-16">
      {/* Subscription Settings */}
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
                name="subscriptionStatus"
                value={formData.subscriptionStatus}
                onChange={handleChange}
                className={`w-full px-6 h-14 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold text-slate-600 appearance-none cursor-pointer ${errors.subscriptionStatus ? 'border-red-500' : 'border-slate-100'}`}
              >
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="expired">Expired</option>
              </select>
              <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
            </div>
            {errors.subscriptionStatus && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest pl-1 mt-1">{errors.subscriptionStatus}</p>}
          </div>

          <InputField 
            label="Subscription End Date"
            type="date" 
            name="subscriptionEndDate"
            value={formData.subscriptionEndDate}
            onChange={handleChange}
            required
            inputClassName="h-14 bg-slate-50"
            error={errors.subscriptionEndDate}
          />
        </div>
      </section>

      <hr className="border-slate-50" />

      {/* Academic Configuration */}
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
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
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
