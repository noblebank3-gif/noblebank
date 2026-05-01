export type Currency = 'USD' | 'GBP' | 'EUR' | 'NGN' | 'AED';

export type AccountType = 'checking' | 'savings' | 'investment' | 'foreign';

export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'processing';

export type TransactionType = 'credit' | 'debit';

export type TransactionCategory =
  | 'transfer'
  | 'payment'
  | 'deposit'
  | 'withdrawal'
  | 'investment'
  | 'fee'
  | 'salary'
  | 'shopping'
  | 'utilities'
  | 'travel';

export type CardNetwork = 'visa' | 'mastercard';

export type CardStatus = 'active' | 'frozen' | 'expired';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  joinedAt: string;
  tier: 'standard' | 'premium' | 'private';
  notifications: boolean;
  twoFactor: boolean;
  country: string;
  isAdmin?: boolean;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: Currency;
  accountNumber: string;
  routingNumber: string;
  iban?: string;
  swift?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  userId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  currency: Currency;
  description: string;
  merchant?: string;
  merchantIcon?: string;
  status: TransactionStatus;
  reference: string;
  counterparty?: string;
  counterpartyBank?: string;
  date: string;
  processedAt?: string;
  note?: string;
}

export interface Card {
  id: string;
  accountId: string;
  userId: string;
  network: CardNetwork;
  last4: string;
  demoCardNumber?: string;
  demoCvv?: string;
  expiryMonth: string;
  expiryYear: string;
  holderName: string;
  status: CardStatus;
  type: 'debit' | 'credit';
  spendLimit?: number;
  spentThisMonth: number;
  isVirtual: boolean;
  color: 'navy' | 'gold' | 'slate';
}

export interface TransferPayload {
  fromAccountId: string;
  toAccountNumber: string;
  toBankName: string;
  toName: string;
  amount: number;
  currency: Currency;
  description: string;
  reference?: string;
}

export interface AnalyticsData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface SpendingCategory {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  date: string;
}

export interface AdminUserSummary extends User {
  accountCount: number;
  totalBalance: number;
  lastActivity?: string;
}
