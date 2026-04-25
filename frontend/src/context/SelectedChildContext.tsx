/** Selected Child Context
 * 
 * Manages selected child ID across all parent pages.
 * Persists selection in localStorage for persistence across sessions.
 * Wraps parentRoutes - all child-related pages share this context.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'parent_selected_child_id';

interface SelectedChildContextType {
  selectedChildId: number | null;
  setSelectedChildId: (id: number) => void;
}

export const SelectedChildContext = createContext<SelectedChildContextType | undefined>(undefined);

export const useSelectedChild = () => {
  const context = useContext(SelectedChildContext);
  if (!context) {
    throw new Error('useSelectedChild must be used within SelectedChildProvider');
  }
  return context;
};

const getStoredChildId = (): number | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? parseInt(stored, 10) : null;
};

const setStoredChildId = (id: number | null): void => {
  if (typeof window === 'undefined') return;
  if (id) {
    localStorage.setItem(STORAGE_KEY, id.toString());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
};

export const SelectedChildProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedChildId, setSelectedChildIdState] = useState<number | null>(getStoredChildId);

  const setSelectedChildId = useCallback((id: number) => {
    setSelectedChildIdState(id);
    setStoredChildId(id);
  }, []);

  useEffect(() => {
    const stored = getStoredChildId();
    if (stored) {
      setSelectedChildIdState(stored);
    }
  }, []);

  return (
    <SelectedChildContext.Provider value={{ selectedChildId, setSelectedChildId }}>
      {children}
    </SelectedChildContext.Provider>
  );
};