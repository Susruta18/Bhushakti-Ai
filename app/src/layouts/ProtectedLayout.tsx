import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { LoadingState } from '../components/common/LoadingState';
import { useAppContext } from '../context/AppContext';
import { notificationService } from '../services/notificationService';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return <LoadingState fullScreen message="Initializing BHUSHAKTI AI..." />;
  }

  const { setUnreadNotificationCount } = useAppContext();

  React.useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCount = async () => {
      const count = await notificationService.getUnreadCount();
      setUnreadNotificationCount(count);
    };

    fetchCount();
    // Poll every 60 seconds
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, setUnreadNotificationCount]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
