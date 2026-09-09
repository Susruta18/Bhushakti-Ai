import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Map, Bell, FileText, User, Brain } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../utils/cn';

const NAV_ITEMS = [
  { path: '/home', label: 'Home', Icon: Home },
  { path: '/risk-map', label: 'Risk Map', Icon: Map },
  { path: '/ai-prediction', label: 'AI Predict', Icon: Brain },
  { path: '/alerts', label: 'Alerts', Icon: Bell },
  { path: '/reports', label: 'Reports', Icon: FileText },
] as const;

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { activeAlertCount } = useAppContext();

  const isActive = (path: string) => {
    if (path === '/home') return location.pathname === '/home' || location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pb-safe h-16 bg-surface-container-lowest/90 backdrop-blur-md border-t border-outline-variant/30 rounded-t-xl shadow-lg">
      {NAV_ITEMS.map(({ path, label, Icon }) => {
        const active = isActive(path);
        const isAlerts = path === '/alerts';

        return (
          <NavLink
            key={path}
            to={path}
            className={cn(
              'flex flex-col items-center justify-center px-4 py-1 min-w-[56px] transition-all duration-200',
              active
                ? 'bg-secondary-container text-on-secondary-container rounded-full scale-90'
                : 'text-on-surface-variant hover:bg-surface-variant rounded-xl'
            )}
          >
            <div className="relative">
              <Icon
                className="w-6 h-6"
                strokeWidth={active ? 2.5 : 1.5}
              />
              {isAlerts && activeAlertCount > 0 && !active && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface-container-lowest" />
              )}
            </div>
            <span className="text-label-sm mt-1">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
