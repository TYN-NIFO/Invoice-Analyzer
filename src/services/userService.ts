import { User, CreateReviewerForm, PaginatedResponse } from '@/types';
import { mockUsers } from '@/data/mockData';

/**
 * User Service
 * 
 * Handles user management operations.
 * Currently uses mock data, structured for PostgreSQL integration.
 * 
 * Future PostgreSQL Tables:
 * - users: User accounts with hashed passwords
 * - user_roles: Role assignments
 * - user_sessions: Active sessions
 */

// Simulate network delay
const simulateDelay = (ms: number = 500): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// In-memory store for demo
let usersStore = [...mockUsers];

/**
 * Get all users (admin only)
 * 
 * Future: GET /api/users?role=reviewer&page=1
 */
export const getUsers = async (
  role?: 'admin' | 'reviewer',
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<User>> => {
  await simulateDelay();

  let filtered = [...usersStore];

  if (role) {
    filtered = filtered.filter((u) => u.role === role);
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const data = filtered.slice(startIndex, startIndex + pageSize);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  };
};

/**
 * Get user by ID
 * 
 * Future: GET /api/users/:id
 */
export const getUserById = async (id: string): Promise<User | null> => {
  await simulateDelay(300);

  return usersStore.find((u) => u.id === id) || null;
};

/**
 * Create a new reviewer account
 * 
 * Future: POST /api/users/reviewer
 * This will:
 * - Generate secure password
 * - Hash and store in PostgreSQL
 * - Send credentials via email
 */
export const createReviewer = async (data: CreateReviewerForm): Promise<User> => {
  await simulateDelay(800);

  // Check for existing username
  const exists = usersStore.some(
    (u) => u.username.toLowerCase() === data.username.toLowerCase()
  );
  if (exists) {
    throw new Error('Username already exists');
  }

  // Check for existing email
  const emailExists = usersStore.some(
    (u) => u.email.toLowerCase() === data.email.toLowerCase()
  );
  if (emailExists) {
    throw new Error('Email already registered');
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    username: data.username,
    email: data.email,
    role: 'reviewer',
    createdAt: new Date().toISOString(),
  };

  usersStore.push(newUser);

  return newUser;
};

/**
 * Delete user (admin only)
 * 
 * Future: DELETE /api/users/:id
 */
export const deleteUser = async (id: string): Promise<void> => {
  await simulateDelay(500);

  const index = usersStore.findIndex((u) => u.id === id);
  if (index === -1) {
    throw new Error('User not found');
  }

  if (usersStore[index].role === 'admin') {
    throw new Error('Cannot delete admin users');
  }

  usersStore.splice(index, 1);
};

/**
 * Get reviewer count
 * 
 * Future: GET /api/users/count?role=reviewer
 */
export const getReviewerCount = async (): Promise<number> => {
  await simulateDelay(200);

  return usersStore.filter((u) => u.role === 'reviewer').length;
};
