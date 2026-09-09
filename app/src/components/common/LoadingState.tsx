import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  fullScreen = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-label-md text-on-surface-variant uppercase tracking-wider">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

export const PageLoader: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
    <Loader2 className="w-8 h-8 text-primary animate-spin" />
    {message && (
      <p className="text-label-md text-on-surface-variant uppercase tracking-wider">{message}</p>
    )}
  </div>
);
