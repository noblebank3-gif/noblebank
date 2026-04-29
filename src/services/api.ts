import axios from 'axios';
import type {
  User, Account, Transaction, Card,
  TransferPayload, AnalyticsData, SpendingCategory, Notification,
} from '@/types';
import {
  mockUser, mockAccounts, mockTransactions,
  mockCards, mockAnalytics, mockSpendingCategories,
  mockNotifications,
} from '@/data/mockData';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Axios instance — swap baseURL for real API later
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('ntb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ───────────────────────────────────────────────────────────────────
export const authService = {
  login: async (email: string, _password: string): Promise<{ user: User; token: string }> => {
    await delay(1400);
    if (!email) throw new Error('Invalid credentials');
    localStorage.setItem('ntb_token', 'mock_jwt_token_noble_trust');
    return { user: mockUser, token: 'mock_jwt_token_noble_trust' };
  },

  signup: async (_payload: Partial<User> & { password: string }): Promise<{ user: User; token: string }> => {
    await delay(1800);
    localStorage.setItem('ntb_token', 'mock_jwt_token_noble_trust');
    return { user: mockUser, token: 'mock_jwt_token_noble_trust' };
  },

  logout: async (): Promise<void> => {
    await delay(300);
    localStorage.removeItem('ntb_token');
  },

  getMe: async (): Promise<User> => {
    await delay(600);
    const token = localStorage.getItem('ntb_token');
    if (!token) throw new Error('Unauthenticated');
    return mockUser;
  },
};

// ── Accounts ───────────────────────────────────────────────────────────────
export const accountService = {
  getAccounts: async (): Promise<Account[]> => {
    await delay(800);
    return mockAccounts;
  },

  getAccount: async (id: string): Promise<Account> => {
    await delay(400);
    const acc = mockAccounts.find(a => a.id === id);
    if (!acc) throw new Error('Account not found');
    return acc;
  },
};

// ── Transactions ───────────────────────────────────────────────────────────
export const transactionService = {
  getTransactions: async (accountId?: string): Promise<Transaction[]> => {
    await delay(900);
    if (accountId) return mockTransactions.filter(t => t.accountId === accountId);
    return mockTransactions;
  },

  getTransaction: async (id: string): Promise<Transaction> => {
    await delay(400);
    const txn = mockTransactions.find(t => t.id === id);
    if (!txn) throw new Error('Transaction not found');
    return txn;
  },
};

// ── Transfers ──────────────────────────────────────────────────────────────
export const transferService = {
  initiateTransfer: async (payload: TransferPayload): Promise<{ reference: string; status: string }> => {
    await delay(2000);
    if (payload.amount <= 0) throw new Error('Invalid amount');
    const ref = `TRF-${Date.now()}`;
    return { reference: ref, status: 'completed' };
  },
};

// ── Cards ──────────────────────────────────────────────────────────────────
export const cardService = {
  getCards: async (): Promise<Card[]> => {
    await delay(700);
    return mockCards;
  },

  toggleFreeze: async (cardId: string, freeze: boolean): Promise<Card> => {
    await delay(1000);
    const card = mockCards.find(c => c.id === cardId);
    if (!card) throw new Error('Card not found');
    return { ...card, status: freeze ? 'frozen' : 'active' };
  },
};

// ── Analytics ──────────────────────────────────────────────────────────────
export const analyticsService = {
  getAnalytics: async (): Promise<AnalyticsData[]> => {
    await delay(1000);
    return mockAnalytics;
  },

  getSpendingCategories: async (): Promise<SpendingCategory[]> => {
    await delay(800);
    return mockSpendingCategories;
  },
};

// ── Notifications ──────────────────────────────────────────────────────────
export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    await delay(500);
    return mockNotifications;
  },
};
