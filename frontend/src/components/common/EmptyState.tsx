import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { FileQuestion } from 'lucide-react';
import { Button } from '../ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon = FileQuestion, 
  title, 
  description, 
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 bg-white rounded-xl border border-dashed border-slate-200 ${className}`}>
      <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center mb-5 border border-slate-100 shadow-sm">
        <Icon className="size-7 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 mt-1.5 text-center max-w-sm">{description}</p>
      )}
      {action && (
        <Button 
          onClick={action.onClick} 
          variant="outline"
          className="mt-6 gap-2"
          size="sm"
        >
          {action.icon && <action.icon className="size-4" />}
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
