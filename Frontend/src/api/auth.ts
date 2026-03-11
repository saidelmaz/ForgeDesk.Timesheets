import { apiClient } from './client';

export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { email: string; password: string; firstName: string; lastName: string; }
export interface LoginResponse { token: string; user: UserInfo; }
export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isSuperAdmin: boolean;
  tenants: TenantInfo[];
}
export interface TenantInfo { tenantId: string; tenantName: string; role: string; }

export const authApi = {
  login: (data: LoginRequest) => apiClient.post<LoginResponse>('/api/Auth/login', data),
  register: (data: RegisterRequest) => apiClient.post<LoginResponse>('/api/Auth/register', data),
  me: () => apiClient.get<UserInfo>('/api/Auth/me'),
};
