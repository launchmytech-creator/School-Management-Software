import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

interface Action {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'secondary';
  disabled?: boolean;
  className?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  breadcrumb?: {
    links: Array<{
      label: string;
      href?: string;
      active?: boolean;
    }>;
  };
  actions?: Action[];
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  description,
  breadcrumb, 
  actions,
  children 
}) => {
  useEffect(() => {
    document.title = `${title} | EduManage`;
  }, [title]);

  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
      <div className="space-y-1">
        {breadcrumb && (
          <nav className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            {breadcrumb.links.map((link, i) => (
              <React.Fragment key={`${link.label}-${i}`}>
                {i > 0 && <ChevronRight className="size-3" />}
                {link.href && !link.active ? (
                  <Link 
                    to={link.href} 
                    className="hover:text-blue-500 transition-colors cursor-pointer"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <span className={`${link.active ? "text-blue-500 cursor-default" : "cursor-default"}`}>
                    {link.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        )}
        {description && (
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">{description}</p>
        )}
        {children && (
          <div className="mt-3">{children}</div>
        )}
      </div>
      
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant || 'default'}
              onClick={action.onClick}
              className={`gap-2 ${action.className || ''}`}
              disabled={action.disabled}
            >
              {action.icon && <action.icon className="size-4" />}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
