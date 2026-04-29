import { create } from 'zustand';
import type { Card } from '@/types';
import { cardService } from '@/services/api';

interface CardState {
  cards: Card[];
  isLoading: boolean;
  togglingId: string | null;
  error: string | null;

  fetchCards: () => Promise<void>;
  toggleFreeze: (cardId: string) => Promise<void>;
}

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  isLoading: false,
  togglingId: null,
  error: null,

  fetchCards: async () => {
    set({ isLoading: true, error: null });
    try {
      const cards = await cardService.getCards();
      set({ cards, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load cards';
      set({ error: msg, isLoading: false });
    }
  },

  toggleFreeze: async (cardId) => {
    const card = get().cards.find(c => c.id === cardId);
    if (!card) return;
    set({ togglingId: cardId });
    try {
      const updated = await cardService.toggleFreeze(cardId, card.status !== 'frozen');
      set(state => ({
        cards: state.cards.map(c => c.id === cardId ? updated : c),
        togglingId: null,
      }));
    } catch {
      set({ togglingId: null });
    }
  },
}));
