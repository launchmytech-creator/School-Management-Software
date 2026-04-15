import React from 'react';

interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  variant?: 'default' | 'emerald' | 'rose' | 'amber' | 'blue' | 'purple';
  onClick?: () => void;
}

const variantStyles = {
  default: {
    card: 'bg-white border-slate-200',
    value: 'text-slate-900',
    label: 'text-slate-500',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  emerald: {
    card: 'bg-emerald-50 border-emerald-200',
    value: 'text-emerald-700',
    label: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  rose: {
    card: 'bg-rose-50 border-rose-200',
    value: 'text-rose-700',
    label: 'text-rose-600',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
  amber: {
    card: 'bg-amber-50 border-amber-200',
    value: 'text-amber-700',
    label: 'text-amber-600',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  blue: {
    card: 'bg-blue-50 border-blue-200',
    value: 'text-blue-700',
    label: 'text-blue-600',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  purple: {
    card: 'bg-purple-50 border-purple-200',
    value: 'text-purple-700',
    label: 'text-purple-600',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
};

const AdminStatCard: React.FC<AdminStatCardProps> = ({ 
  label, 
  value, 
  icon: Icon, 
  variant = 'default',
  onClick
}) => {
  const styles = variantStyles[variant];
  
  return (
    <div 
      onClick={onClick}
      className={`rounded-xl border p-5 hover:shadow-md transition-all duration-300 group cursor-pointer ${styles.card}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-2xl font-bold ${styles.value}`}>{value}</p>
          <p className={`text-sm ${styles.label}`}>{label}</p>
        </div>
        <div className={`p-3 rounded-xl ${styles.iconBg}`}>
          <Icon className={`w-5 h-5 ${styles.iconColor}`} />
        </div>
      </div>
    </div>
  );
};

export default AdminStatCard;
