import React, { useEffect, useState } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to trigger entry animation
    const entryTimer = setTimeout(() => setIsVisible(true), 10);
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => {
      clearTimeout(entryTimer);
      clearTimeout(timer);
    };
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200',
  }[type];

  const icon = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
  }[type];

  const textColor = {
    success: 'text-emerald-900',
    error: 'text-red-900',
    warning: 'text-amber-900',
    info: 'text-blue-900',
  }[type];

  const iconColor = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
  }[type];

  return (
    <div className={`fixed top-8 right-8 z-[10000] transition-all duration-300 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
      <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border shadow-xl min-w-[340px] max-w-md ${bgColor}`}>
        <span className={`material-symbols-outlined text-2xl ${iconColor}`}>{icon}</span>
        <div className="flex-1">
          <p className={`text-[13px] font-bold tracking-tight leading-snug ${textColor}`}>{message}</p>
        </div>
        <button 
          onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }} 
          className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-600"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </div>
  );
};

export default Toast;
