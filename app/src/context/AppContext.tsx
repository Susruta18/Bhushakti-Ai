import React, { createContext, useContext, useState } from 'react';

interface AppContextValue {
  isOffline: boolean;
  setIsOffline: (v: boolean) => void;
  activeAlertCount: number;
  setActiveAlertCount: (n: number) => void;
  unreadNotificationCount: number;
  setUnreadNotificationCount: (n: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [activeAlertCount, setActiveAlertCount] = useState(0); // Will be populated dynamically in production, for now left at 0 until we fetch real alerts count if needed
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  return (
    <AppContext.Provider value={{ 
      isOffline, setIsOffline, 
      activeAlertCount, setActiveAlertCount,
      unreadNotificationCount, setUnreadNotificationCount
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
