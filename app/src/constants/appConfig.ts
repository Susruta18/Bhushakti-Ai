// =========================================================
// BHUSHAKTI AI — App Configuration
// =========================================================

export const APP_CONFIG = {
  name: 'BHUSHAKTI AI',
  tagline: 'Landslide Intelligence & Early Warning',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  env: import.meta.env.VITE_APP_ENV || 'development',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://bhushakti-ai-backend.onrender.com/api',

  // Demo region
  defaultRegion: 'Darjeeling Hills',

  // Mock data disclaimer
  mockDataDisclaimer: 'Simulated demonstration data. Not real measurements.',

  // Mobile viewport
  mobileMaxWidth: 430,

  // Data refresh intervals (ms)
  dataRefreshInterval: 5 * 60 * 1000, // 5 minutes
  alertPollInterval: 60 * 1000,        // 1 minute

  // Stale data threshold (minutes)
  staleDataThreshold: 15,

  // Map defaults
  mapDefaults: {
    lat: 27.0364,
    lng: 88.2627,
    zoom: 12,
  },
} as const;
