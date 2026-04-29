import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { authService } from '@/services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  signup: (payload: Partial<User> & { password: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await authService.login(email, password);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Login failed';
          set({ error: msg, isLoading: false });
        }
      },

      signup: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await authService.signup(payload);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Signup failed';
          set({ error: msg, isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        await authService.logout();
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      },

      clearError: () => set({ error: null }),

      hydrate: async () => {
        const token = localStorage.getItem('ntb_token');
        if (!token) return;
        try {
          const user = await authService.getMe();
          set({ user, token, isAuthenticated: true });
        } catch {
          localStorage.removeItem('ntb_token');
        }
      },
    }),
    {
      name: 'ntb-auth',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
