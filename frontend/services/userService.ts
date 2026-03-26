import { User, CreateReviewerForm, PaginatedResponse } from '@/types';
import { apiClient } from './api';
import axios from 'axios';

/**
 * User Service
 * 
 * Handles user management operations via PostgreSQL backend API
 */

const mapApiUserToUser = (apiUser: any): User => ({
  id: String(apiUser.id),
  username: apiUser.username,
  email: apiUser.email,
  role: apiUser.role,
  createdAt: apiUser.createdAt ?? apiUser.created_at ?? '',
});


/**
 * Get all users (admin only)
 * 
 * GET /api/users?role=reviewer&page=1
 */
export const getUsers = async (
  role?: 'admin' | 'reviewer',
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<User>> => {
  const params: any = { page, page_size: pageSize };
  if (role) params.role = role;
  
  const response = await apiClient.get('/users', { params });
  const total = response.data.total || 0;
  return {
    data: (response.data.users || []).map(mapApiUserToUser),
    total,
    page: response.data.page || 1,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

/**
 * Get user by ID
 * 
 * GET /api/users/:id
 */
export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const response = await apiClient.get(`/users/${id}`);
    return mapApiUserToUser(response.data);
  } catch {
    return null;
  }
};

/**
 * Create a new reviewer account
 * 
 * POST /api/users/reviewer
 */
export const createReviewer = async (data: CreateReviewerForm) => {
  try {
    const response = await apiClient.post('/users/reviewer', {
      username: data.username.trim(),
      email: data.email.trim(),
      password: data.password,
    });
    return mapApiUserToUser(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string' && detail.trim().length > 0) {
        throw new Error(detail);
      }
    }
    throw new Error('Failed to create reviewer. Please try again.');
  }
};

/**
 * Delete user (admin only)
 * 
 * DELETE /api/users/:id
 */
export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/${id}`);
};

/**
 * Get reviewer count
 * 
 * GET /api/users/count?role=reviewer
 */
export const getReviewerCount = async (): Promise<number> => {
  const response = await apiClient.get('/users/count', { 
    params: { role: 'reviewer' } 
  });
  return response.data.count || 0;
};
