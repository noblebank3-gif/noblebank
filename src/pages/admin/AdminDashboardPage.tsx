import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Users, Wallet, CreditCard, Activity, Save, RefreshCcw,
  ArrowLeftRight, Phone, MapPin, X, ArrowUpRight, ArrowDownLeft,
  ChevronLeft,
} from 'lucide-react';
import { adminService } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import type { Account, AdminUserSummary, Card, Transaction } from '@/types';

type Tab = 'accounts' | 'transactions' | 'cards';
type MobileView = 'list' | 'detail';
type DetailState = { accounts: Account[]; transactions: Transaction[]; cards: Card[] };
const emptyDetail: DetailState = { accounts: [], transactions: [], cards: [] };

export const AdminDashboardPage = () => {
  const [users, setUsers]               = useState<AdminUserSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [detail, setDetail]             = useState<DetailState>(emptyDetail);
  const [search, setSearch]             = useState('');
  const [activeTab, setActiveTab]       = useState<Tab>('accounts');
  const [mobileView, setMobileView]     = useState<MobileView>('list');
  const [isLoadingUsers, setIsLoadingUsers]   = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [savingAccountId, setSavingAccountId] = useState<string | null>(null);
  const [balances, setBalances]         = useState<Record<string, string>>({});

  const selectedUser = users.find(u => u.id === selectedUserId);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(u =>
      [u.firstName, u.lastName, u.email, u.phone, u.country]
        .some(v => v?.toLowerCase().includes(term)),
    );
  }, [users, search]);

  const totalCustomers = users.filter(u => !u.isAdmin).length;
  const totalBalance   = users.reduce((s, u) => s + u.totalBalance, 0);
  const totalAccounts  = users.reduce((s, u) => s + u.accountCount, 0);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const data = await adminService.getUsers();
      setUsers(data);
      setSelectedUserId(cur => cur || data.find(u => !u.isAdmin)?.id || data[0]?.id || '');
    } catch (err) {
      toast.error('Failed to load users', err instanceof Error ? err.message : '');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadDetail = async (userId: string) => {
    if (!userId) return;
    setIsLoadingDetail(true);
    try {
      const [accounts, transactions, cards] = await Promise.all([
        adminService.getUserAccounts(userId),
        adminService.getUserTransactions(userId, 50),
        adminService.getUserCards(userId),
      ]);
      setDetail({ accounts, transactions, cards });
      setBalances(Object.fromEntries(accounts.map(a => [a.id, String(a.balance)])));
    } catch (err) {
      toast.error('Failed to load user data', err instanceof Error ? err.message : '');
      setDetail(emptyDetail);
      setBalances({});
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { if (selectedUserId) loadDetail(selectedUserId); }, [selectedUserId]);

  const selectUser = (userId: string) => {
    setSelectedUserId(userId);
    setMobileView('detail');
    setActiveTab('accounts');
  };

  const handleBalanceSave = async (account: Account) => {
    const next = Number(balances[account.id]);
    if (!Number.isFinite(next) || next < 0) {
      toast.error('Invalid balance', 'Enter a valid non-negative amount');
      return;
    }
    setSavingAccountId(account.id);
    try {
      const updated = await adminService.updateAccountBalance(
        account.id, next,
        `Balance changed from ${formatCurrency(account.balance, account.currency)} to ${formatCurrency(next, account.currency)}`,
      );
      setDetail(prev => ({
        ...prev,
        accounts: prev.accounts.map(a => a.id === updated.id ? updated : a),
      }));
      setBalances(prev => ({ ...prev, [updated.id]: String(updated.balance) }));
      await Promise.all([loadUsers(), loadDetail(selectedUserId)]);
      toast.success('Balance updated', `${account.name}: ${formatCurrency(next, account.currency)}`);
    } catch (err) {
      toast.error('Update failed', err instanceof Error ? err.message : '');
    } finally {
      setSavingAccountId(null);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'accounts',     label: 'Accounts',    icon: Wallet,         count: detail.accounts.length     },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight, count: detail.transactions.length },
    { id: 'cards',        label: 'Cards',        icon: CreditCard,     count: detail.cards.length        },
  ];

  return (
    <div className="max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Admin Console</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage customers and account balances</p>
        </div>
        <Button
          variant="secondary"
          leftIcon={<RefreshCcw className="w-4 h-4" />}
          onClick={loadUsers}
          isLoading={isLoadingUsers}
          size="sm"
        >
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Customers"
          value={isLoadingUsers ? '—' : String(totalCustomers)}
          icon={<Users className="w-5 h-5 text-gold-500" />}
          iconBg="bg-gold-500/10"
          delay={0}
        />
        <StatCard
          label="Total Accounts"
          value={isLoadingUsers ? '—' : String(totalAccounts)}
          icon={<Wallet className="w-5 h-5 text-blue-400" />}
          iconBg="bg-blue-500/10"
          delay={0.05}
        />
        <StatCard
          label="AUM"
          value={isLoadingUsers ? '—' : formatCurrency(totalBalance, 'USD', true)}
          icon={<Activity className="w-5 h-5 text-emerald-400" />}
          iconBg="bg-emerald-500/10"
          delay={0.1}
        />
        <StatCard
          label="User Cards"
          value={isLoadingDetail ? '—' : String(detail.cards.length)}
          icon={<CreditCard className="w-5 h-5 text-purple-400" />}
          iconBg="bg-purple-500/10"
          delay={0.15}
        />
      </div>

      {/* Main layout — two-column on lg+, single-panel on mobile */}
      <div className="grid lg:grid-cols-12 gap-5">

        {/* ── User List ─────────────────────────────────── */}
        <aside className={`lg:col-span-4 flex-col gap-3 ${mobileView === 'detail' ? 'hidden lg:flex' : 'flex'}`}>
          {/* Search */}
          <div className="card p-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email, phone…"
                className="w-full h-10 bg-surface-elevated border border-surface-border rounded-lg pl-10 pr-9 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 pl-1">
              {filteredUsers.length} of {users.length} users
            </p>
          </div>

          {/* User rows */}
          <div className="card overflow-hidden">
            {isLoadingUsers ? (
              <div className="divide-y divide-surface-border">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 space-y-2.5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-44" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-40 ml-12" />
                  </div>
                ))}
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="divide-y divide-surface-border lg:max-h-[62vh] lg:overflow-y-auto">
                {filteredUsers.map((user, i) => (
                  <motion.button
                    key={user.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18, delay: i * 0.025 }}
                    type="button"
                    onClick={() => selectUser(user.id)}
                    className={`w-full text-left px-4 py-3.5 transition-colors border-l-2 ${
                      selectedUserId === user.id
                        ? 'bg-gold-500/10 border-l-gold-500'
                        : 'border-l-transparent hover:bg-surface-elevated'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        user.isAdmin ? 'bg-red-500/20 text-red-300' : 'bg-gradient-gold text-navy-900'
                      }`}>
                        {getInitials(user.firstName, user.lastName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-sm font-semibold text-white truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          {user.isAdmin && (
                            <Badge variant="error" className="shrink-0 text-[10px]">Admin</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pl-12">
                      <span className="text-xs text-slate-500 capitalize">
                        {user.tier} · {user.accountCount} acct{user.accountCount !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs font-mono text-gold-500">
                        {formatCurrency(user.totalBalance, 'USD', true)}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-slate-500">
                No users match your search
              </div>
            )}
          </div>
        </aside>

        {/* ── Detail Panel ──────────────────────────────── */}
        <section className={`lg:col-span-8 space-y-4 ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
          {selectedUser ? (
            <>
              {/* Mobile back button */}
              <button
                type="button"
                onClick={() => setMobileView('list')}
                className="lg:hidden flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to users
              </button>

              {/* User profile card */}
              <motion.div
                key={selectedUser.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="card p-4 sm:p-5"
              >
                <div className="flex gap-4">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 text-base sm:text-lg font-bold ${
                    selectedUser.isAdmin ? 'bg-red-500/20 text-red-300' : 'bg-gradient-gold text-navy-900'
                  }`}>
                    {getInitials(selectedUser.firstName, selectedUser.lastName)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </h2>
                      <Badge variant={selectedUser.isAdmin ? 'error' : 'gold'}>
                        {selectedUser.isAdmin ? 'Super Admin' : `${selectedUser.tier} Client`}
                      </Badge>
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                      <span className="text-xs sm:text-sm text-slate-400 truncate">{selectedUser.email}</span>
                      {selectedUser.phone && (
                        <span className="flex items-center gap-1 text-xs sm:text-sm text-slate-400">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          {selectedUser.phone}
                        </span>
                      )}
                      {selectedUser.country && (
                        <span className="flex items-center gap-1 text-xs sm:text-sm text-slate-400">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {selectedUser.country}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick stats row */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-surface-border">
                  <div>
                    <p className="label-text">Accounts</p>
                    <p className="text-xl font-bold text-white font-mono mt-0.5">
                      {selectedUser.accountCount}
                    </p>
                  </div>
                  <div>
                    <p className="label-text">Total Balance</p>
                    <p className="text-xl font-bold text-gold-500 font-mono mt-0.5">
                      {formatCurrency(selectedUser.totalBalance, 'USD', true)}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Tabbed card */}
              <div className="card overflow-hidden">
                {/* Tab bar */}
                <div className="flex border-b border-surface-border overflow-x-auto">
                  {tabs.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id)}
                      className={`flex items-center gap-2 px-4 sm:px-5 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                        activeTab === t.id
                          ? 'border-gold-500 text-gold-500'
                          : 'border-transparent text-slate-400 hover:text-white'
                      }`}
                    >
                      <t.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{t.label}</span>
                      <span className="sm:hidden">{t.label.slice(0, 4)}</span>
                      <span className={`text-xs rounded-full px-1.5 py-0.5 font-mono min-w-[1.25rem] text-center ${
                        activeTab === t.id
                          ? 'bg-gold-500/20 text-gold-400'
                          : 'bg-surface-elevated text-slate-500'
                      }`}>
                        {t.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="min-h-[240px]">
                  {isLoadingDetail ? (
                    <div className="p-5 space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-56" />
                          </div>
                          <Skeleton className="h-9 w-20 rounded-lg shrink-0" />
                        </div>
                      ))}
                    </div>

                  ) : activeTab === 'accounts' ? (
                    detail.accounts.length > 0 ? (
                      <div className="divide-y divide-surface-border">
                        {detail.accounts.map(account => (
                          <div key={account.id} className="p-4 sm:p-5">
                            <div className="flex flex-col gap-4">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold text-white">{account.name}</p>
                                  {account.isDefault && <Badge variant="gold">Default</Badge>}
                                  <Badge variant="neutral" className="capitalize">{account.type}</Badge>
                                </div>
                                <p className="text-xs text-slate-500 font-mono mt-1">
                                  {account.accountNumber} · {account.currency}
                                </p>
                                <p className="text-xl font-bold text-gold-500 font-mono mt-2">
                                  {formatCurrency(account.balance, account.currency)}
                                </p>
                              </div>
                              <div className="flex items-end gap-2">
                                <label className="flex-1 space-y-1.5">
                                  <span className="block text-xs font-medium text-slate-400">
                                    New balance ({account.currency})
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={balances[account.id] ?? ''}
                                    onChange={e => setBalances(prev => ({ ...prev, [account.id]: e.target.value }))}
                                    className="w-full h-10 bg-surface-elevated border border-surface-border rounded-lg px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                                  />
                                </label>
                                <Button
                                  variant="gold"
                                  size="sm"
                                  leftIcon={<Save className="w-3.5 h-3.5" />}
                                  onClick={() => handleBalanceSave(account)}
                                  isLoading={savingAccountId === account.id}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center text-sm text-slate-500">No accounts found</div>
                    )

                  ) : activeTab === 'transactions' ? (
                    detail.transactions.length > 0 ? (
                      <div className="divide-y divide-surface-border max-h-[55vh] overflow-y-auto">
                        {detail.transactions.map(txn => {
                          const { variant, label } = statusBadge(txn.status);
                          const isCredit = txn.type === 'credit';
                          return (
                            <div key={txn.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                isCredit ? 'bg-emerald-500/10' : 'bg-red-500/10'
                              }`}>
                                {isCredit
                                  ? <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                                  : <ArrowUpRight className="w-4 h-4 text-red-400" />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{txn.description}</p>
                                <p className="text-xs text-slate-500">
                                  {formatDate(txn.date)} · <span className="capitalize">{txn.category}</span>
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className={`text-sm font-semibold font-mono ${isCredit ? 'text-emerald-400' : 'text-white'}`}>
                                  {isCredit ? '+' : '−'}{formatCurrency(txn.amount, txn.currency)}
                                </p>
                                <Badge variant={variant} dot>{label}</Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-16 text-center text-sm text-slate-500">No transactions found</div>
                    )

                  ) : (
                    detail.cards.length > 0 ? (
                      <div className="grid sm:grid-cols-2 gap-4 p-4 sm:p-5">
                        {detail.cards.map(card => (
                          <div key={card.id} className="bg-surface-elevated rounded-2xl p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-white capitalize">
                                  {card.network} {card.type}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {card.isVirtual ? 'Virtual' : 'Physical'} · Exp {card.expiryMonth}/{card.expiryYear}
                                </p>
                              </div>
                              <Badge variant={
                                card.status === 'active' ? 'success'
                                  : card.status === 'frozen' ? 'info'
                                  : 'neutral'
                              }>
                                {card.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-3 bg-surface-card rounded-xl p-3">
                              <div>
                                <p className="label-text">Card number</p>
                                <p className="text-xs sm:text-sm text-white font-mono mt-1 break-all">
                                  {card.demoCardNumber ?? `**** **** **** ${card.last4}`}
                                </p>
                              </div>
                              <div>
                                <p className="label-text">CVV</p>
                                <p className="text-sm text-white font-mono mt-1">{card.demoCvv ?? '—'}</p>
                              </div>
                            </div>
                            {card.spendLimit ? (
                              <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                  <span className="text-slate-400">Monthly spend</span>
                                  <span className="text-white font-mono text-xs">
                                    {formatCurrency(card.spentThisMonth)} / {formatCurrency(card.spendLimit)}
                                  </span>
                                </div>
                                <div className="h-1.5 bg-surface-card rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-gold rounded-full transition-all"
                                    style={{ width: `${Math.min((card.spentThisMonth / card.spendLimit) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center text-sm text-slate-500">No cards found</div>
                    )
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card p-12 sm:p-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-surface-elevated flex items-center justify-center mx-auto">
                <Users className="w-7 h-7 text-slate-600" />
              </div>
              <div>
                <p className="text-slate-300 font-semibold">No user selected</p>
                <p className="text-slate-500 text-sm mt-1">
                  Choose a customer from the list to view their accounts, transactions, and cards
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
