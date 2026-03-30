import React from 'react';
import InputField from '../../ui/InputField';

interface AdminInfoFormProps {
  formData: {
    adminFullName: string;
    adminEmail: string;
    adminPassword: string;
    adminPhone: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  errors: Record<string, string>;
  isEditMode?: boolean;
  adminEmail?: string;
}

const AdminInfoForm: React.FC<AdminInfoFormProps> = ({ formData, handleChange, errors, isEditMode, adminEmail }) => {
  return (
    <section className="space-y-8">
      <div className="flex items-center gap-4 text-[#1E3A5F]">
        <span className="material-symbols-outlined text-2xl">person</span>
        <h3 className="text-xl font-display font-bold">School Administrator</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <InputField 
          label="Admin Full Name"
          name="adminFullName"
          value={formData.adminFullName}
          onChange={handleChange}
          required={!isEditMode}
          placeholder="e.g., John Doe" 
          inputClassName="h-14 bg-slate-50"
          error={errors.adminFullName}
        />
        <InputField 
          label="Admin Email"
          type="email" 
          name="adminEmail"
          value={isEditMode ? (adminEmail || formData.adminEmail) : formData.adminEmail}
          onChange={handleChange}
          required={!isEditMode}
          placeholder="admin@schoolname.com" 
          inputClassName="h-14 bg-slate-50"
          disabled={isEditMode}
          error={isEditMode ? undefined : errors.adminEmail}
        />
        <InputField 
          label="Admin Password"
          type="password" 
          name="adminPassword"
          value={formData.adminPassword}
          onChange={handleChange}
          required={!isEditMode}
          disabled={isEditMode}
          placeholder={isEditMode ? "Contact support to change password" : "Min. 8 characters"} 
          inputClassName="h-14 bg-slate-50"
          error={isEditMode ? undefined : errors.adminPassword}
        />
        <InputField 
          label="Admin Phone"
          name="adminPhone"
          value={formData.adminPhone}
          onChange={handleChange}
          required={!isEditMode}
          placeholder="e.g., +91 98765 43210" 
          inputClassName="h-14 bg-slate-50"
          error={errors.adminPhone}
        />
      </div>
    </section>
  );
};

export default AdminInfoForm;
