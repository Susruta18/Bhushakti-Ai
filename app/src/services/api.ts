// =========================================================
// BHUSHAKTI AI — Base API Client
// Prepared for future Node.js + Express backend connection
// Currently uses mock data
// =========================================================

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Simulated network delay for realistic UX
const MOCK_DELAY = 600;

export const delay = (ms: number = MOCK_DELAY): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const apiFetch = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const url = `${API_BASE}${endpoint}`;
  
  const token = localStorage.getItem('bhushakti_access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options?.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Session expired or authentication required. Please log in again.');
    }
    
    let errorMessage = `API Error ${response.status}: ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData && errData.message) errorMessage = errData.message;
    } catch (e) {
      // ignore parsing error
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
};
