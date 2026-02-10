
import React, { createContext, useContext, useEffect, useState } from 'react';

interface UIContextType {
  appTitle: string;
  setAppTitle: (title: string) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

const STORAGE_KEY_TITLE = 'pt_board_app_title';
const DEFAULT_TITLE = 'PT Works | 물리치료실 업무';

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appTitle, setAppTitleState] = useState(DEFAULT_TITLE);
  // Default sidebar open on desktop, possibly closed on mobile (handled by CSS media queries mostly, but state helps logic)
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTitle = localStorage.getItem(STORAGE_KEY_TITLE);
      if (savedTitle) {
        setAppTitleState(savedTitle);
      }
    }
  }, []);

  const setAppTitle = (title: string) => {
    setAppTitleState(title);
    localStorage.setItem(STORAGE_KEY_TITLE, title);
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <UIContext.Provider value={{ appTitle, setAppTitle, isSidebarOpen, setSidebarOpen, toggleSidebar }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider');
  return context;
};
