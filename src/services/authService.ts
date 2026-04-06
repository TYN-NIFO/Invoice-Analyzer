import { AuthResponse, User } from '@/types';

export const storeAuthData = (authResponse: AuthResponse): void => {
  localStorage.setItem('authToken', authResponse.token);
  localStorage.setItem('user', JSON.stringify(authResponse.user));
};

export const getStoredUser = (): User | null => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    return null;
  }
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const clearAuthData = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};
