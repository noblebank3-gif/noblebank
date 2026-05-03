import { supabase } from '@/lib/supabase';
import type {
  User, Account, Transaction, Card,
  TransferPayload, AnalyticsData, SpendingCategory, Notification, AdminUserSummary,
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
    isAdmin:       r.is_admin ?? false,
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
    demoCardNumber: r.demo_card_number,
    demoCvv:        r.demo_cvv,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAdminUser(r: any): AdminUserSummary {
  return {
    ...mapProfile(r),
    accountCount: Number(r.account_count ?? 0),
    totalBalance: Number(r.total_balance ?? 0),
    lastActivity: r.last_activity ?? undefined,
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
      options:  { data: { first_name: payload.firstName, last_name: payload.lastName, phone: payload.phone } },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Signup failed');

    // If no session, email confirmation is ON — try signing in immediately
    if (!data.session) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email:    payload.email!,
        password: payload.password,
      });
      if (signInErr) {
        throw new Error('Account created! Please confirm your email then sign in.');
      }
    }

    // Wait for the trigger to create the profile row
    await new Promise(res => setTimeout(res, 1200));

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

    // Own-account transfer: toAccountId is provided — use atomic RPC directly
    if (payload.toAccountId) {
      const { data: ref, error } = await supabase.rpc('execute_transfer', {
        p_from_account_id: payload.fromAccountId,
        p_to_account_id:   payload.toAccountId,
        p_user_id:         user.id,
        p_amount:          payload.amount,
        p_currency:        payload.currency,
        p_description:     payload.description || 'Own account transfer',
        p_reference:       payload.reference ?? null,
      });
      if (error) throw new Error(error.message);
      return { reference: ref as string, status: 'completed' };
    }

    // External transfer: debit source + create outgoing transaction record
    const { data: ref, error } = await supabase.rpc('execute_external_transfer', {
      p_from_account_id:   payload.fromAccountId,
      p_user_id:           user.id,
      p_amount:            payload.amount,
      p_currency:          payload.currency,
      p_description:       payload.description || 'Bank Transfer',
      p_reference:         payload.reference ?? null,
      p_counterparty:      payload.toName,
      p_counterparty_bank: payload.toBankName,
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

// Admin
export const adminService = {
  getUsers: async (): Promise<AdminUserSummary[]> => {
    const { data, error } = await supabase.rpc('admin_get_users');
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapAdminUser);
  },

  getUserAccounts: async (userId: string): Promise<Account[]> => {
    const { data, error } = await supabase.rpc('admin_get_user_accounts', {
      p_user_id: userId,
    });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapAccount);
  },

  getUserTransactions: async (userId: string, limit = 50): Promise<Transaction[]> => {
    const { data, error } = await supabase.rpc('admin_get_user_transactions', {
      p_user_id: userId,
      p_limit: limit,
    });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapTransaction);
  },

  getUserCards: async (userId: string): Promise<Card[]> => {
    const { data, error } = await supabase.rpc('admin_get_user_cards', {
      p_user_id: userId,
    });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapCard);
  },

  updateAccountBalance: async (accountId: string, balance: number, note?: string): Promise<Account> => {
    const { data, error } = await supabase.rpc('admin_update_account_balance', {
      p_account_id: accountId,
      p_balance: balance,
      p_note: note ?? null,
    });
    if (error) throw new Error(error.message);
    return mapAccount(data);
  },
};

// ── Onboarding seed (runs once after signup) ───────────────────────────────
export const seedUserData = async (
  userId: string,
  firstName: string,
  lastName: string,
): Promise<void> => {
  const holderName = `${firstName.toUpperCase()} ${lastName.toUpperCase()}`;
  const rand = () => Math.floor(Math.random() * 9_000_000_000 + 1_000_000_000).toString();
  const [chkNum, savNum, invNum, gbpNum] = [rand(), rand(), rand(), rand()];
  const randCard = (prefix: string) => {
    const suffix = Math.floor(Math.random() * 9000 + 1000).toString();
    return { last4: suffix, full: `${prefix} ${suffix}` };
  };
  const visaDebit   = randCard('4111 1111 1111');
  const mcCredit    = randCard('5555 5555 5555');
  const visaVirtual = randCard('4000 0000 0000');
  const cvv = () => Math.floor(Math.random() * 900 + 100).toString();

  const { data: accounts, error: accErr } = await supabase
    .from('accounts')
    .insert([
      { user_id: userId, name: 'Private Checking',     type: 'checking',   balance: 0, currency: 'USD', account_number: chkNum, routing_number: '021000021', is_default: true  },
      { user_id: userId, name: 'Wealth Savings',       type: 'savings',    balance: 0, currency: 'USD', account_number: savNum, routing_number: '021000021', is_default: false },
      { user_id: userId, name: 'Investment Portfolio', type: 'investment', balance: 0, currency: 'USD', account_number: invNum, routing_number: '021000021', is_default: false },
      { user_id: userId, name: 'GBP Account',          type: 'foreign',    balance: 0, currency: 'GBP', account_number: gbpNum, iban: `GB${gbpNum.slice(0, 20)}`, swift: 'NOBLGB2L', routing_number: '', is_default: false },
    ])
    .select();

  if (accErr) throw new Error(accErr.message);
  if (!accounts?.length) throw new Error('Failed to create starter accounts');

  const checkingId = accounts[0].id;

  const { error: cardErr } = await supabase.from('cards').insert([
    { account_id: checkingId, user_id: userId, network: 'visa',       last4: visaDebit.last4,   demo_card_number: visaDebit.full,   demo_cvv: cvv(), expiry_month: '09', expiry_year: '27', holder_name: holderName, status: 'active', type: 'debit',  spend_limit: 50_000,  spent_this_month: 0, is_virtual: false, color: 'navy'  },
    { account_id: checkingId, user_id: userId, network: 'mastercard', last4: mcCredit.last4,    demo_card_number: mcCredit.full,    demo_cvv: cvv(), expiry_month: '03', expiry_year: '26', holder_name: holderName, status: 'active', type: 'credit', spend_limit: 100_000, spent_this_month: 0, is_virtual: false, color: 'gold'  },
    { account_id: checkingId, user_id: userId, network: 'visa',       last4: visaVirtual.last4, demo_card_number: visaVirtual.full, demo_cvv: cvv(), expiry_month: '11', expiry_year: '27', holder_name: holderName, status: 'frozen', type: 'debit',                        spent_this_month: 0, is_virtual: true,  color: 'slate' },
  ]);
  if (cardErr) throw new Error(cardErr.message);

  const { error: notifErr } = await supabase.from('notifications').insert([
    { user_id: userId, title: 'Welcome to Noble Trust Bank', message: 'Your private banking account is ready. Explore your dashboard to get started.', type: 'success', read: false },
    { user_id: userId, title: 'Accounts Created',            message: '4 accounts have been set up: Checking, Savings, Investment, and GBP — all starting at $0.',          type: 'info', read: false },
  ]);
  if (notifErr) throw new Error(notifErr.message);
};
