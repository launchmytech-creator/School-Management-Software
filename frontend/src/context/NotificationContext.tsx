import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/ui/Toast';
import type { NotificationType } from '../components/ui/Toast';

export interface NotificationContextType {
  showNotification: (message: string, type: NotificationType) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);

  const showNotification = useCallback((message: string, type: NotificationType) => {
    // Clear existing notification first to trigger a fresh toast if user clicks quickly
    setNotification(null);
    setTimeout(() => {
      setNotification({ message, type });
    }, 50);
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <Toast 
          message={notification.message} 
          type={notification.type} 
          onClose={hideNotification} 
        />
      )}
    </NotificationContext.Provider>
  );
};