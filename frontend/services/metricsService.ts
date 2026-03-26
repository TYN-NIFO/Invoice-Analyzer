import { AdminMetrics, ReviewerMetrics } from '@/types';
import { apiClient } from './api';

/**
 * Metrics Service
 * 
 * Provides dashboard metrics and statistics.
 * Currently uses mock data, will aggregate from PostgreSQL tables.
 * 
 * Future PostgreSQL Queries:
 * - Aggregate counts from emails, invoices tables
 * - Calculate daily/weekly/monthly trends
 * - Performance metrics for reviewers
 */

/**
 * Get admin dashboard metrics
 * 
 * Future: GET /api/metrics/admin
 */
export const getAdminMetrics = async (): Promise<AdminMetrics> => {
  const response = await apiClient.get('/metrics/admin');
  return response.data;
};

/**
 * Get reviewer dashboard metrics
 * 
 * Future: GET /api/metrics/reviewer
 * This will filter based on the authenticated reviewer
 */
export const getReviewerMetrics = async (): Promise<ReviewerMetrics> => {
  const response = await apiClient.get('/metrics/reviewer');
  return response.data;
};

/**
 * Get processing trends (for charts)
 * 
 * Future: GET /api/metrics/trends?period=week
 */
export const getProcessingTrends = async (): Promise<{
  labels: string[];
  invoices: number[];
  emails: number[];
}> => {
  const response = await apiClient.get('/metrics/trends', {
    params: { period: 'week' },
  });
  return response.data;
};
