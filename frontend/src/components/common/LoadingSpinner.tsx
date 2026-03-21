import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6 border-2',
  md: 'h-10 w-10 border-3',
  lg: 'h-12 w-12 border-4',
};

const messageSizeClasses = {
  sm: 'text-[8px]',
  md: 'text-[10px]',
  lg: 'text-xs',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  message,
  className = '' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div 
        className={`${sizeClasses[size]} rounded-full border-blue-500/20 border-t-blue-500 animate-spin`}
      />
      {message && (
        <p className={`${messageSizeClasses[size]} font-black text-slate-400 uppercase tracking-widest animate-pulse`}>
          {message}
        </p>
      )}
    </div>
  );
};

export const LoadingOverlay: React.FC = () => (
  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-3xl">
    <LoadingSpinner size="lg" message="Loading..." />
  </div>
);

export const LoadingCard: React.FC = () => (
  <div className="bg-white rounded-[2rem] h-96 flex items-center justify-center border border-slate-100 shadow-sm">
    <LoadingSpinner size="lg" message="Loading..." />
  </div>
);

export default LoadingSpinner;
