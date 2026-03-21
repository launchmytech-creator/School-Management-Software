import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  label,
  value,
  icon: Icon,
  iconBgColor = 'bg-blue-50',
  iconColor = 'text-blue-600',
  onClick,
  children
}) => {
  const CardWrapper = onClick ? 'button' : 'div';
  
  return (
    <CardWrapper
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer w-full text-left' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-4 ${iconBgColor} rounded-xl`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
        </div>
      </div>
      {children}
    </CardWrapper>
  );
};

export default DashboardCard;
