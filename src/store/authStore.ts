import { create } from 'zustand';
import type { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { authService, seedUserData } from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrating: boolean;
  error: string | null;

  login:      (email: string, password: string) => Promise<void>;
  signup:     (payload: Partial<User> & { password: string }) => Promise<void>;
  logout:     () => Promise<void>;
  markSignedOut: () => void;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
  hydrate:    () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:            null,
  isAuthenticated: false,
  isLoading:       false,
  isHydrating:     true,
  error:           null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authService.login(email, password);
      // Seed starter data if this user confirmed email before seeding ran
      const { count } = await supabase.from('accounts').select('*', { count: 'exact', head: true });
      if ((count ?? 0) === 0) {
        await seedUserData(user.id, user.firstName, user.lastName);
      }
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Login failed', isLoading: false });
    }
  },

  signup: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authService.signup(payload);
      // Seed accounts, cards, and welcome notifications for the new user
      await seedUserData(user.id, user.firstName, user.lastName);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Signup failed', isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.logout();
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false, isHydrating: false });
    }
  },

  markSignedOut: () =>
    set({ user: null, isAuthenticated: false, isLoading: false, isHydrating: false }),

  updateUser: (updates) =>
    set(state => ({ user: state.user ? { ...state.user, ...updates } : null })),

  clearError: () => set({ error: null }),

  hydrate: async () => {
    set({ isHydrating: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        set({ isHydrating: false });
        return;
      }
      const user = await authService.getMe();
      set({ user, isAuthenticated: true, isHydrating: false });
    } catch {
      await supabase.auth.signOut();
      set({ user: null, isAuthenticated: false, isHydrating: false });
    }
  },
}));
