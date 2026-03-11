import { apiClient } from './client';
import type { TimesheetEntry, TimesheetMatrixResponse, MatrixSaveRequest } from '@/types';

export const timesheetsApi = {
  getEntries: (params?: { userId?: string; dateFrom?: string; dateTo?: string; projectId?: string; status?: string }) =>
    apiClient.get<TimesheetEntry[]>('/api/TimesheetEntries', { params }),
  getEntry: (id: string) => apiClient.get<TimesheetEntry>(`/api/TimesheetEntries/${id}`),
  createEntry: (data: Partial<TimesheetEntry>) => apiClient.post<TimesheetEntry>('/api/TimesheetEntries', data),
  updateEntry: (id: string, data: Partial<TimesheetEntry>) => apiClient.put<TimesheetEntry>(`/api/TimesheetEntries/${id}`, data),
  deleteEntry: (id: string) => apiClient.delete(`/api/TimesheetEntries/${id}`),
  getMatrix: (weekStart: string, userId?: string) =>
    apiClient.get<TimesheetMatrixResponse>('/api/TimesheetMatrix', { params: { weekStart, userId } }),
  saveMatrix: (data: MatrixSaveRequest) => apiClient.post('/api/TimesheetMatrix', data),
};
