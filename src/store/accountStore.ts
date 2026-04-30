import { create } from 'zustand';
import type { Account, Transaction } from '@/types';
import { accountService, transactionService } from '@/services/api';

interface MonthlyStats {
  income:  number;
  spend:   number;
  savings: number;
}

interface AccountState {
  accounts: Account[];
  selectedAccountId: string | null;
  transactions: Transaction[];
  isLoadingAccounts: boolean;
  isLoadingTransactions: boolean;
  error: string | null;

  fetchAccounts:     () => Promise<void>;
  fetchTransactions: (accountId?: string) => Promise<void>;
  selectAccount:     (id: string) => void;
  getTotalBalance:   () => number;
  getMonthlyStats:   () => MonthlyStats;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts:              [],
  selectedAccountId:     null,
  transactions:          [],
  isLoadingAccounts:     false,
  isLoadingTransactions: false,
  error:                 null,

  fetchAccounts: async () => {
    set({ isLoadingAccounts: true, error: null });
    try {
      const accounts  = await accountService.getAccounts();
      const defaultAcc = accounts.find(a => a.isDefault);
      set({
        accounts,
        selectedAccountId: defaultAcc?.id ?? accounts[0]?.id ?? null,
        isLoadingAccounts: false,
      });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to load accounts', isLoadingAccounts: false });
    }
  },

  fetchTransactions: async (accountId) => {
    set({ isLoadingTransactions: true });
    try {
      const transactions = await transactionService.getTransactions(accountId);
      set({ transactions, isLoadingTransactions: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to load transactions', isLoadingTransactions: false });
    }
  },

  selectAccount: (id) => set({ selectedAccountId: id }),

  getTotalBalance: () =>
    get().accounts
      .filter(a => a.currency === 'USD')
      .reduce((sum, a) => sum + a.balance, 0),

  getMonthlyStats: (): MonthlyStats => {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const txns  = get().transactions.filter(
      t => t.date >= start && t.status === 'completed',
    );
    const income  = txns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    const spend   = txns.filter(t => t.type === 'debit' ).reduce((s, t) => s + t.amount, 0);
    return { income, spend, savings: income - spend };
  },
}));
