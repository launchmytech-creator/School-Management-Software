import React from 'react';
import type { UseFormRegisterReturn, FieldError } from 'react-hook-form';

interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'ref' | 'name'> {
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

const FormSelect: React.FC<FormSelectProps> = ({
  label,
  registration,
  error,
  options,
  placeholder,
  ...props
}) => {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center px-1">
        <label className={`block text-xs font-semibold ${error ? 'text-red-500' : 'text-slate-700'}`}>
          {label}
        </label>
        {error && (
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-tight italic">
            {error.message}
          </span>
        )}
      </div>
      <select
        className={`w-full h-10 rounded-lg border focus:ring-2 focus:border-accent outline-none text-sm text-slate-700 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400 px-3 ${
          error
            ? 'border-red-500 bg-red-50/30 focus:ring-red-500/10'
            : 'border-slate-200 focus:ring-accent/20'
        }`}
        {...registration}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FormSelect;
