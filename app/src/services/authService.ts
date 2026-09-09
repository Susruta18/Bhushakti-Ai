import { delay, apiFetch } from './api';
import { MOCK_USER } from '../data/mockData';
import type { User, LoginCredentials } from '../types';

const AUTH_KEY = 'bhushakti_auth_user';
const TOKEN_KEY = 'bhushakti_access_token';

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      role: string;
    };
    token: string;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    if (!credentials.identifier || !credentials.password) {
      throw new Error('Please enter your credentials.');
    }

    const response = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.identifier.trim(),
        password: credentials.password,
      }),
    });

    const { user, token } = response.data;
    
    // Map backend role to frontend role type
    let role: User['role'] = 'citizen';
    if (user.role === 'AUTHORITY') role = 'authority';
    else if (user.role === 'FIELD_OFFICER') role = 'field_officer';
    else if (user.role === 'CITIZEN') role = 'citizen';

    const frontendUser: User = {
      ...MOCK_USER, // merge mock data for fields the backend doesn't provide yet
      id: user.id,
      name: user.email.split('@')[0],
      email: user.email,
      role: role,
    };

    localStorage.setItem(AUTH_KEY, JSON.stringify(frontendUser));
    localStorage.setItem(TOKEN_KEY, token);

    return frontendUser;
  },

  async logout(): Promise<void> {
    await delay(200);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },

  getCurrentUser(): User | null {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  },
};
