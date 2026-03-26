import { Invoice, InvoiceStatus, InvoiceUpdateForm, PaginatedResponse } from '@/types';
import { apiClient } from './api';

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

const mapInvoice = (invoice: any): Invoice => {
  // Handle line items with proper field mapping
  const lineItems = Array.isArray(invoice.lineItems)
    ? invoice.lineItems.map((item: any) => ({
        id: String(item.id || ''),
        description: item.description || '',
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || item.unit_price || 0),
        total: Number(item.total || item.total_price || 0),
      }))
    : [];

  return {
    id: String(invoice.id),
    invoiceNumber: invoice.invoiceNumber || invoice.invoice_number || '',
    invoiceDate: invoice.invoiceDate || invoice.invoice_date || '',
    vendorName: invoice.vendorName || invoice.vendor_name || '',
    vendorEmail: invoice.vendorEmail || invoice.vendor_email || '',
    poNumber: invoice.poNumber || invoice.po_number || '',
    amount: Number(invoice.amount || 0),
    tax: Number(invoice.tax || 0),
    totalAmount: Number(invoice.totalAmount || invoice.total_amount || 0),
    status: invoice.status || 'pending',
    lineItems,
    emailId: invoice.emailId || invoice.email_id || '',
    createdAt: invoice.createdAt || invoice.created_at || '',
    pdfUrl: invoice.pdfUrl || invoice.pdf_url || '',
    reviewedBy: invoice.reviewedBy || invoice.reviewed_by || '',
    reviewedAt: invoice.reviewedAt || invoice.reviewed_at || '',
  };
};

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
  const response = await apiClient.get('/invoices', {
    params: {
      status_filter: status,
      page,
      page_size: pageSize,
    },
  });

  return {
    ...response.data,
    data: response.data.data.map(mapInvoice),
  };
};

/**
 * Get invoices in review queue (pending + in_review)
 * 
 * Future: GET /api/invoices/queue
 */
export const getReviewQueue = async (): Promise<Invoice[]> => {
  const response = await apiClient.get('/invoices', {
    params: {
      page: 1,
      page_size: 200,
    },
  });

  return response.data.data
    .map(mapInvoice)
    .filter((inv: Invoice) => inv.status === 'pending' || inv.status === 'in_review');
};

/**
 * Get reviewer decision history (accepted + rejected)
 */
export const getDecisionHistory = async (): Promise<Invoice[]> => {
  const response = await apiClient.get('/invoices/history', {
    params: {
      page: 1,
      page_size: 1000,
    },
  });

  return response.data.data.map(mapInvoice);
};

/**
 * Get invoice by ID
 * 
 * Future: GET /api/invoices/:id
 */
export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
  const response = await apiClient.get(`/invoices/${id}`);
  return mapInvoice(response.data);
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
  await apiClient.put(`/invoices/${id}`, {
    status,
    reviewed_by: reviewerUsername,
    notes: `Reviewed by ${reviewerUsername}`,
  });

  const refreshed = await apiClient.get(`/invoices/${id}`);
  return mapInvoice(refreshed.data);
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
  await apiClient.put(`/invoices/${id}/details`, {
    invoice_number: data.invoiceNumber,
    invoice_date: data.invoiceDate,
    vendor_name: data.vendorName,
    po_number: data.poNumber,
    amount: data.amount,
    tax: data.tax,
    line_items: data.lineItems?.map((item) => ({
      id: Number(item.id),
      unit_price: item.unitPrice,
    })),
  });

  const refreshed = await apiClient.get(`/invoices/${id}`);
  return mapInvoice(refreshed.data);
};

/**
 * Start reviewing an invoice (set to in_review)
 * 
 * Future: POST /api/invoices/:id/start-review
 */
export const startReview = async (id: string, reviewerUsername: string): Promise<Invoice> => {
  return updateInvoiceStatus(id, 'in_review', reviewerUsername);
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
  const response = await apiClient.get('/invoices/status/stats');

  return {
    pending: response.data.pending,
    inReview: response.data.in_review,
    accepted: response.data.accepted,
    rejected: response.data.rejected,
    total: response.data.total,
  };
};
