import { apiClient } from './client';
import type { FDCompany, FDUser, FDTicket, FDApplication, FDCategory } from '@/types';

export const integrationApi = {
  getCompanies: () => apiClient.get<FDCompany[]>('/api/Integration/companies'),
  getUsers: () => apiClient.get<FDUser[]>('/api/Integration/users'),
  getTickets: (params?: { companyId?: string }) => apiClient.get<FDTicket[]>('/api/Integration/tickets', { params }),
  getApplications: () => apiClient.get<FDApplication[]>('/api/Integration/applications'),
  getCategories: (applicationId?: string) => apiClient.get<FDCategory[]>('/api/Integration/categories', { params: { applicationId } }),
};
