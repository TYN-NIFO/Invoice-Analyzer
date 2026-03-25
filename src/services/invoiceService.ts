import { Invoice, InvoiceStatus, InvoiceUpdateForm, PaginatedResponse } from '@/types';
import { mockInvoices } from '@/data/mockData';

/**
 * Invoice Service
 * 
 * Handles all invoice-related API operations.
 * Currently uses mock data, structured for PostgreSQL integration.
 * 
 * Future PostgreSQL Tables:
 * - invoices: Core invoice data
 * - invoice_line_items: Line items with foreign key to invoices
 * - invoice_audit_log: Track all invoice actions
 */

// Simulate network delay
const simulateDelay = (ms: number = 500): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// In-memory store for demo (simulating database state)
let invoicesStore = [...mockInvoices];

/**
 * Get all invoices with optional filtering
 * 
 * Future: GET /api/invoices?status=pending&page=1&pageSize=10
 */
export const getInvoices = async (
  status?: InvoiceStatus,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Invoice>> => {
  await simulateDelay();

  let filtered = [...invoicesStore];
  
  if (status) {
    filtered = filtered.filter((inv) => inv.status === status);
  }

  // Sort by creation date (newest first)
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
 * Get invoices in review queue (pending + in_review)
 * 
 * Future: GET /api/invoices/queue
 */
export const getReviewQueue = async (): Promise<Invoice[]> => {
  await simulateDelay();

  return invoicesStore.filter(
    (inv) => inv.status === 'pending' || inv.status === 'in_review'
  );
};

/**
 * Get invoice by ID
 * 
 * Future: GET /api/invoices/:id
 */
export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
  await simulateDelay(300);

  return invoicesStore.find((inv) => inv.id === id) || null;
};

/**
 * Update invoice status (accept/reject)
 * 
 * Future: PATCH /api/invoices/:id/status
 * This will create an audit log entry in PostgreSQL
 */
export const updateInvoiceStatus = async (
  id: string,
  status: InvoiceStatus,
  reviewerUsername: string
): Promise<Invoice> => {
  await simulateDelay(600);

  const index = invoicesStore.findIndex((inv) => inv.id === id);
  if (index === -1) {
    throw new Error('Invoice not found');
  }

  const updatedInvoice: Invoice = {
    ...invoicesStore[index],
    status,
    reviewedBy: reviewerUsername,
    reviewedAt: new Date().toISOString(),
  };

  invoicesStore[index] = updatedInvoice;

  return updatedInvoice;
};

/**
 * Update invoice details
 * 
 * Future: PUT /api/invoices/:id
 */
export const updateInvoice = async (
  id: string,
  data: InvoiceUpdateForm
): Promise<Invoice> => {
  await simulateDelay(500);

  const index = invoicesStore.findIndex((inv) => inv.id === id);
  if (index === -1) {
    throw new Error('Invoice not found');
  }

  const updatedInvoice: Invoice = {
    ...invoicesStore[index],
    ...data,
    totalAmount: data.amount + data.tax,
  };

  invoicesStore[index] = updatedInvoice;

  return updatedInvoice;
};

/**
 * Start reviewing an invoice (set to in_review)
 * 
 * Future: POST /api/invoices/:id/start-review
 */
export const startReview = async (id: string, reviewerUsername: string): Promise<Invoice> => {
  await simulateDelay(300);

  const index = invoicesStore.findIndex((inv) => inv.id === id);
  if (index === -1) {
    throw new Error('Invoice not found');
  }

  const updatedInvoice: Invoice = {
    ...invoicesStore[index],
    status: 'in_review',
    reviewedBy: reviewerUsername,
  };

  invoicesStore[index] = updatedInvoice;

  return updatedInvoice;
};

/**
 * Get invoice statistics for dashboards
 * 
 * Future: GET /api/invoices/stats
 */
export const getInvoiceStats = async (): Promise<{
  pending: number;
  inReview: number;
  accepted: number;
  rejected: number;
  total: number;
}> => {
  await simulateDelay(300);

  return {
    pending: invoicesStore.filter((inv) => inv.status === 'pending').length,
    inReview: invoicesStore.filter((inv) => inv.status === 'in_review').length,
    accepted: invoicesStore.filter((inv) => inv.status === 'accepted').length,
    rejected: invoicesStore.filter((inv) => inv.status === 'rejected').length,
    total: invoicesStore.length,
  };
};
