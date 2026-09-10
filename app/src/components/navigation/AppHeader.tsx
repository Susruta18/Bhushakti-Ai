import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid2X2, User, Bell } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface AppHeaderProps {
  showBack?: boolean;
  title?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ title = 'BHUSHAKTI AI' }) => {
  const navigate = useNavigate();
  const { activeAlertCount, unreadNotificationCount } = useAppContext();

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-14 bg-background">
      {/* Menu button */}
      <button
        aria-label="Menu"
        className="text-primary hover:bg-surface-container transition-colors p-2 rounded-full -ml-2 active:scale-95 duration-100"
      >
        <Grid2X2 className="w-6 h-6" />
      </button>

      {/* Title with logo */}
      <div className="text-center flex-1 flex items-center justify-center gap-2">
        <img
          src="/bhushakti-logo.png"
          alt="BHUSHAKTI AI"
          className="w-7 h-7 rounded-md object-cover"
          draggable={false}
        />
        <h1 className="text-headline-md font-bold tracking-tight text-primary">{title}</h1>
      </div>

      {/* Right side icons */}
      <div className="flex items-center gap-1">
        <button
          aria-label="Notifications"
          onClick={() => navigate('/notifications')}
          className="text-primary hover:bg-surface-container transition-colors p-2 rounded-full active:scale-95 duration-100 relative"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
          )}
        </button>

        {/* Profile avatar */}
        <button
          aria-label="Profile"
          onClick={() => navigate('/profile')}
          className="text-primary hover:bg-surface-container transition-colors p-1 rounded-full -mr-1 active:scale-95 duration-100 relative"
        >
          <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center overflow-hidden">
            <User className="w-4 h-4 text-primary" />
          </div>
          {activeAlertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-background" />
          )}
        </button>
      </div>
    </header>
  );
};
