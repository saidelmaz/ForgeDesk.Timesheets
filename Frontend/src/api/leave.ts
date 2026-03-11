import { apiClient } from './client';
import type { LeaveType, LeaveBalance, LeaveRequest, LeaveOverview } from '@/types';

export const leaveApi = {
  // Leave Types
  getTypes: () => apiClient.get<LeaveType[]>('/api/LeaveTypes'),
  createType: (data: Partial<LeaveType>) => apiClient.post<LeaveType>('/api/LeaveTypes', data),
  updateType: (id: string, data: Partial<LeaveType>) => apiClient.put<LeaveType>(`/api/LeaveTypes/${id}`, data),
  deleteType: (id: string) => apiClient.delete(`/api/LeaveTypes/${id}`),

  // Leave Balances
  getBalances: (year?: number) => apiClient.get<LeaveBalance[]>('/api/LeaveBalances', { params: { year } }),
  getOverview: (year?: number) => apiClient.get<LeaveOverview>('/api/LeaveBalances/overview', { params: { year } }),

  // Leave Requests
  getRequests: (params?: { status?: string; userId?: string }) =>
    apiClient.get<LeaveRequest[]>('/api/LeaveRequests', { params }),
  getRequest: (id: string) => apiClient.get<LeaveRequest>(`/api/LeaveRequests/${id}`),
  getPendingApprovals: () => apiClient.get<LeaveRequest[]>('/api/LeaveRequests/pending-approvals'),
  createRequest: (data: { leaveTypeId: string; startDate: string; endDate: string; isHalfDayStart: boolean; isHalfDayEnd: boolean; reason?: string }) =>
    apiClient.post<LeaveRequest>('/api/LeaveRequests', data),
  updateRequest: (id: string, data: { leaveTypeId: string; startDate: string; endDate: string; isHalfDayStart: boolean; isHalfDayEnd: boolean; reason?: string }) =>
    apiClient.put(`/api/LeaveRequests/${id}`, data),
  submitRequest: (id: string) => apiClient.post(`/api/LeaveRequests/${id}/submit`),
  approveRequest: (id: string, notes?: string) => apiClient.post(`/api/LeaveRequests/${id}/approve`, { notes }),
  rejectRequest: (id: string, notes?: string) => apiClient.post(`/api/LeaveRequests/${id}/reject`, { notes }),
  cancelRequest: (id: string) => apiClient.post(`/api/LeaveRequests/${id}/cancel`),
  deleteRequest: (id: string) => apiClient.delete(`/api/LeaveRequests/${id}`),
};
