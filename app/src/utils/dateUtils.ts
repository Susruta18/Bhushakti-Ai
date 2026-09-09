// =========================================================
// BHUSHAKTI AI — Date & Time Utilities
// =========================================================

export const formatTimeAgo = (isoString: string): string => {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export const formatDateTime = (isoString: string): string => {
  return new Date(isoString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (isoString: string): string => {
  return new Date(isoString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const isDataStale = (isoString: string, thresholdMinutes = 15): boolean => {
  const diff = Date.now() - new Date(isoString).getTime();
  return diff > thresholdMinutes * 60 * 1000;
};

export const getDataAge = (isoString: string): string => {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'less than a minute';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  const hours = Math.floor(diff / 3600000);
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
};
