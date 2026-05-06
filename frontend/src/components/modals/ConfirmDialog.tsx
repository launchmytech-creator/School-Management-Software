import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  children?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  children,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-rose-500 hover:bg-rose-600',
    warning: 'bg-amber-500 hover:bg-amber-600',
    info: 'bg-blue-500 hover:bg-blue-600',
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 text-center">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
            variant === 'danger' ? 'bg-rose-100' :
            variant === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
          }`}>
            <AlertTriangle className={`size-8 ${
              variant === 'danger' ? 'text-rose-500' :
              variant === 'warning' ? 'text-amber-500' : 'text-blue-500'
            }`} />
          </div>
          <h3 className="text-xl font-display font-black text-slate-900 mb-2">
            {title}
          </h3>
          <p className="text-slate-500 mb-6">
            {message}
          </p>
          {children}
          <div className="flex gap-3 justify-center mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="px-6"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              loading={loading}
              className={`px-6 text-white ${variantStyles[variant]}`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
