import React from 'react';
import type { UseFormRegister } from 'react-hook-form';

interface SchoolInfoFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  errors: Record<string, { message?: string }>;
}

const SchoolInfoForm: React.FC<SchoolInfoFormProps> = ({ register, errors }) => {
  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest pl-1 mb-1">
            School Name
          </label>
          <input
            type="text"
            {...register('name')}
            required
            placeholder="e.g. Greenfield International School"
            className={`w-full px-6 h-14 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium text-slate-700 ${errors.name ? 'border-red-500' : 'border-slate-100'}`}
          />
          {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest pl-1 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest pl-1 mb-1">
            School Code
          </label>
          <input
            type="text"
            {...register('code')}
            required
            placeholder="e.g. GIS001"
            className={`w-full px-6 h-14 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium text-slate-700 ${errors.code ? 'border-red-500' : 'border-slate-100'}`}
          />
          {errors.code && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest pl-1 mt-1">{errors.code.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Office Address</label>
        <textarea
          {...register('address')}
          required
          placeholder="Full street address, building number..."
          rows={3}
          className={`w-full p-6 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium text-slate-700 resize-none ${errors.address ? 'border-red-500 bg-red-50/10' : 'border-slate-100'}`}
        />
        {errors.address && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest pl-1 mt-1">{errors.address.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest pl-1 mb-1">
            Contact Phone
          </label>
          <input
            type="text"
            {...register('phone')}
            required
            placeholder="+1 (555) 000-0000"
            className={`w-full px-6 h-14 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium text-slate-700 ${errors.phone ? 'border-red-500' : 'border-slate-100'}`}
          />
          {errors.phone && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest pl-1 mt-1">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest pl-1 mb-1">
            Contact Email
          </label>
          <input
            type="email"
            {...register('email')}
            required
            placeholder="contact@school.com"
            className={`w-full px-6 h-14 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium text-slate-700 ${errors.email ? 'border-red-500' : 'border-slate-100'}`}
          />
          {errors.email && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest pl-1 mt-1">{errors.email.message}</p>}
        </div>
      </div>
    </section>
  );
};

export default SchoolInfoForm;
