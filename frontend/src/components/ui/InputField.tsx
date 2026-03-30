import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: string;
  onToggleEye?: () => void;
  inputClassName?: string;
  error?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, icon, onToggleEye, inputClassName, error, ...props }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center px-1">
      <label className={`block text-xs font-semibold ${error ? 'text-red-500' : 'text-slate-700'}`}>{label}</label>
      {error && <span className="text-[10px] font-bold text-red-500 uppercase tracking-tight italic">{error}</span>}
    </div>
    <div className="relative">
      {icon && (
        <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg transition-colors ${error ? 'text-red-400' : 'text-slate-400'}`}>
          {icon}
        </span>
      )}
      <input
        className={`w-full h-10 rounded-lg border focus:ring-2 focus:border-accent outline-none text-sm text-slate-700 placeholder:text-slate-300 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400 ${icon ? 'pl-10' : 'px-3'} ${onToggleEye ? 'pr-10' : ''} ${error ? 'border-red-500 bg-red-50/30 focus:ring-red-500/10' : 'border-slate-200 focus:ring-accent/20'} ${inputClassName || ''}`}
        {...props}
      />
      {onToggleEye && (
        <span 
          className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg cursor-pointer hover:text-slate-600 transition-colors"
          onClick={onToggleEye}
        >
          {props.type === 'password' ? 'visibility_off' : 'visibility'}
        </span>
      )}
    </div>
  </div>
);

export default InputField;
