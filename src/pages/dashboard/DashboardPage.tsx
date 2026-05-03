import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpRight, ArrowDownLeft, ArrowLeftRight,
  CreditCard, TrendingUp, Wallet, Eye, EyeOff,
  Plus, ExternalLink,
} from 'lucide-react';
import { useAccountStore } from '@/store/accountStore';
import { useAuthStore } from '@/store/authStore';
import { StatCard } from '@/components/ui/StatCard';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AccountCardSkeleton, TransactionSkeleton, StatCardSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CategoryIcon } from '@/lib/categoryIcons';
import { useState } from 'react';
import type { Account, Transaction } from '@/types';

const AccountCard = ({ account, isSelected, onClick }: {
  account: Account;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const [balanceHidden, setBalanceHidden] = useState(false);

  const gradients: Record<string, string> = {
    checking:   'bg-gradient-card',
    savings:    'bg-gradient-to-br from-navy-700 to-navy-900',
    investment: 'bg-gradient-to-br from-blue-900/60 to-navy-900',
    foreign:    'bg-gradient-to-br from-navy-800 to-navy-950',
  };

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-5 border transition-all duration-200 ${
        isSelected
          ? 'border-gold-500/40 shadow-gold'
          : 'border-surface-border hover:border-surface-elevated'
      } ${gradients[account.type]}`}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{account.type}</p>
          <p className="text-white font-semibold mt-0.5">{account.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-400">{account.accountNumber}</span>
          {account.isDefault && (
            <Badge variant="gold" className="text-[10px]">Default</Badge>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-500 mb-1">Available Balance</p>
          {balanceHidden ? (
            <p className="text-2xl font-bold text-white font-mono">••••••</p>
          ) : (
            <p className="text-2xl font-bold text-white font-mono">
              {formatCurrency(account.balance, account.currency)}
            </p>
          )}
          <p className="text-xs text-slate-500 mt-0.5">{account.currency}</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); setBalanceHidden(h => !h); }}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label={balanceHidden ? 'Show balance' : 'Hide balance'}
        >
          {balanceHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>
    </motion.button>
  );
};

const TransactionRow = ({ txn, delay }: { txn: Transaction; delay: number }) => {
  const { variant, label } = statusBadge(txn.status);
  const isCredit = txn.type === 'credit';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-elevated transition-colors duration-150 group"
    >
      <CategoryIcon category={txn.category} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{txn.description}</p>
        <p className="text-xs text-slate-500 mt-0.5">{formatDate(txn.date)}</p>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={variant} dot>{label}</Badge>
        <span className={`text-sm font-semibold font-mono ${
          isCredit ? 'text-emerald-400' : 'text-white'
        }`}>
          {isCredit ? '+' : '−'}{formatCurrency(txn.amount, txn.currency)}
        </span>
      </div>
    </motion.div>
  );
};

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const {
    accounts, transactions, selectedAccountId,
    isLoadingAccounts, isLoadingTransactions,
    selectAccount, fetchTransactions, getTotalBalance, getMonthlyStats,
  } = useAccountStore();

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const recentTxns   = transactions.slice(0, 6);
  const totalBalance = getTotalBalance();
  const { income: monthlyIncome, spend: monthlySpend } = getMonthlyStats();

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <p className="text-slate-400 text-sm">{getGreeting()},</p>
          <h1 className="text-2xl font-bold text-white mt-0.5">
            {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-gold-500 text-xs capitalize mt-1 font-medium">
            {user?.tier} Banking Client
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/dashboard/transfer">
            <Button variant="gold" leftIcon={<ArrowLeftRight className="w-4 h-4" />}>
              Send Money
            </Button>
          </Link>
          <Button variant="secondary" leftIcon={<Plus className="w-4 h-4" />}>
            Add Account
          </Button>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingAccounts && accounts.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Balance"
              value={formatCurrency(totalBalance, 'USD', true)}
              icon={<Wallet className="w-5 h-5 text-gold-500" />}
              iconBg="bg-gold-500/10"
              changeLabel="across all accounts"
              delay={0}
            />
            <StatCard
              label="Monthly Income"
              value={formatCurrency(monthlyIncome)}
              icon={<ArrowDownLeft className="w-5 h-5 text-emerald-400" />}
              iconBg="bg-emerald-500/10"
              changeLabel="this month"
              delay={0.05}
            />
            <StatCard
              label="Monthly Spend"
              value={formatCurrency(monthlySpend)}
              icon={<ArrowUpRight className="w-5 h-5 text-blue-400" />}
              iconBg="bg-blue-500/10"
              changeLabel="this month"
              delay={0.1}
            />
            <StatCard
              label="Active Accounts"
              value={String(accounts.length)}
              icon={<TrendingUp className="w-5 h-5 text-purple-400" />}
              iconBg="bg-purple-500/10"
              changeLabel="across all currencies"
              delay={0.15}
            />
          </>
        )}
      </div>

      {/* Accounts + Transactions split */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Accounts list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title">My Accounts</h2>
            <button type="button" className="text-xs text-gold-500 hover:text-gold-400 transition-colors flex items-center gap-1">
              Manage <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {isLoadingAccounts && accounts.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => <AccountCardSkeleton key={i} />)
            ) : (
              accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  isSelected={account.id === selectedAccountId}
                  onClick={() => selectAccount(account.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Recent Transactions</h2>
            <Link
              to="/dashboard/transactions"
              className="text-xs text-gold-500 hover:text-gold-400 transition-colors flex items-center gap-1"
            >
              View all <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="card divide-y divide-surface-border">
            {isLoadingTransactions && transactions.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => <TransactionSkeleton key={i} />)
            ) : recentTxns.length > 0 ? (
              recentTxns.map((txn, i) => (
                <TransactionRow key={txn.id} txn={txn} delay={i * 0.04} />
              ))
            ) : (
              <div className="py-16 text-center text-slate-500 text-sm">
                No transactions yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="section-title mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Send Money',   icon: ArrowUpRight,   to: '/dashboard/transfer',     color: 'text-gold-500',    bg: 'bg-gold-500/10'    },
            { label: 'Receive',      icon: ArrowDownLeft,  to: '/dashboard/transfer',     color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'My Cards',     icon: CreditCard,     to: '/dashboard/cards',        color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
            { label: 'Analytics',   icon: TrendingUp,     to: '/dashboard/analytics',    color: 'text-purple-400',  bg: 'bg-purple-500/10'  },
          ].map((action) => (
            <Link key={action.label} to={action.to}>
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="card p-4 flex flex-col items-center gap-3 hover:border-surface-elevated transition-all duration-150 cursor-pointer"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${action.bg}`}>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <span className="text-sm font-medium text-slate-300">{action.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
