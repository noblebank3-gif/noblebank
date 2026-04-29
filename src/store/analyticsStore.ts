import { create } from 'zustand';
import type { AnalyticsData, SpendingCategory } from '@/types';
import { analyticsService } from '@/services/api';

interface AnalyticsState {
  analytics: AnalyticsData[];
  spendingCategories: SpendingCategory[];
  isLoading: boolean;
  error: string | null;

  fetchAnalytics: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  analytics: [],
  spendingCategories: [],
  isLoading: false,
  error: null,

  fetchAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const [analytics, spendingCategories] = await Promise.all([
        analyticsService.getAnalytics(),
        analyticsService.getSpendingCategories(),
      ]);
      set({ analytics, spendingCategories, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load analytics';
      set({ error: msg, isLoading: false });
    }
  },
}));
