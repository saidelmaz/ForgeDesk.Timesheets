import { apiClient } from './client';
import type { Project, ProjectTask } from '@/types';

export const projectsApi = {
  getAll: () => apiClient.get<Project[]>('/api/Projects'),
  get: (id: string) => apiClient.get<Project>(`/api/Projects/${id}`),
  create: (data: Partial<Project>) => apiClient.post<Project>('/api/Projects', data),
  update: (id: string, data: Partial<Project>) => apiClient.put<Project>(`/api/Projects/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/Projects/${id}`),
  getTasks: (projectId: string) => apiClient.get<ProjectTask[]>(`/api/Projects/${projectId}/Tasks`),
  createTask: (projectId: string, data: Partial<ProjectTask>) => apiClient.post<ProjectTask>(`/api/Projects/${projectId}/Tasks`, data),
  updateTask: (projectId: string, taskId: string, data: Partial<ProjectTask>) => apiClient.put<ProjectTask>(`/api/Projects/${projectId}/Tasks/${taskId}`, data),
  deleteTask: (projectId: string, taskId: string) => apiClient.delete(`/api/Projects/${projectId}/Tasks/${taskId}`),
};
