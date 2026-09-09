import React from 'react';
import { AlertCircle, WifiOff, InboxIcon } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Something went wrong.',
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center gap-4 p-8 min-h-[50vh]">
    <div className="w-16 h-16 rounded-full bg-error-container/20 flex items-center justify-center">
      <AlertCircle className="w-8 h-8 text-error" />
    </div>
    <p className="text-body-md text-on-surface-variant text-center max-w-xs">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="h-10 px-6 border border-outline-variant text-on-surface text-label-md uppercase tracking-wider rounded-lg hover:bg-surface-container-high transition-colors"
      >
        Retry
      </button>
    )}
  </div>
);

export const EmptyState: React.FC<{ title: string; message: string }> = ({ title, message }) => (
  <div className="flex flex-col items-center justify-center gap-3 p-8 min-h-[40vh]">
    <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center">
      <InboxIcon className="w-8 h-8 text-on-surface-variant" />
    </div>
    <h3 className="text-headline-sm text-on-surface">{title}</h3>
    <p className="text-body-md text-on-surface-variant text-center max-w-xs">{message}</p>
  </div>
);

export const OfflineState: React.FC = () => (
  <div className="mx-4 mb-3 p-3 bg-surface-container border border-outline-variant rounded-lg flex items-center gap-3">
    <WifiOff className="w-4 h-4 text-error shrink-0" />
    <div>
      <p className="text-label-md text-on-surface">Connection unavailable</p>
      <p className="text-label-sm text-on-surface-variant mt-0.5">Showing last synchronized data.</p>
    </div>
  </div>
);
