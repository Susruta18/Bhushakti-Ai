// =========================================================
// BHUSHAKTI AI — App Routes
// =========================================================

export const ROUTES = {
  LOGIN: '/login',
  HOME: '/home',
  RISK_MAP: '/risk-map',
  RISK_MAP_DETAIL: '/risk-map/:id',
  AI_PREDICTION: '/ai-prediction',
  ALERTS: '/alerts',
  ALERT_DETAIL: '/alerts/:id',
  REPORTS: '/reports',
  REPORT_NEW: '/reports/new',
  REPORT_DETAIL: '/reports/:id',
  RESPONSE_PRIORITY: '/response-priority',
  RESPONSE_PLAN: '/response-plan/:id',
  INFRASTRUCTURE: '/infrastructure',
  ANALYTICS: '/analytics',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
} as const;

export const buildRoute = {
  riskMapDetail: (id: string) => `/risk-map/${id}`,
  alertDetail: (id: string) => `/alerts/${id}`,
  reportDetail: (id: string) => `/reports/${id}`,
  responsePlan: (id: string) => `/response-plan/${id}`,
};
