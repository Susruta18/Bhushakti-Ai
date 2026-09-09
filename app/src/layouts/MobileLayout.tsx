import React from 'react';
import { AppHeader } from '../components/navigation/AppHeader';
import { BottomNavigation } from '../components/navigation/BottomNavigation';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { OfflineState } from '../components/common/ErrorState';

interface MobileLayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
  noPadding?: boolean;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  hideHeader = false,
  noPadding = false,
}) => {
  const { isOffline } = useNetworkStatus();

  return (
    <div className="min-h-screen bg-background text-on-background font-sans antialiased">
      {!hideHeader && <AppHeader />}

      {isOffline && (
        <div className={`fixed w-full z-40 ${hideHeader ? 'top-0' : 'top-14'}`}>
          <OfflineState />
        </div>
      )}

      <main
        className={
          noPadding
            ? 'pt-14 pb-16'
            : 'pt-20 pb-24 px-4 max-w-[430px] mx-auto w-full'
        }
      >
        {children}
      </main>

      <BottomNavigation />
    </div>
  );
};
