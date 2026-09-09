import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Bell, AlertTriangle, Database, Shield, Info, LogOut, User, ChevronRight } from 'lucide-react';
import { MobileLayout } from '../../layouts/MobileLayout';
import { useAuthContext } from '../../context/AuthContext';
import { APP_CONFIG } from '../../constants/appConfig';

const SETTINGS_SECTIONS = [
  {
    title: 'System Preferences',
    items: [
      { icon: Bell, label: 'Notification Preferences', iconColor: 'text-primary', action: null },
      { icon: AlertTriangle, label: 'Alert Preferences', iconColor: 'text-error', action: null },
      { icon: Database, label: 'Data Sources', iconColor: 'text-secondary', action: null },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: Shield, label: 'Security', iconColor: 'text-tertiary', action: null },
      { icon: Info, label: 'About BHUSHAKTI AI', iconColor: 'text-on-surface-variant', action: null },
    ],
  },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5">
        {/* Profile Header Card — from Stitch */}
        <section className="relative bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col items-center text-center overflow-hidden">
          {/* Subtle background accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

          {/* Avatar */}
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-lg mb-4 bg-surface-container-high flex items-center justify-center z-10">
            <User className="w-12 h-12 text-primary" />
          </div>

          <h1 className="text-headline-lg text-on-surface mb-1 z-10">
            {user?.name || 'Demo Authority Officer'}
          </h1>
          <p className="text-body-lg text-primary z-10 mb-3">
            {user?.organization || 'Disaster Management Authority'}
          </p>

          <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-full border border-outline-variant/50 z-10">
            <MapPin className="w-4 h-4 text-outline" />
            <span className="text-label-md text-on-surface-variant">
              Region: {user?.region || APP_CONFIG.defaultRegion}
            </span>
          </div>
        </section>

        {/* User info */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider">Account Info</h3>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Email', value: user?.email || 'officer@darjeeling.gov.in' },
              { label: 'Role', value: user?.role === 'authority' ? 'Disaster Management Authority' : user?.role || 'Authority' },
              { label: 'Region', value: user?.region || 'Darjeeling Hills' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-outline-variant/30 last:border-0">
                <span className="text-label-sm text-on-surface-variant uppercase">{label}</span>
                <span className="text-body-md text-on-surface">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Settings sections — from Stitch */}
        {SETTINGS_SECTIONS.map(({ title, items }) => (
          <section key={title} className="flex flex-col gap-2">
            <h2 className="text-label-md text-outline tracking-wider uppercase pl-1">{title}</h2>
            {items.map(({ icon: Icon, label, iconColor }) => (
              <button
                key={label}
                className="w-full flex items-center justify-between p-4 bg-surface-container hover:bg-surface-container-high transition-colors border border-outline-variant rounded-lg min-h-[56px] group"
              >
                <div className="flex items-center gap-4 text-on-surface">
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                  <span className="text-body-lg font-medium">{label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-outline group-hover:text-on-surface transition-colors" />
              </button>
            ))}
          </section>
        ))}

        {/* Logout button — from Stitch */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 p-4 mt-2 bg-error-container/20 hover:bg-error-container/40 transition-colors border border-error-container/50 rounded-lg min-h-[56px] text-error active:scale-[0.98]"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-body-lg font-medium">Logout</span>
        </button>

        {/* App version */}
        <p className="text-label-sm text-outline-variant text-center pb-2">
          BHUSHAKTI AI v{APP_CONFIG.version} — Simulated Demonstration Platform
        </p>
      </div>
    </MobileLayout>
  );
}
