import { supabase } from '@/lib/supabase';
import type {
  User, Account, Transaction, Card,
  TransferPayload, AnalyticsData, SpendingCategory, Notification,
} from '@/types';

// ── Row mappers (snake_case DB → camelCase TS) ─────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProfile(r: any): User {
  return {
    id:            r.id,
    firstName:     r.first_name,
    lastName:      r.last_name,
    email:         r.email,
    phone:         r.phone ?? '',
    avatar:        r.avatar,
    joinedAt:      r.joined_at,
    tier:          r.tier,
    notifications: r.notifications,
    twoFactor:     r.two_factor,
    country:       r.country ?? '',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAccount(r: any): Account {
  const num = (r.account_number as string) ?? '';
  return {
    id:            r.id,
    userId:        r.user_id,
    name:          r.name,
    type:          r.type,
    balance:       Number(r.balance),
    currency:      r.currency,
    accountNumber: num.length > 4 ? `****${num.slice(-4)}` : num,
    routingNumber: r.routing_number ?? '',
    iban:          r.iban,
    swift:         r.swift,
    isDefault:     r.is_default,
    createdAt:     r.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTransaction(r: any): Transaction {
  return {
    id:               r.id,
    accountId:        r.account_id,
    userId:           r.user_id,
    type:             r.type,
    category:         r.category,
    amount:           Number(r.amount),
    currency:         r.currency,
    description:      r.description,
    merchant:         r.merchant,
    merchantIcon:     r.merchant_icon,
    status:           r.status,
    reference:        r.reference ?? '',
    counterparty:     r.counterparty,
    counterpartyBank: r.counterparty_bank,
    date:             r.date,
    processedAt:      r.processed_at,
    note:             r.note,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCard(r: any): Card {
  return {
    id:             r.id,
    accountId:      r.account_id,
    userId:         r.user_id,
    network:        r.network,
    last4:          r.last4,
    expiryMonth:    r.expiry_month,
    expiryYear:     r.expiry_year,
    holderName:     r.holder_name,
    status:         r.status,
    type:           r.type,
    spendLimit:     r.spend_limit != null ? Number(r.spend_limit) : undefined,
    spentThisMonth: Number(r.spent_this_month),
    isVirtual:      r.is_virtual,
    color:          r.color,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNotification(r: any): Notification {
  return {
    id:      r.id,
    title:   r.title,
    message: r.message,
    type:    r.type,
    read:    r.read,
    date:    r.date,
  };
}

// ── Auth ───────────────────────────────────────────────────────────────────
export const authService = {
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    const { data: profile, error: pErr } = await supabase
      .from('profiles').select('*').eq('id', data.user.id).single();
    if (pErr) throw new Error(pErr.message);

    return { user: mapProfile(profile) };
  },

  signup: async (payload: Partial<User> & { password: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email:    payload.email!,
      password: payload.password,
      options:  { data: { first_name: payload.firstName, last_name: payload.lastName } },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Signup failed');

    // Wait for the trigger to create the profile row
    await new Promise(res => setTimeout(res, 800));

    const { data: profile, error: pErr } = await supabase
      .from('profiles').select('*').eq('id', data.user.id).single();
    if (pErr) throw new Error(pErr.message);

    return { user: mapProfile(profile) };
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  getMe: async (): Promise<User> => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Unauthenticated');

    const { data: profile, error: pErr } = await supabase
      .from('profiles').select('*').eq('id', user.id).single();
    if (pErr) throw new Error(pErr.message);

    return mapProfile(profile);
  },

  updateProfile: async (updates: Partial<User>): Promise<User> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update({
        first_name:    updates.firstName,
        last_name:     updates.lastName,
        phone:         updates.phone,
        country:       updates.country,
        notifications: updates.notifications,
        two_factor:    updates.twoFactor,
      })
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapProfile(data);
  },
};

// ── Accounts ───────────────────────────────────────────────────────────────
export const accountService = {
  getAccounts: async (): Promise<Account[]> => {
    const { data, error } = await supabase
      .from('accounts').select('*').order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapAccount);
  },

  getAccount: async (id: string): Promise<Account> => {
    const { data, error } = await supabase
      .from('accounts').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return mapAccount(data);
  },
};

// ── Transactions ───────────────────────────────────────────────────────────
export const transactionService = {
  getTransactions: async (accountId?: string): Promise<Transaction[]> => {
    let query = supabase
      .from('transactions').select('*').order('date', { ascending: false });
    if (accountId) query = query.eq('account_id', accountId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapTransaction);
  },

  getTransaction: async (id: string): Promise<Transaction> => {
    const { data, error } = await supabase
      .from('transactions').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return mapTransaction(data);
  },
};

// ── Transfers ──────────────────────────────────────────────────────────────
export const transferService = {
  initiateTransfer: async (payload: TransferPayload): Promise<{ reference: string; status: string }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthenticated');

    // Look up destination account by the last 4 digits of its account_number
    const last4 = payload.toAccountNumber.replace(/\*/g, '').trim();
    const { data: toAccounts } = await supabase
      .from('accounts')
      .select('id')
      .ilike('account_number', `%${last4}`);

    const toAccount = toAccounts?.[0];
    if (!toAccount) throw new Error('Destination account not found');

    const { data: ref, error } = await supabase.rpc('execute_transfer', {
      p_from_account_id: payload.fromAccountId,
      p_to_account_id:   toAccount.id,
      p_user_id:         user.id,
      p_amount:          payload.amount,
      p_currency:        payload.currency,
      p_description:     payload.description,
      p_reference:       payload.reference ?? null,
    });
    if (error) throw new Error(error.message);
    return { reference: ref as string, status: 'completed' };
  },
};

// ── Cards ──────────────────────────────────────────────────────────────────
export const cardService = {
  getCards: async (): Promise<Card[]> => {
    const { data, error } = await supabase
      .from('cards').select('*').order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapCard);
  },

  toggleFreeze: async (cardId: string, freeze: boolean): Promise<Card> => {
    const { data, error } = await supabase
      .from('cards')
      .update({ status: freeze ? 'frozen' : 'active' })
      .eq('id', cardId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapCard(data);
  },
};

// ── Analytics ──────────────────────────────────────────────────────────────
export const analyticsService = {
  getAnalytics: async (): Promise<AnalyticsData[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthenticated');

    const since = new Date();
    since.setMonth(since.getMonth() - 7);

    const { data, error } = await supabase
      .from('transactions')
      .select('type, amount, date')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('date', since.toISOString());
    if (error) throw new Error(error.message);

    const map: Record<string, { income: number; expenses: number }> = {};
    for (const row of data ?? []) {
      const month = new Date(row.date).toLocaleString('default', { month: 'short' });
      if (!map[month]) map[month] = { income: 0, expenses: 0 };
      if (row.type === 'credit') map[month].income  += Number(row.amount);
      else                       map[month].expenses += Number(row.amount);
    }
    return Object.entries(map).map(([month, { income, expenses }]) => ({
      month, income, expenses, savings: income - expenses,
    }));
  },

  getSpendingCategories: async (): Promise<SpendingCategory[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthenticated');

    const { data, error } = await supabase
      .from('transactions')
      .select('category, amount')
      .eq('user_id', user.id)
      .eq('type', 'debit')
      .eq('status', 'completed');
    if (error) throw new Error(error.message);

    const colors: Record<string, string> = {
      shopping:   '#c9a84c',
      travel:     '#818cf8',
      utilities:  '#34d399',
      investment: '#60a5fa',
      payment:    '#f87171',
      transfer:   '#a78bfa',
      fee:        '#fb923c',
      salary:     '#34d399',
      deposit:    '#22d3ee',
      withdrawal: '#f43f5e',
    };

    const totals: Record<string, number> = {};
    let grand = 0;
    for (const row of data ?? []) {
      totals[row.category] = (totals[row.category] ?? 0) + Number(row.amount);
      grand += Number(row.amount);
    }

    return Object.entries(totals).map(([name, amount]) => ({
      name:       name.charAt(0).toUpperCase() + name.slice(1),
      amount,
      percentage: grand > 0 ? Math.round((amount / grand) * 100) : 0,
      color:      colors[name] ?? '#94a3b8',
    }));
  },
};

// ── Notifications ──────────────────────────────────────────────────────────
export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    const { data, error } = await supabase
      .from('notifications').select('*').order('date', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapNotification);
  },

  markRead: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications').update({ read: true }).eq('id', id);
    if (error) throw new Error(error.message);
  },
};

// ── Onboarding seed (runs once after signup) ───────────────────────────────
export const seedUserData = async (
  userId: string,
  firstName: string,
  lastName: string,
): Promise<void> => {
  const holderName = `${firstName.toUpperCase()} ${lastName.toUpperCase()}`;

  const { data: accounts, error: accErr } = await supabase
    .from('accounts')
    .insert([
      { user_id: userId, name: 'Private Checking',    type: 'checking',   balance: 10_000,  currency: 'USD', account_number: '3109624821', routing_number: '021000021', is_default: true  },
      { user_id: userId, name: 'Wealth Savings',      type: 'savings',    balance: 50_000,  currency: 'USD', account_number: '4821773400', routing_number: '021000021', is_default: false },
      { user_id: userId, name: 'Investment Portfolio', type: 'investment', balance: 25_000,  currency: 'USD', account_number: '7291229100', routing_number: '021000021', is_default: false },
      { user_id: userId, name: 'GBP Account',         type: 'foreign',    balance: 5_000,   currency: 'GBP', account_number: '5512123456', iban: 'GB29NWBK60161331926819', swift: 'NOBLGB2L', routing_number: '', is_default: false },
    ])
    .select();

  if (accErr || !accounts?.length) return;

  const checkingId = accounts[0].id;

  await supabase.from('cards').insert([
    { account_id: checkingId, user_id: userId, network: 'visa',       last4: '4821', expiry_month: '09', expiry_year: '27', holder_name: holderName, status: 'active', type: 'debit',   spend_limit: 50_000,  spent_this_month: 0, is_virtual: false, color: 'navy'  },
    { account_id: checkingId, user_id: userId, network: 'mastercard', last4: '7209', expiry_month: '03', expiry_year: '26', holder_name: holderName, status: 'active', type: 'credit',  spend_limit: 100_000, spent_this_month: 0, is_virtual: false, color: 'gold'  },
    { account_id: checkingId, user_id: userId, network: 'visa',       last4: '3391', expiry_month: '11', expiry_year: '27', holder_name: holderName, status: 'frozen', type: 'debit',                         spent_this_month: 0, is_virtual: true,  color: 'slate' },
  ]);

  await supabase.from('transactions').insert([
    { account_id: checkingId, user_id: userId, type: 'credit', category: 'salary',   amount: 18_500, currency: 'USD', description: 'Monthly Salary',           merchant: 'Employer',        status: 'completed', reference: 'SAL-INIT', date: new Date(new Date().setDate(1)).toISOString(),  processed_at: new Date(new Date().setDate(1)).toISOString() },
    { account_id: checkingId, user_id: userId, type: 'debit',  category: 'payment',  amount: 340,    currency: 'USD', description: 'Equinox Membership',        merchant: 'Equinox',         status: 'completed', reference: 'PMT-INIT', date: new Date(new Date().setDate(5)).toISOString(),  processed_at: new Date(new Date().setDate(5)).toISOString() },
    { account_id: checkingId, user_id: userId, type: 'debit',  category: 'utilities',amount: 420,    currency: 'USD', description: 'Electricity Bill',          merchant: 'ConEdison',       status: 'completed', reference: 'UTL-INIT', date: new Date(new Date().setDate(7)).toISOString(),  processed_at: new Date(new Date().setDate(7)).toISOString() },
    { account_id: checkingId, user_id: userId, type: 'debit',  category: 'shopping', amount: 1_200,  currency: 'USD', description: 'Online Shopping',           merchant: 'Amazon',          status: 'completed', reference: 'SHP-INIT', date: new Date(new Date().setDate(10)).toISOString(), processed_at: new Date(new Date().setDate(10)).toISOString() },
    { account_id: checkingId, user_id: userId, type: 'credit', category: 'deposit',  amount: 5_000,  currency: 'USD', description: 'Bank Transfer Received',    merchant: 'Noble Trust Bank',status: 'completed', reference: 'DEP-INIT', date: new Date(new Date().setDate(15)).toISOString(), processed_at: new Date(new Date().setDate(15)).toISOString() },
  ]);

  await supabase.from('notifications').insert([
    { user_id: userId, title: 'Welcome to Noble Trust Bank', message: 'Your private banking account is ready. Explore your dashboard to get started.', type: 'success', read: false },
    { user_id: userId, title: 'Accounts Created',            message: '4 accounts have been set up: Checking, Savings, Investment, and GBP.',          type: 'info',    read: false },
  ]);
};
