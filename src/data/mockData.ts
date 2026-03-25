import { 
  User, 
  Invoice, 
  SystemLog, 
  AdminMetrics, 
  ReviewerMetrics,
  ProcessedEmail 
} from '@/types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@invoiceanalyser.com',
    role: 'admin',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: '2',
    username: 'john.reviewer',
    email: 'john@invoiceanalyser.com',
    role: 'reviewer',
    createdAt: '2025-01-20T14:30:00Z',
  },
  {
    id: '3',
    username: 'sarah.reviewer',
    email: 'sarah@invoiceanalyser.com',
    role: 'reviewer',
    createdAt: '2025-01-22T09:15:00Z',
  },
];

// Mock Invoices
export const mockInvoices: Invoice[] = [
  {
    id: 'INV-001',
    invoiceNumber: 'INV-2025-0001',
    invoiceDate: '2025-02-01',
    vendorName: 'Acme Corporation',
    vendorEmail: 'billing@acme.com',
    poNumber: 'PO-2025-0421',
    amount: 2450.00,
    tax: 441.00,
    totalAmount: 2891.00,
    status: 'pending',
    lineItems: [
      { id: '1', description: 'Software License', quantity: 5, unitPrice: 400, total: 2000 },
      { id: '2', description: 'Support Package', quantity: 1, unitPrice: 450, total: 450 },
    ],
    emailId: 'EMAIL-001',
    createdAt: '2025-02-01T08:30:00Z',
  },
  {
    id: 'INV-002',
    invoiceNumber: 'INV-2025-0002',
    invoiceDate: '2025-02-01',
    vendorName: 'TechSupply Inc.',
    vendorEmail: 'invoices@techsupply.com',
    poNumber: 'PO-2025-0422',
    amount: 1875.50,
    tax: 337.59,
    totalAmount: 2213.09,
    status: 'pending',
    lineItems: [
      { id: '1', description: 'Office Equipment', quantity: 3, unitPrice: 625.17, total: 1875.50 },
    ],
    emailId: 'EMAIL-002',
    createdAt: '2025-02-01T09:15:00Z',
  },
  {
    id: 'INV-003',
    invoiceNumber: 'INV-2025-0003',
    invoiceDate: '2025-01-30',
    vendorName: 'Global Services Ltd',
    vendorEmail: 'accounts@globalservices.com',
    poNumber: 'PO-2025-0418',
    amount: 5200.00,
    tax: 936.00,
    totalAmount: 6136.00,
    status: 'in_review',
    lineItems: [
      { id: '1', description: 'Consulting Services', quantity: 20, unitPrice: 200, total: 4000 },
      { id: '2', description: 'Travel Expenses', quantity: 1, unitPrice: 1200, total: 1200 },
    ],
    emailId: 'EMAIL-003',
    createdAt: '2025-01-30T14:22:00Z',
    reviewedBy: 'john.reviewer',
  },
  {
    id: 'INV-004',
    invoiceNumber: 'INV-2025-0004',
    invoiceDate: '2025-01-28',
    vendorName: 'CloudHost Pro',
    vendorEmail: 'billing@cloudhost.com',
    poNumber: 'PO-2025-0415',
    amount: 899.00,
    tax: 161.82,
    totalAmount: 1060.82,
    status: 'accepted',
    lineItems: [
      { id: '1', description: 'Cloud Hosting - Monthly', quantity: 1, unitPrice: 899, total: 899 },
    ],
    emailId: 'EMAIL-004',
    createdAt: '2025-01-28T11:45:00Z',
    reviewedBy: 'sarah.reviewer',
    reviewedAt: '2025-01-29T10:30:00Z',
  },
  {
    id: 'INV-005',
    invoiceNumber: 'INV-2025-0005',
    invoiceDate: '2025-01-25',
    vendorName: 'Office Supplies Co.',
    vendorEmail: 'sales@officesupplies.com',
    poNumber: 'PO-2025-0410',
    amount: 342.75,
    tax: 61.70,
    totalAmount: 404.45,
    status: 'rejected',
    lineItems: [
      { id: '1', description: 'Printer Paper (Box)', quantity: 10, unitPrice: 24.50, total: 245 },
      { id: '2', description: 'Ink Cartridges', quantity: 3, unitPrice: 32.58, total: 97.75 },
    ],
    emailId: 'EMAIL-005',
    createdAt: '2025-01-25T16:00:00Z',
    reviewedBy: 'john.reviewer',
    reviewedAt: '2025-01-26T09:15:00Z',
  },
  {
    id: 'INV-006',
    invoiceNumber: 'INV-2025-0006',
    invoiceDate: '2025-02-02',
    vendorName: 'Marketing Solutions',
    vendorEmail: 'finance@marketingsolutions.com',
    poNumber: 'PO-2025-0425',
    amount: 3500.00,
    tax: 630.00,
    totalAmount: 4130.00,
    status: 'pending',
    lineItems: [
      { id: '1', description: 'Digital Marketing Campaign', quantity: 1, unitPrice: 3500, total: 3500 },
    ],
    emailId: 'EMAIL-006',
    createdAt: '2025-02-02T07:20:00Z',
  },
];

