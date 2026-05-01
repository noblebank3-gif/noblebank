import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Users, Wallet, CreditCard, Activity, Save, RefreshCcw,
} from 'lucide-react';
import { adminService } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { toast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import type { Account, AdminUserSummary, Card, Transaction } from '@/types';

type DetailState = {
  accounts: Account[];
  transactions: Transaction[];
  cards: Card[];
};

const emptyDetail: DetailState = {
  accounts: [],
  transactions: [],
  cards: [],
};

export const AdminDashboardPage = () => {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [detail, setDetail] = useState<DetailState>(emptyDetail);
  const [search, setSearch] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [savingAccountId, setSavingAccountId] = useState<string | null>(null);
  const [balances, setBalances] = useState<Record<string, string>>({});

  const selectedUser = users.find(u => u.id === selectedUserId);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(user => [
      user.firstName,
      user.lastName,
      user.email,
      user.phone,
      user.country,
    ].some(value => value?.toLowerCase().includes(term)));
  }, [users, search]);

  const totalCustomers = users.filter(user => !user.isAdmin).length;
  const totalBalance = users.reduce((sum, user) => sum + user.totalBalance, 0);
  const totalAccounts = users.reduce((sum, user) => sum + user.accountCount, 0);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const nextUsers = await adminService.getUsers();
      setUsers(nextUsers);
      setSelectedUserId(current => current || nextUsers.find(user => !user.isAdmin)?.id || nextUsers[0]?.id || '');
    } catch (error) {
      toast.error('Admin data unavailable', error instanceof Error ? error.message : 'Unable to load users');
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
        adminService.getUserTransactions(userId, 25),
        adminService.getUserCards(userId),
      ]);
      setDetail({ accounts, transactions, cards });
      setBalances(Object.fromEntries(accounts.map(account => [account.id, String(account.balance)])));
    } catch (error) {
      toast.error('User data unavailable', error instanceof Error ? error.message : 'Unable to load user detail');
      setDetail(emptyDetail);
      setBalances({});
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadDetail(selectedUserId);
  }, [selectedUserId]);

  const handleBalanceSave = async (account: Account) => {
    const nextBalance = Number(balances[account.id]);
    if (!Number.isFinite(nextBalance) || nextBalance < 0) {
      toast.error('Invalid balance', 'Enter a valid non-negative amount');
      return;
    }

    setSavingAccountId(account.id);
    try {
      const updated = await adminService.updateAccountBalance(
        account.id,
        nextBalance,
        `Balance changed from ${formatCurrency(account.balance, account.currency)} to ${formatCurrency(nextBalance, account.currency)}`,
      );
      setDetail(prev => ({
        ...prev,
        accounts: prev.accounts.map(item => item.id === updated.id ? updated : item),
      }));
      setBalances(prev => ({ ...prev, [updated.id]: String(updated.balance) }));
      await loadUsers();
      await loadDetail(selectedUserId);
      toast.success('Balance updated', `${account.name} now shows ${formatCurrency(nextBalance, account.currency)}`);
    } catch (error) {
      toast.error('Update failed', error instanceof Error ? error.message : 'Unable to update balance');
    } finally {
      setSavingAccountId(null);
    }
  };

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Super Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">View every customer and update account balances.</p>
        </div>
        <Button
          variant="secondary"
          leftIcon={<RefreshCcw className="w-4 h-4" />}
          onClick={loadUsers}
          isLoading={isLoadingUsers}
        >
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Customers"
          value={String(totalCustomers)}
          icon={<Users className="w-5 h-5 text-gold-500" />}
          iconBg="bg-gold-500/10"
        />
        <StatCard
          label="Total Accounts"
          value={String(totalAccounts)}
          icon={<Wallet className="w-5 h-5 text-blue-400" />}
          iconBg="bg-blue-500/10"
          delay={0.05}
        />
        <StatCard
          label="Total Balances"
          value={formatCurrency(totalBalance, 'USD', true)}
          icon={<Activity className="w-5 h-5 text-emerald-400" />}
          iconBg="bg-emerald-500/10"
          delay={0.1}
        />
        <StatCard
          label="Selected Cards"
          value={String(detail.cards.length)}
          icon={<CreditCard className="w-5 h-5 text-purple-400" />}
          iconBg="bg-purple-500/10"
          delay={0.15}
        />
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <section className="lg:col-span-4 space-y-3">
          <div className="card p-4 space-y-4">
            <div>
              <h2 className="section-title">Users</h2>
              <p className="text-xs text-slate-500 mt-1">{filteredUsers.length} visible profiles</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search users"
                className="w-full h-10 bg-surface-elevated border border-surface-border rounded-lg pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
              />
            </div>
          </div>

          <div className="card divide-y divide-surface-border overflow-hidden">
            {isLoadingUsers ? (
              <div className="p-6 text-sm text-slate-400">Loading users...</div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <motion.button
                  key={user.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full text-left p-4 transition-colors ${
                    selectedUserId === user.id ? 'bg-gold-500/10' : 'hover:bg-surface-elevated'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center shrink-0">
                      <span className="text-navy-900 text-xs font-bold">
                        {getInitials(user.firstName, user.lastName)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{user.firstName} {user.lastName}</p>
                        {user.isAdmin && <Badge variant="gold">Admin</Badge>}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <p className="label-text">Accounts</p>
                      <p className="text-sm text-slate-300 font-mono">{user.accountCount}</p>
                    </div>
                    <div>
                      <p className="label-text">Balance</p>
                      <p className="text-sm text-gold-500 font-mono">{formatCurrency(user.totalBalance, 'USD', true)}</p>
                    </div>
                  </div>
                </motion.button>
              ))
            ) : (
              <div className="p-6 text-sm text-slate-500">No users match your search.</div>
            )}
          </div>
        </section>

        <section className="lg:col-span-8 space-y-6">
          {selectedUser ? (
            <>
              <div className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="label-text">Selected user</p>
                    <h2 className="text-xl font-bold text-white mt-1">{selectedUser.firstName} {selectedUser.lastName}</h2>
                    <p className="text-sm text-slate-400 mt-1">{selectedUser.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={selectedUser.isAdmin ? 'gold' : 'neutral'}>
                      {selectedUser.isAdmin ? 'Super Admin' : `${selectedUser.tier} Client`}
                    </Badge>
                    <Badge variant="info">{selectedUser.country || 'No country'}</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="section-title">Accounts</h2>
                <div className="card divide-y divide-surface-border overflow-hidden">
                  {isLoadingDetail ? (
                    <div className="p-6 text-sm text-slate-400">Loading accounts...</div>
                  ) : detail.accounts.length > 0 ? (
                    detail.accounts.map(account => (
                      <div key={account.id} className="p-4 grid grid-cols-1 xl:grid-cols-[1fr_220px_120px] gap-4 items-end">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white">{account.name}</p>
                            {account.isDefault && <Badge variant="gold">Default</Badge>}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {account.type} • {account.accountNumber} • {account.currency}
                          </p>
                          <p className="text-lg text-gold-500 font-mono mt-2">
                            {formatCurrency(account.balance, account.currency)}
                          </p>
                        </div>
                        <label className="space-y-1.5">
                          <span className="block text-sm font-medium text-slate-300">New balance</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={balances[account.id] ?? ''}
                            onChange={event => setBalances(prev => ({ ...prev, [account.id]: event.target.value }))}
                            className="w-full h-11 bg-surface-elevated border border-surface-border rounded-lg px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                          />
                        </label>
                        <Button
                          variant="gold"
                          leftIcon={<Save className="w-4 h-4" />}
                          onClick={() => handleBalanceSave(account)}
                          isLoading={savingAccountId === account.id}
                        >
                          Save
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-sm text-slate-500">No accounts found for this user.</div>
                  )}
                </div>
              </div>

              <div className="grid xl:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h2 className="section-title">Recent Transactions</h2>
                  <div className="card divide-y divide-surface-border overflow-hidden">
                    {detail.transactions.slice(0, 8).map(txn => {
                      const { variant, label } = statusBadge(txn.status);
                      return (
                        <div key={txn.id} className="p-4 flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${txn.type === 'credit' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{txn.description}</p>
                            <p className="text-xs text-slate-500">{formatDate(txn.date)}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-mono ${txn.type === 'credit' ? 'text-emerald-400' : 'text-white'}`}>
                              {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount, txn.currency)}
                            </p>
                            <Badge variant={variant}>{label}</Badge>
                          </div>
                        </div>
                      );
                    })}
                    {!isLoadingDetail && detail.transactions.length === 0 && (
                      <div className="p-6 text-sm text-slate-500">No transactions found.</div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="section-title">Cards</h2>
                  <div className="card divide-y divide-surface-border overflow-hidden">
                    {detail.cards.map(card => (
                      <div key={card.id} className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-white">{card.holderName}</p>
                            <p className="text-xs text-slate-500 capitalize">
                              {card.network} {card.type} • {card.expiryMonth}/{card.expiryYear}
                            </p>
                          </div>
                          <Badge variant={card.status === 'active' ? 'success' : card.status === 'frozen' ? 'warning' : 'neutral'}>
                            {card.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 rounded-xl bg-surface-elevated p-3">
                          <div>
                            <p className="label-text">Demo card number</p>
                            <p className="text-sm text-white font-mono mt-1">{card.demoCardNumber ?? `**** **** **** ${card.last4}`}</p>
                          </div>
                          <div>
                            <p className="label-text">Demo CVV</p>
                            <p className="text-sm text-white font-mono mt-1">{card.demoCvv ?? '---'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!isLoadingDetail && detail.cards.length === 0 && (
                      <div className="p-6 text-sm text-slate-500">No cards found.</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="card p-10 text-center text-slate-500">
              Select a user to inspect accounts and activity.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
