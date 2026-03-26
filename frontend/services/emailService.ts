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

export interface EmailIngestionResponse {
  success: boolean;
  message: string;
  status?: string;
  result?: any;
}

/**
 * Trigger email ingestion in background
 * Requires API key
 */
export const triggerEmailIngestion = async (): Promise<EmailIngestionResponse> => {
  try {
    const response = await apiClient.post('/ingestion/run', null, {
      timeout: 300000,
    });
    return response.data;
  } catch (error: any) {
    if (error?.code === 'ECONNABORTED') {
      throw new Error('Email ingestion timed out. Please try again.');
    }
    throw new Error(toReadableError(error, 'Failed to trigger email ingestion'));
  }
};

/**
 * Trigger email ingestion synchronously (waits for completion)
 * Requires API key
 */
export const triggerEmailIngestionSync = async (): Promise<EmailIngestionResponse> => {
  try {
    const response = await apiClient.post('/ingestion/run-sync', null, {
      timeout: 300000,
    });
    return response.data;
  } catch (error: any) {
    if (error?.code === 'ECONNABORTED') {
      throw new Error('Email ingestion timed out. Please try again.');
    }
    throw new Error(toReadableError(error, 'Failed to trigger email ingestion'));
  }
};

/**
 * Get email ingestion logs
 */
export const getIngestionLogs = async () => {
  try {
    const response = await apiClient.get('/ingestion-logs');
    return response.data.data || [];
  } catch (error: any) {
    throw new Error(toReadableError(error, 'Failed to fetch ingestion logs'));
  }
};
