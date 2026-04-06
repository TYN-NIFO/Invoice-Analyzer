import { AuthResponse, User } from '@/types';

/**
 * Store auth data in local storage
 */
export const storeAuthData = (authResponse: AuthResponse): void => {
  sessionStorage.setItem('authToken', authResponse.token);
  sessionStorage.setItem('user', JSON.stringify(authResponse.user));
};

/**
 * Get stored user from current tab session
 */
export const getStoredUser = (): User | null => {
  const storedUser = sessionStorage.getItem('user');
  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    return null;
  }
};

/**
 * Get stored token
 */
export const getStoredToken = (): string | null => {
  return sessionStorage.getItem('authToken');
};

/**
 * Clear auth data
 */
export const clearAuthData = (): void => {
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('user');
};
