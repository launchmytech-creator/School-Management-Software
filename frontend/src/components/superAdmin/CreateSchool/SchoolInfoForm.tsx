import React from 'react';
import InputField from '../../ui/InputField';

interface SchoolInfoFormProps {
  formData: {
    name: string;
    code: string;
    address: string;
    phone: string;
    email: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  errors: Record<string, string>;
}

const SchoolInfoForm: React.FC<SchoolInfoFormProps> = ({ formData, handleChange, errors }) => {
  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <InputField 
          label="School Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="e.g. Greenfield International School" 
          inputClassName="h-14 bg-slate-50"
          error={errors.name}
        />

        <InputField 
          label="School Code"
          name="code"
          value={formData.code}
          onChange={handleChange}
          required
          placeholder="e.g. GIS001" 
          inputClassName="h-14 bg-slate-50"
          error={errors.code}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Office Address</label>
        <textarea 
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
          placeholder="Full street address, building number..." 
          rows={3}
          className={`w-full p-6 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium text-slate-700 resize-none ${errors.address ? 'border-red-500 bg-red-50/10' : 'border-slate-100'}`}
        />
        {errors.address && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest pl-1 mt-1">{errors.address}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <InputField 
          label="Contact Phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          placeholder="+1 (555) 000-0000" 
          inputClassName="h-14 bg-slate-50"
          error={errors.phone}
        />
        <InputField 
          label="Contact Email"
          type="email" 
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="contact@school.com" 
          inputClassName="h-14 bg-slate-50"
          error={errors.email}
        />
      </div>
    </section>
  );
};

export default SchoolInfoForm;
