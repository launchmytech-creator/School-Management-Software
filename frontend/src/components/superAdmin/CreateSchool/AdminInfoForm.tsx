import React from 'react';
import type { UseFormRegister } from 'react-hook-form';

interface AdminInfoFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  errors: Record<string, { message?: string }>;
  isEditMode?: boolean;
}

const AdminInfoForm: React.FC<AdminInfoFormProps> = ({ register, errors, isEditMode }) => {
  return (
    <section className="space-y-8">
      <div className="flex items-center gap-4 text-[#1E3A5F]">
        <span className="material-symbols-outlined text-2xl">person</span>
        <h3 className="text-xl font-display font-bold">School Administrator</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest pl-1 mb-1">
            Admin Full Name
          </label>
          <input
            type="text"
            {...register('adminFullName')}
            required={!isEditMode}
            placeholder="e.g., John Doe"
            className={`w-full px-6 h-14 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium text-slate-700 ${errors.adminFullName ? 'border-red-500' : 'border-slate-100'}`}
          />
          {errors.adminFullName && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest pl-1 mt-1">{errors.adminFullName.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest pl-1 mb-1">
            Admin Email
          </label>
          <input
            type="email"
            {...register('adminEmail')}
            required={!isEditMode}
            placeholder="admin@schoolname.com"
            disabled={isEditMode}
            className={`w-full px-6 h-14 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium text-slate-700 disabled:bg-slate-100 disabled:cursor-not-allowed ${errors.adminEmail ? 'border-red-500' : 'border-slate-100'}`}
          />
          {!isEditMode && errors.adminEmail && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest pl-1 mt-1">{errors.adminEmail.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest pl-1 mb-1">
            Admin Password
          </label>
          <input
            type="password"
            {...register('adminPassword')}
            required={!isEditMode}
            disabled={isEditMode}
            placeholder={isEditMode ? "Contact support to change password" : "Min. 8 characters"}
            className={`w-full px-6 h-14 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium text-slate-700 disabled:bg-slate-100 disabled:cursor-not-allowed ${errors.adminPassword ? 'border-red-500' : 'border-slate-100'}`}
          />
          {!isEditMode && errors.adminPassword && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest pl-1 mt-1">{errors.adminPassword.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest pl-1 mb-1">
            Admin Phone
          </label>
          <input
            type="text"
            {...register('adminPhone')}
            required={!isEditMode}
            placeholder="e.g., +91 98765 43210"
            className={`w-full px-6 h-14 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium text-slate-700 ${errors.adminPhone ? 'border-red-500' : 'border-slate-100'}`}
          />
          {errors.adminPhone && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest pl-1 mt-1">{errors.adminPhone.message}</p>}
        </div>
      </div>
    </section>
  );
};

export default AdminInfoForm;
