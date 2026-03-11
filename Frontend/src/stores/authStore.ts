import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, type UserInfo, type TenantInfo } from '@/api/auth';
import toast from 'react-hot-toast';

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  currentTenantId: string | null;
  currentTenant: TenantInfo | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<boolean>;
  logout: () => void;
  setCurrentTenant: (tenantId: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      currentTenantId: null,
      currentTenant: null,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          const res = await authApi.login({ email, password });
          const { token, user } = res.data;
          localStorage.setItem('ts-accessToken', token);
          const firstTenant = user.tenants?.[0] || null;
          set({
            user, token, isAuthenticated: true,
            currentTenantId: firstTenant?.tenantId || null,
            currentTenant: firstTenant,
          });
          toast.success(`Welcome, ${user.firstName}!`);
          return true;
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Login failed');
          return false;
        }
      },

      register: async (email, password, firstName, lastName) => {
        try {
          const res = await authApi.register({ email, password, firstName, lastName });
          const { token, user } = res.data;
          localStorage.setItem('ts-accessToken', token);
          const firstTenant = user.tenants?.[0] || null;
          set({
            user, token, isAuthenticated: true,
            currentTenantId: firstTenant?.tenantId || null,
            currentTenant: firstTenant,
          });
          toast.success('Registration successful!');
          return true;
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Registration failed');
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('ts-accessToken');
        set({ user: null, token: null, currentTenantId: null, currentTenant: null, isAuthenticated: false });
        toast.success('Logged out');
      },

      setCurrentTenant: (tenantId) => {
        const user = get().user;
        const tenant = user?.tenants?.find(t => t.tenantId === tenantId) || null;
        set({ currentTenantId: tenantId, currentTenant: tenant });
      },
    }),
    { name: 'ts-auth-storage', partialize: (state) => ({ user: state.user, token: state.token, currentTenantId: state.currentTenantId, currentTenant: state.currentTenant, isAuthenticated: state.isAuthenticated }) }
  )
);
