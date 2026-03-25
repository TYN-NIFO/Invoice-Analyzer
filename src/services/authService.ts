import { LoginCredentials, AuthResponse, User } from '@/types';
import { apiClient } from './api';
import { z } from 'zod';

// Validation schema for login credentials
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50, 'Username is too long'),
  password: z.string().min(1, 'Password is required').max(100, 'Password is too long'),
});

/**
 * Authentication Service
 * 
 * This service layer abstracts authentication logic.
 * Currently uses mock data, but is structured for easy PostgreSQL integration.
 * 
 * Future PostgreSQL Integration:
 * - Replace mock logic with API calls to Python backend
 * - Backend will validate credentials against PostgreSQL users table
 * - JWT tokens will be generated server-side
 */

// Simulate network delay for realistic UX
const simulateDelay = (ms: number = 800): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Login user with credentials
 * 
 * Future: POST /api/auth/login
 * Body: { username, password }
 * Response: { user, token }
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  // Validate input
  const validation = loginSchema.safeParse(credentials);
  if (!validation.success) {
    throw new Error(validation.error.errors[0].message);
  }

  await simulateDelay();

  try {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error('Login failed. Please try again.');
  }
};

/**
 * Logout user
 * 
 * Future: POST /api/auth/logout
 */
export const logout = async (): Promise<void> => {
  await simulateDelay(300);
  
  // Clear local storage
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

/**
 * Get current authenticated user
 * 
 * Future: GET /api/auth/me
 */
export const getCurrentUser = async (): Promise<User | null> => {
  await simulateDelay(200);

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

/**
 * Validate token
 * 
 * Future: POST /api/auth/validate
 */
export const validateToken = async (token: string): Promise<boolean> => {
  await simulateDelay(200);

  // Mock validation
  return token.startsWith('mock-jwt-token-');
};

/**
 * Store auth data in local storage
 */
export const storeAuthData = (authResponse: AuthResponse): void => {
  localStorage.setItem('authToken', authResponse.token);
  localStorage.setItem('user', JSON.stringify(authResponse.user));
};

/**
 * Get stored token
 */
export const getStoredToken = (): string | null => {
  return localStorage.getItem('authToken');
};

/**
 * Clear auth data
 */
export const clearAuthData = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};
