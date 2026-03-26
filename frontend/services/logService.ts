import { SystemLog, LogAction, PaginatedResponse } from '@/types';
import { apiClient } from './api';

/**
 * Log Service
 * 
 * Handles system log operations.
 * Currently uses mock data, structured for PostgreSQL integration.
 * 
 * Future PostgreSQL Tables:
 * - system_logs: All system activities
 * - audit_trail: Detailed change history
 */

/**
 * Get system logs with pagination
 * 
 * Future: GET /api/logs?page=1&pageSize=20&action=login
 */
export const getLogs = async (
  action?: LogAction,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<SystemLog>> => {
  const response = await apiClient.get('/logs', {
    params: {
      action,
      page,
      page_size: pageSize,
    },
  });

  return response.data;
};

/**
 * Create a new log entry
 * 
 * Future: POST /api/logs
 * This will be called internally by other API endpoints
 */
export const createLog = async (
  username: string,
  action: LogAction,
  details?: string
): Promise<SystemLog> => {
  await apiClient.post('/logs', {
    username,
    action,
    details,
  });

  return {
    id: String(Date.now()),
    username,
    action,
    details,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Get recent logs for dashboard
 * 
 * Future: GET /api/logs/recent?limit=5
 */
export const getRecentLogs = async (limit: number = 5): Promise<SystemLog[]> => {
  const response = await apiClient.get('/logs/recent', {
    params: { limit },
  });

  return response.data;
};

/**
 * Get logs by username
 * 
 * Future: GET /api/logs?username=john.reviewer
 */
export const getLogsByUser = async (username: string): Promise<SystemLog[]> => {
  const response = await apiClient.get('/logs', {
    params: {
      username,
      page: 1,
      page_size: 200,
    },
  });

  return response.data.data;
};
