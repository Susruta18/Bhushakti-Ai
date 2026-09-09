// =========================================================
// BHUSHAKTI AI — TypeScript Types
// auth.ts
// =========================================================

export type UserRole = 'authority' | 'field_officer' | 'citizen';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  role: UserRole;
  region: string;
  organization: string;
  avatarUrl?: string;
  lastLogin?: string;
  notificationsEnabled: boolean;
  alertPreferences: AlertPreference[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  identifier: string;
  password: string;
  role: UserRole;
}

export interface AlertPreference {
  level: 'critical' | 'high' | 'moderate' | 'low';
  enabled: boolean;
}
