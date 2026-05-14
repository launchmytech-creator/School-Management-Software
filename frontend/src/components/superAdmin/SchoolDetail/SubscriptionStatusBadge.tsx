import React from 'react';

interface SubscriptionStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const SubscriptionStatusBadge: React.FC<SubscriptionStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    trial: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Trial' },
    active: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Active' },
    suspended: { bg: 'bg-red-100', text: 'text-red-700', label: 'Suspended' },
    expired: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Expired' },
  };

  const { bg, text, label } = config[status.toLowerCase()] || config.expired;
  const sizeClasses = size === 'sm'
    ? 'text-[9px] px-3 py-1.5'
    : 'text-[10px] px-4 py-2';

  return (
    <span className={`${sizeClasses} font-black ${bg} ${text} rounded-md tracking-wider uppercase`}>
      {label}
    </span>
  );
};

export default SubscriptionStatusBadge;
