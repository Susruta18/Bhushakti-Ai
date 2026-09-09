import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => (
  <div className="min-h-screen bg-background text-on-background font-sans antialiased flex flex-col items-center justify-center p-4">
    {children}
  </div>
);
