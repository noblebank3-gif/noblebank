import { create } from 'zustand';
import type { Account, Transaction } from '@/types';
import { accountService, transactionService } from '@/services/api';

interface AccountState {
  accounts: Account[];
  selectedAccountId: string | null;
  transactions: Transaction[];
  isLoadingAccounts: boolean;
  isLoadingTransactions: boolean;
  error: string | null;

  fetchAccounts: () => Promise<void>;
  fetchTransactions: (accountId?: string) => Promise<void>;
  selectAccount: (id: string) => void;
  getTotalBalance: () => number;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  selectedAccountId: null,
  transactions: [],
  isLoadingAccounts: false,
  isLoadingTransactions: false,
  error: null,

  fetchAccounts: async () => {
    set({ isLoadingAccounts: true, error: null });
    try {
      const accounts = await accountService.getAccounts();
      const defaultAcc = accounts.find(a => a.isDefault);
      set({
        accounts,
        selectedAccountId: defaultAcc?.id ?? accounts[0]?.id ?? null,
        isLoadingAccounts: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load accounts';
      set({ error: msg, isLoadingAccounts: false });
    }
  },

  fetchTransactions: async (accountId) => {
    set({ isLoadingTransactions: true });
    try {
      const transactions = await transactionService.getTransactions(accountId);
      set({ transactions, isLoadingTransactions: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load transactions';
      set({ error: msg, isLoadingTransactions: false });
    }
  },

  selectAccount: (id) => set({ selectedAccountId: id }),

  getTotalBalance: () => {
    return get().accounts
      .filter(a => a.currency === 'USD')
      .reduce((sum, a) => sum + a.balance, 0);
  },
}));
