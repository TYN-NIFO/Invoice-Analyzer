import { SystemLog, LogAction, PaginatedResponse } from '@/types';
import { mockSystemLogs } from '@/data/mockData';

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

// Simulate network delay
const simulateDelay = (ms: number = 400): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// In-memory store for demo
let logsStore = [...mockSystemLogs];

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
  await simulateDelay();

  let filtered = [...logsStore];

  if (action) {
    filtered = filtered.filter((log) => log.action === action);
  }

  // Sort by timestamp (newest first)
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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
  await simulateDelay(200);

  const newLog: SystemLog = {
    id: `LOG-${Date.now()}`,
    username,
    action,
    details,
    timestamp: new Date().toISOString(),
    ipAddress: '192.168.1.100', // Would be captured server-side
  };

  logsStore.unshift(newLog);

  return newLog;
};

/**
 * Get recent logs for dashboard
 * 
 * Future: GET /api/logs/recent?limit=5
 */
export const getRecentLogs = async (limit: number = 5): Promise<SystemLog[]> => {
  await simulateDelay(300);

  return logsStore
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};

/**
 * Get logs by username
 * 
 * Future: GET /api/logs?username=john.reviewer
 */
export const getLogsByUser = async (username: string): Promise<SystemLog[]> => {
  await simulateDelay(300);

  return logsStore.filter((log) => log.username === username);
};
