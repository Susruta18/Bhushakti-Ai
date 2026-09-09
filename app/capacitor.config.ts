import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.bhushakti.app',
  appName: 'BHUSHAKTI AI',
  webDir: 'dist',

  // -------------------------------------------------------
  // Android — local development / LAN testing only
  //
  // allowMixedContent: true is required because Capacitor
  // serves the WebView from https://localhost (HTTPS), but
  // the development backend runs on plain HTTP at
  // http://192.168.1.103:5000.  Without this flag the
  // Chromium WebView Mixed Content policy blocks all HTTP
  // sub-resource requests, producing "Failed to fetch".
  //
  // This must be set to false (or removed) before any
  // production release.
  // -------------------------------------------------------
  android: {
    allowMixedContent: true,
  },
};

export default config;

