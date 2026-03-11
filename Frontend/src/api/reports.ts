import { apiClient } from './client';
import type { ReportSummary } from '@/types';

export const reportsApi = {
  getSummary: (dateFrom: string, dateTo: string, userId?: string) =>
    apiClient.get<ReportSummary>('/api/Reports/summary', { params: { dateFrom, dateTo, userId } }),
  exportCsv: (dateFrom: string, dateTo: string, userId?: string) =>
    apiClient.get('/api/Reports/export-csv', { params: { dateFrom, dateTo, userId }, responseType: 'blob' }),
};
