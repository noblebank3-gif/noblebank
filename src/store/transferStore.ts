import { create } from 'zustand';
import type { TransferPayload } from '@/types';
import { transferService } from '@/services/api';

type TransferStatus = 'idle' | 'loading' | 'success' | 'error';

interface TransferState {
  status: TransferStatus;
  reference: string | null;
  error: string | null;

  initiateTransfer: (payload: TransferPayload) => Promise<void>;
  reset: () => void;
}

export const useTransferStore = create<TransferState>((set) => ({
  status: 'idle',
  reference: null,
  error: null,

  initiateTransfer: async (payload) => {
    set({ status: 'loading', error: null, reference: null });
    try {
      const result = await transferService.initiateTransfer(payload);
      set({ status: 'success', reference: result.reference });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transfer failed';
      set({ status: 'error', error: msg });
    }
  },

  reset: () => set({ status: 'idle', reference: null, error: null }),
}));