// Mock System Logs
export const mockSystemLogs: SystemLog[] = [
  {
    id: 'LOG-001',
    username: 'admin',
    action: 'login',
    timestamp: '2025-02-03T08:00:00Z',
    ipAddress: '192.168.1.100',
  },
  {
    id: 'LOG-002',
    username: 'john.reviewer',
    action: 'login',
    timestamp: '2025-02-03T08:15:00Z',
    ipAddress: '192.168.1.101',
  },
  {
    id: 'LOG-003',
    username: 'john.reviewer',
    action: 'view_invoice',
    details: 'Viewed invoice INV-2025-0003',
    timestamp: '2025-02-03T08:20:00Z',
    ipAddress: '192.168.1.101',
  },
  {
    id: 'LOG-004',
    username: 'sarah.reviewer',
    action: 'accept_invoice',
    details: 'Accepted invoice INV-2025-0004',
    timestamp: '2025-01-29T10:30:00Z',
    ipAddress: '192.168.1.102',
  },
  {
    id: 'LOG-005',
    username: 'john.reviewer',
    action: 'reject_invoice',
    details: 'Rejected invoice INV-2025-0005',
    timestamp: '2025-01-26T09:15:00Z',
    ipAddress: '192.168.1.101',
  },
  {
    id: 'LOG-006',
    username: 'admin',
    action: 'create_user',
    details: 'Created reviewer account: sarah.reviewer',
    timestamp: '2025-01-22T09:15:00Z',
    ipAddress: '192.168.1.100',
  },
  {
    id: 'LOG-007',
    username: 'admin',
    action: 'create_user',
    details: 'Created reviewer account: john.reviewer',
    timestamp: '2025-01-20T14:30:00Z',
    ipAddress: '192.168.1.100',
  },
];

// Mock Processed Emails
export const mockProcessedEmails: ProcessedEmail[] = [
  {
    id: 'EMAIL-001',
    subject: 'Invoice from Acme Corporation',
    sender: 'billing@acme.com',
    receivedAt: '2025-02-01T08:25:00Z',
    type: 'invoice',
    invoiceId: 'INV-001',
    processed: true,
  },
  {
    id: 'EMAIL-002',
    subject: 'Your Invoice #INV-2025-0002',
    sender: 'invoices@techsupply.com',
    receivedAt: '2025-02-01T09:10:00Z',
    type: 'invoice',
    invoiceId: 'INV-002',
    processed: true,
  },
  {
    id: 'EMAIL-003',
    subject: 'Invoice for Consulting Services',
    sender: 'accounts@globalservices.com',
    receivedAt: '2025-01-30T14:18:00Z',
    type: 'invoice',
    invoiceId: 'INV-003',
    processed: true,
  },
  {
    id: 'EMAIL-007',
    subject: 'Meeting Reminder: Q1 Review',
    sender: 'calendar@company.com',
    receivedAt: '2025-02-01T07:00:00Z',
    type: 'non_invoice',
    processed: true,
  },
  {
    id: 'EMAIL-008',
    subject: 'Newsletter: Industry Updates',
    sender: 'news@industryweekly.com',
    receivedAt: '2025-02-01T06:30:00Z',
    type: 'non_invoice',
    processed: true,
  },
];

// Mock Metrics
export const mockAdminMetrics: AdminMetrics = {
  totalEmailsProcessed: 1247,
  invoiceEmailsDetected: 892,
  nonInvoiceEmails: 355,
  invoicesInReviewQueue: 4,
};

export const mockReviewerMetrics: ReviewerMetrics = {
  invoicesWaiting: 3,
  acceptedInvoices: 156,
  rejectedInvoices: 23,
  resolvedToday: 5,
};
