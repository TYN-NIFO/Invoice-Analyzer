import { AdminMetrics, ReviewerMetrics } from '@/types';
import { mockAdminMetrics, mockReviewerMetrics, mockInvoices } from '@/data/mockData';

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

// Simulate network delay
const simulateDelay = (ms: number = 300): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Get admin dashboard metrics
 * 
 * Future: GET /api/metrics/admin
 */
export const getAdminMetrics = async (): Promise<AdminMetrics> => {
  await simulateDelay();

  // Calculate actual queue count from mock invoices
  const queueCount = mockInvoices.filter(
    (inv) => inv.status === 'pending' || inv.status === 'in_review'
  ).length;

  return {
    ...mockAdminMetrics,
    invoicesInReviewQueue: queueCount,
  };
};

/**
 * Get reviewer dashboard metrics
 * 
 * Future: GET /api/metrics/reviewer
 * This will filter based on the authenticated reviewer
 */
export const getReviewerMetrics = async (): Promise<ReviewerMetrics> => {
  await simulateDelay();

  // Calculate from mock data
  const waiting = mockInvoices.filter(
    (inv) => inv.status === 'pending' || inv.status === 'in_review'
  ).length;
  
  const accepted = mockInvoices.filter((inv) => inv.status === 'accepted').length;
  const rejected = mockInvoices.filter((inv) => inv.status === 'rejected').length;

  return {
    ...mockReviewerMetrics,
    invoicesWaiting: waiting,
    acceptedInvoices: accepted,
    rejectedInvoices: rejected,
  };
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
  await simulateDelay();

  // Mock trend data for the last 7 days
  return {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    invoices: [45, 52, 38, 67, 55, 12, 8],
    emails: [120, 145, 98, 156, 132, 34, 22],
  };
};
