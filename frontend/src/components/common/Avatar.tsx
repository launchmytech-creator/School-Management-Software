import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

const colors = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-pink-500',
  'bg-indigo-500',
];

const getColor = (name: string): string => {
  const charCode = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[charCode % colors.length];
};

export const Avatar: React.FC<AvatarProps> = ({ 
  name, 
  size = 'md',
  className = '' 
}) => {
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || '??';

  return (
    <div 
      className={`${sizeClasses[size]} ${getColor(name)} rounded-full flex items-center justify-center text-white font-bold ${className}`}
    >
      {initials}
    </div>
  );
};
