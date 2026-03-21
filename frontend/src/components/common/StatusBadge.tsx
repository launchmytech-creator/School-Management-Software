import React from 'react';

interface StatusBadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  label,
  variant = 'neutral'
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/10';
      case 'warning':
        return 'bg-amber-50 text-amber-600 border-amber-100 shadow-sm shadow-amber-500/10';
      case 'info':
        return 'bg-blue-50 text-blue-600 border-blue-100 shadow-sm shadow-blue-500/10';
      case 'danger':
        return 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-500/10';
      default:
        return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  return (
    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border inline-block ${getStyles()}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
