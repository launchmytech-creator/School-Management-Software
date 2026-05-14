import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';

interface FilterBarAction {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  className?: string;
  actions?: FilterBarAction[];
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  searchTerm, 
  onSearchChange, 
  onReset, 
  searchPlaceholder = "Search...", 
  children,
  className = '',
  actions
}) => {
  const hasActiveFilters = React.Children.count(children) > 0 || searchTerm;

  return (
    <div className={`bg-white p-4 rounded-xl border border-slate-200 flex flex-col lg:flex-row gap-4 items-start lg:items-center ${className}`}>
      <div className="relative flex-1 w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <input 
          type="text" 
          placeholder={searchPlaceholder} 
          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-11 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      {children && (
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {children}
        </div>
      )}

      {actions && actions.length > 0 && (
        <div className="flex items-center gap-2 w-full lg:w-auto">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant={action.variant || 'default'}
                size="sm"
                onClick={action.onClick}
                className="gap-1.5"
              >
                <Icon className="size-4" />
                {action.label}
              </Button>
            );
          })}
        </div>
      )}

      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onReset}
          className="gap-1.5 text-slate-500 hover:text-slate-700"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      )}
    </div>
  );
};

export default FilterBar;
