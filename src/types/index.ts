// User and Authentication Types
export type UserRole = 'admin' | 'reviewer';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Invoice Types
export type InvoiceStatus = 'pending' | 'accepted' | 'rejected' | 'in_review';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  vendorName: string;
  vendorEmail?: string;
  poNumber: string;
  amount: number;
  tax: number;
  totalAmount: number;
  status: InvoiceStatus;
  lineItems: LineItem[];
  emailId?: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  pdfUrl?: string;
}

// Email Processing Types
export type EmailType = 'invoice' | 'non_invoice';

export interface ProcessedEmail {
  id: string;
  subject: string;
  sender: string;
  receivedAt: string;
  type: EmailType;
  invoiceId?: string;
  processed: boolean;
}

// Dashboard Metrics
export interface AdminMetrics {
  totalEmailsProcessed: number;
  invoiceEmailsDetected: number;
  nonInvoiceEmails: number;
  invoicesInReviewQueue: number;
}

export interface ReviewerMetrics {
  invoicesWaiting: number;
  acceptedInvoices: number;
  rejectedInvoices: number;
  resolvedToday: number;
}

// System Logs
export type LogAction = 
  | 'login' 
  | 'logout' 
  | 'create_user' 
  | 'accept_invoice' 
  | 'reject_invoice' 
  | 'view_invoice'
  | 'update_invoice';

export interface SystemLog {
  id: string;
  username: string;
  action: LogAction;
  details?: string;
  timestamp: string;
  ipAddress?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form Types
export interface CreateReviewerForm {
  username: string;
  email: string;
}

export interface InvoiceUpdateForm {
  invoiceNumber: string;
  invoiceDate: string;
  vendorName: string;
  poNumber: string;
  amount: number;
  tax: number;
}
