import { apiClient } from './api';

const toReadableError = (error: any, fallback: string): string => {
  const detail = error?.response?.data?.detail;

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (typeof first === 'string') {
      return first;
    }
    if (first?.msg) {
      return String(first.msg);
    }
    return JSON.stringify(first);
  }

  if (detail && typeof detail === 'object') {
    if (detail.message) {
      return String(detail.message);
    }
    return JSON.stringify(detail);
  }

  const message = error?.message;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return fallback;
};

/**
 * Email Ingestion Service
 * 
 * Handles email fetching, OCR processing, and invoice creation.
 * Requires valid API key in X-API-Key header.
 */

export interface IngestionResult {
  success: boolean;
  message: string;
  result: {
    message: string;
    processed: number;
    total: number;
  };
  timestamp: string;
}

export interface ManualUploadResult {
  success: boolean;
  message: string;
  result: {
    invoice_id: number;
    invoice_number?: string;
    vendor_name?: string;
    total_amount?: number;
    drive_file_id?: string;
    drive_link?: string;
  };
  timestamp: string;
}

export interface IngestionLog {
  id: number;
  emailSubject: string;
  filename: string;
  emailFrom: string;
  status: 'success' | 'failed' | 'skipped';
  driveLink?: string;
  errorMessage?: string;
  createdAt: string;
}

/**
 * Trigger email ingestion process
 * 
 * This will:
 * 1. Connect to Gmail IMAP
 * 2. Fetch unread emails with invoice keywords
 * 3. Extract attachments (PDF/Images)
 * 4. Run OCR using Mindee
 * 5. Upload files to Google Drive
 * 6. Save invoice data to PostgreSQL
 * 7. Move processed emails to "Processed_Invoices" label
 */
export const triggerEmailIngestion = async (): Promise<IngestionResult> => {
  try {
    const response = await apiClient.post('/ingestion/trigger');
    return response.data;
  } catch (error: any) {
    throw new Error(toReadableError(error, 'Failed to trigger email ingestion'));
  }
};

/**
 * Get email ingestion logs
 * 
 * Returns the last 100 ingestion attempts with their status
 */
export const getIngestionLogs = async (): Promise<IngestionLog[]> => {
  try {
    const response = await apiClient.get('/ingestion-logs');
    return response.data.data;
  } catch (error: any) {
    throw new Error(toReadableError(error, 'Failed to fetch ingestion logs'));
  }
};

/**
 * Get ingestion status
 */
export const getIngestionStatus = async () => {
  try {
    const logs = await getIngestionLogs();
    
    const statuses = {
      success: logs.filter(l => l.status === 'success').length,
      failed: logs.filter(l => l.status === 'failed').length,
      skipped: logs.filter(l => l.status === 'skipped').length,
      total: logs.length,
    };
    
    return statuses;
  } catch (error) {
    throw new Error('Failed to get ingestion status');
  }
};

/**
 * Upload invoice manually and run full ingestion flow
 */
export const uploadManualInvoice = async (file: File): Promise<ManualUploadResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/ingestion/manual-upload', formData, {
      timeout: 300000,
    });

    return response.data;
  } catch (error: any) {
    if (error?.code === 'ECONNABORTED') {
      throw new Error('Manual upload timed out. Processing can take several minutes; please try again.');
    }
    throw new Error(toReadableError(error, 'Failed to process manual invoice upload'));
  }
};
